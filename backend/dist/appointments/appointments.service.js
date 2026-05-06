"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const appointment_entity_1 = require("./entities/appointment.entity");
const typeorm_2 = require("@nestjs/typeorm");
const doctor_entity_1 = require("../doctors/entities/doctor.entity");
const user_entity_1 = require("../users/entities/user.entity");
let AppointmentsService = class AppointmentsService {
    constructor(repo, doctorsRepo, usersRepo) {
        this.repo = repo;
        this.doctorsRepo = doctorsRepo;
        this.usersRepo = usersRepo;
    }
    async create(data) {
        const appointment = await this.prepareAppointmentData(data);
        return this.repo.save({ ...appointment, status: 'pending' });
    }
    findAll(user) {
        if (!user) {
            return this.repo.find();
        }
        if (user.role === 'user') {
            return this.repo.find({ where: { patientId: user.id } });
        }
        if (user.role === 'doctor') {
            return this.repo.find({ where: { doctorId: user.id } });
        }
        return this.repo.find();
    }
    async findOne(id) {
        return this.repo.findOne({ where: { id } });
    }
    async confirm(id, user) {
        const appointment = await this.findOne(id);
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (user.role !== 'doctor' || appointment.doctorId !== user.id) {
            throw new common_1.UnauthorizedException('Only the assigned doctor can confirm this appointment');
        }
        if (appointment.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending appointments can be confirmed');
        }
        await this.repo.update(id, { status: 'confirmed' });
        return this.findOne(id);
    }
    async complete(id, user) {
        const appointment = await this.findOne(id);
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (user.role !== 'doctor' || appointment.doctorId !== user.id) {
            throw new common_1.UnauthorizedException('Only the assigned doctor can complete this appointment');
        }
        if (appointment.status !== 'confirmed') {
            throw new common_1.BadRequestException('Only confirmed appointments can be completed');
        }
        await this.repo.update(id, { status: 'completed' });
        return this.findOne(id);
    }
    async update(id, data, user) {
        const appointment = await this.findOne(id);
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (user.role !== 'user' || appointment.patientId !== user.id) {
            throw new common_1.UnauthorizedException('Only the appointment owner can update this appointment');
        }
        if (appointment.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending appointments can be rescheduled');
        }
        const updatedFields = {};
        if (data.date) {
            updatedFields.date = data.date;
        }
        if (data.time !== undefined) {
            updatedFields.time = data.time;
        }
        if (data.symptoms !== undefined) {
            updatedFields.symptoms = data.symptoms;
        }
        if (Object.keys(updatedFields).length === 0) {
            return this.findOne(id);
        }
        await this.prepareAppointmentData({ ...appointment, ...updatedFields }, id);
        await this.repo.update(id, updatedFields);
        return this.findOne(id);
    }
    async cancel(id, user) {
        const appointment = await this.findOne(id);
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (user.role === 'user' && appointment.patientId !== user.id) {
            throw new common_1.UnauthorizedException('Not authorized to cancel this appointment');
        }
        if (user.role === 'doctor' && appointment.doctorId !== user.id) {
            throw new common_1.UnauthorizedException('Not authorized to cancel this appointment');
        }
        if (appointment.status === 'completed') {
            throw new common_1.BadRequestException('Completed appointments cannot be cancelled');
        }
        await this.repo.update(id, { status: 'cancelled' });
        return this.findOne(id);
    }
    async prepareAppointmentData(data, appointmentId) {
        const doctorId = Number(data.doctorId);
        const date = typeof data.date === 'string' ? data.date.trim() : '';
        const time = typeof data.time === 'string' ? data.time.trim() : data.time;
        if (!Number.isInteger(doctorId) || doctorId <= 0) {
            throw new common_1.BadRequestException('A valid doctor is required');
        }
        if (!date) {
            throw new common_1.BadRequestException('Appointment date is required');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new common_1.BadRequestException('Appointment date must use YYYY-MM-DD format');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appointmentDate = new Date(`${date}T00:00:00`);
        if (Number.isNaN(appointmentDate.getTime()) || appointmentDate < today) {
            throw new common_1.BadRequestException('Appointment date cannot be in the past');
        }
        if (time && !/^\d{2}:\d{2}$/.test(time)) {
            throw new common_1.BadRequestException('Appointment time must use HH:mm format');
        }
        const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
        if (!doctor) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        if (time) {
            const existing = await this.repo.findOne({
                where: { doctorId, date, time },
            });
            if (existing &&
                existing.id !== appointmentId &&
                existing.status !== 'cancelled' &&
                existing.status !== 'completed') {
                throw new common_1.BadRequestException('This doctor already has an appointment at that time');
            }
        }
        return {
            ...data,
            doctorId,
            date,
            time: time || null,
            symptoms: typeof data.symptoms === 'string'
                ? data.symptoms.trim()
                : data.symptoms,
        };
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(appointment_entity_1.Appointment)),
    __param(1, (0, typeorm_2.InjectRepository)(doctor_entity_1.Doctor)),
    __param(2, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map
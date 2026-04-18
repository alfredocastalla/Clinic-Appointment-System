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
let AppointmentsService = class AppointmentsService {
    constructor(repo) {
        this.repo = repo;
    }
    create(data) {
        return this.repo.save({ ...data, status: 'pending' });
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
        await this.repo.update(id, { status: 'confirmed' });
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
        await this.repo.update(id, { status: 'cancelled' });
        return this.findOne(id);
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(appointment_entity_1.Appointment)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map
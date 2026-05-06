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
exports.PrescriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const prescription_entity_1 = require("./entities/prescription.entity");
let PrescriptionsService = class PrescriptionsService {
    constructor(prescriptionsRepo) {
        this.prescriptionsRepo = prescriptionsRepo;
    }
    async create(data, user) {
        if (user.role !== 'doctor') {
            throw new common_1.UnauthorizedException('Only doctors can create prescriptions');
        }
        const prescription = this.prescriptionsRepo.create({
            ...data,
            doctorId: user.id,
            doctorName: user.name,
            date: data.date || new Date().toISOString().split('T')[0],
        });
        return this.prescriptionsRepo.save(prescription);
    }
    findAll(user) {
        if (!user) {
            return this.prescriptionsRepo.find();
        }
        if (user.role === 'doctor') {
            return this.prescriptionsRepo.find({ where: { doctorId: user.id } });
        }
        if (user.role === 'user') {
            return this.prescriptionsRepo.find({ where: { patientId: user.id } });
        }
        return this.prescriptionsRepo.find();
    }
};
exports.PrescriptionsService = PrescriptionsService;
exports.PrescriptionsService = PrescriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(prescription_entity_1.Prescription)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PrescriptionsService);
//# sourceMappingURL=prescriptions.service.js.map
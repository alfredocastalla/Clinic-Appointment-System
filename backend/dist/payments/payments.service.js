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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const payment_method_entity_1 = require("./entities/payment-method.entity");
let PaymentsService = class PaymentsService {
    constructor(paymentRepo, paymentMethodRepo) {
        this.paymentRepo = paymentRepo;
        this.paymentMethodRepo = paymentMethodRepo;
    }
    async createPayment(data) {
        return this.paymentRepo.save(this.paymentRepo.create(data));
    }
    async findPayments(user) {
        if (!user) {
            return this.paymentRepo.find();
        }
        if (user.role === 'user') {
            return this.paymentRepo.find({ where: { patientId: user.id } });
        }
        if (user.role === 'doctor' || user.role === 'admin') {
            return this.paymentRepo.find();
        }
        throw new common_1.UnauthorizedException('Only patients, doctors, or admins can view payments');
    }
    async createPaymentMethod(data) {
        if (!data.patientId) {
            throw new common_1.UnauthorizedException('Patient must be specified');
        }
        if (data.isDefault) {
            await this.paymentMethodRepo.update({ patientId: data.patientId }, { isDefault: false });
        }
        return this.paymentMethodRepo.save(this.paymentMethodRepo.create(data));
    }
    async findPaymentMethods(user) {
        if (!user) {
            return this.paymentMethodRepo.find();
        }
        if (user.role !== 'user') {
            throw new common_1.UnauthorizedException('Only patients can view payment methods');
        }
        return this.paymentMethodRepo.find({ where: { patientId: user.id } });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_method_entity_1.PaymentMethod)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map
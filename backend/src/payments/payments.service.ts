import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepo: Repository<PaymentMethod>,
  ) {}

  async createPayment(data: Partial<Payment>) {
    return this.paymentRepo.save(this.paymentRepo.create(data));
  }

  async findPayments(user: any) {
    if (!user) {
      return this.paymentRepo.find();
    }
    if (user.role !== 'user') {
      throw new UnauthorizedException('Only patients can view payments');
    }
    return this.paymentRepo.find({ where: { patientId: user.id } });
  }

  async createPaymentMethod(data: Partial<PaymentMethod>) {
    if (!data.patientId) {
      throw new UnauthorizedException('Patient must be specified');
    }
    if (data.isDefault) {
      await this.paymentMethodRepo.update({ patientId: data.patientId }, { isDefault: false });
    }
    return this.paymentMethodRepo.save(this.paymentMethodRepo.create(data));
  }

  async findPaymentMethods(user: any) {
    if (!user) {
      return this.paymentMethodRepo.find();
    }
    if (user.role !== 'user') {
      throw new UnauthorizedException('Only patients can view payment methods');
    }
    return this.paymentMethodRepo.find({ where: { patientId: user.id } });
  }
}

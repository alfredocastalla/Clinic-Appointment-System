import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentMethodsController } from './payment-methods.controller';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentMethod])],
  controllers: [PaymentsController, PaymentMethodsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}

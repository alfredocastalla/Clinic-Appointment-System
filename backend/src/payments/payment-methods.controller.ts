import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { RequestWithUser } from '../auth/types';

@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.paymentsService.findPaymentMethods(req.user);
  }

  @Post()
  async create(@Request() req: RequestWithUser, @Body() body: Partial<any>) {
    if (req.user.role !== 'user') {
      throw new UnauthorizedException('Only patients may add payment methods');
    }

    return this.paymentsService.createPaymentMethod({
      ...body,
      patientId: req.user.id,
    });
  }
}

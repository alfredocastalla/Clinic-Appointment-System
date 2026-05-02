import { Controller, Get, Post, Body, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(@Request() req: any, @Body() body: Partial<any>) {
    if (req.user.role !== 'user') {
      throw new UnauthorizedException('Only patients can submit payments');
    }

    return this.paymentsService.createPayment({
      ...body,
      patientId: req.user.id,
      status: body.status ?? 'completed',
    });
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.paymentsService.findPayments(req.user);
  }
}

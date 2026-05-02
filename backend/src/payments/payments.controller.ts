import { Controller, Get, Post, Body, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(@Request() req: any, @Body() body: Partial<any>) {
    if (req.user.role === 'user') {
      return this.paymentsService.createPayment({
        ...body,
        patientId: req.user.id,
        appointmentId: body.appointmentId ? Number(body.appointmentId) : undefined,
        status: body.status ?? 'completed',
      });
    }

    if (req.user.role === 'doctor' || req.user.role === 'admin') {
      if (!body.patientId) {
        throw new UnauthorizedException('Doctors must specify a patient for payment');
      }

      return this.paymentsService.createPayment({
        ...body,
        patientId: Number(body.patientId),
        appointmentId: body.appointmentId ? Number(body.appointmentId) : undefined,
        status: body.status ?? 'completed',
      });
    }

    throw new UnauthorizedException('Only patients, doctors, or admins can submit payments');
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.paymentsService.findPayments(req.user);
  }
}

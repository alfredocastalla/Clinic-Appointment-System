import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards, UnauthorizedException, ParseIntPipe } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    if (req.user.role !== 'user') {
      throw new UnauthorizedException('Only patients can book appointments');
    }

    return this.service.create({
      ...body,
      patientId: req.user.id,
      patientName: req.user.name,
      status: 'pending',
    });
  }

  @Get()
  getAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Patch(':id/confirm')
  confirm(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.confirm(id, req.user);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body, req.user);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id, req.user);
  }
}

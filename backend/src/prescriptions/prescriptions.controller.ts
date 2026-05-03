import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/types';
import { PrescriptionsService } from './prescriptions.service';

type CreatePrescriptionDto = {
  patientId?: number;
  patientName: string;
  medication: string;
  dosage: string;
  instructions: string;
  notes?: string;
  date?: string;
};

@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  create(@Request() req: RequestWithUser, @Body() body: CreatePrescriptionDto) {
    return this.prescriptionsService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.prescriptionsService.findAll(req.user);
  }
}

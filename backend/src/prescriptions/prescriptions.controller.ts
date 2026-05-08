import {
  Body,
  Controller,
  Get,
  Param,
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

type RefillRequestDto = {
  note?: string;
};

@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  create(@Request() req: RequestWithUser, @Body() body: CreatePrescriptionDto) {
    return this.prescriptionsService.create(body, req.user);
  }

  @Post(':id/refill')
  requestRefill(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: RefillRequestDto,
  ) {
    const prescriptionId = Number(id);
    return this.prescriptionsService.requestRefill(prescriptionId, body.note, req.user);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.prescriptionsService.findAll(req.user);
  }
}

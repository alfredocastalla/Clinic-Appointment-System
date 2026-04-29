import { AppointmentsService } from './appointments.service';
export declare class AppointmentsController {
    private service;
    constructor(service: AppointmentsService);
    create(req: any, body: any): Promise<any>;
    getAll(req: any): Promise<import("./entities/appointment.entity").Appointment[]>;
    confirm(req: any, id: number): Promise<import("./entities/appointment.entity").Appointment | null>;
    cancel(req: any, id: number): Promise<import("./entities/appointment.entity").Appointment | null>;
}

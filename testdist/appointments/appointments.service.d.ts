import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
export declare class AppointmentsService {
    private repo;
    constructor(repo: Repository<Appointment>);
    create(data: any): Promise<any>;
    findAll(user?: any): Promise<Appointment[]>;
    findOne(id: number): Promise<Appointment | null>;
    confirm(id: number, user: any): Promise<Appointment | null>;
    cancel(id: number, user: any): Promise<Appointment | null>;
}

import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
export declare class DoctorsService {
    private repo;
    constructor(repo: Repository<Doctor>);
    create(data: {
        name: string;
        email: string;
        password: string;
        specialization: string;
    }): Promise<Doctor>;
    findAll(): Promise<Doctor[]>;
    findOne(id: number): Promise<Doctor | null>;
    findByEmail(email: string): Promise<Doctor | null>;
    update(id: number, updateDoctorDto: any): Promise<Doctor | null>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
}

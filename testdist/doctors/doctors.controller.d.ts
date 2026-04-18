import { DoctorsService } from './doctors.service';
export declare class DoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    create(createDoctorDto: {
        name: string;
        email: string;
        password: string;
        specialization: string;
        availableTime?: string;
        address?: string;
        phone?: string;
        photo?: string;
    }): Promise<import("./entities/doctor.entity").Doctor>;
    findAll(): Promise<import("./entities/doctor.entity").Doctor[]>;
    findOne(id: string): Promise<import("./entities/doctor.entity").Doctor | null>;
    update(id: string, updateDoctorDto: any): Promise<import("./entities/doctor.entity").Doctor | null>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}

import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';
export declare class AuthService {
    private usersService;
    private doctorsService;
    private jwtService;
    constructor(usersService: UsersService, doctorsService: DoctorsService, jwtService: JwtService);
    registerUser(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    }>;
    registerDoctor(data: {
        name: string;
        email: string;
        password: string;
        specialization: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            name: string;
            email: string;
            specialization: string;
            role: string;
        };
    }>;
    login(email: string, password: string, role: 'user' | 'doctor'): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: "user";
            specialization?: undefined;
        } | {
            id: any;
            name: any;
            email: any;
            specialization: any;
            role: "doctor";
        };
    }>;
}

import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    registerUser(body: {
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
    registerDoctor(body: {
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
    login(body: {
        email: string;
        password: string;
        role: 'user' | 'doctor';
    }): Promise<{
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

import { Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    private doctorsService;
    constructor(usersService: UsersService, doctorsService: DoctorsService);
    validate(payload: any): Promise<{
        id: number;
        email: string;
        role: string;
        name: string;
        specialization?: undefined;
    } | {
        id: number;
        email: string;
        role: string;
        name: string;
        specialization: string;
    } | null>;
}
export {};

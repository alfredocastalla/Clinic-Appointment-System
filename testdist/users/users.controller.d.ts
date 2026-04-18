import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: {
        name: string;
        email: string;
        password: string;
        role: string;
    }): Promise<import("./entities/user.entity").User>;
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: string): Promise<import("./entities/user.entity").User | null>;
    update(id: string, updateUserDto: any): Promise<import("./entities/user.entity").User | null>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}

import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private repo;
    constructor(repo: Repository<User>);
    create(data: {
        name: string;
        email: string;
        password: string;
        role: string;
    }): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: number, updateUserDto: any): Promise<User | null>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
}

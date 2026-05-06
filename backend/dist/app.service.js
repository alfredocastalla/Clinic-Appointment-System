"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_service_1 = require("./users/users.service");
let AppService = class AppService {
    constructor(usersService, dataSource) {
        this.usersService = usersService;
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@clinic.local';
        const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
        const existingAdmin = await this.usersService.findByEmail(adminEmail);
        if (!existingAdmin) {
            await this.usersService.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                location: 'Main Office',
            });
        }
    }
    async getHealth() {
        try {
            await this.dataSource.query('SELECT 1');
            return { status: 'ok', dbConnected: true };
        }
        catch (error) {
            return {
                status: 'error',
                dbConnected: false,
                message: error instanceof Error ? error.message : 'Database connection failed',
            };
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        typeorm_2.DataSource])
], AppService);
//# sourceMappingURL=app.service.js.map
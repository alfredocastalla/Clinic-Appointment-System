"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const doctors_service_1 = require("../doctors/doctors.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    constructor(usersService, doctorsService, jwtService) {
        this.usersService = usersService;
        this.doctorsService = doctorsService;
        this.jwtService = jwtService;
    }
    async registerUser(data) {
        const existingUser = await this.usersService.findByEmail(data.email);
        const existingDoctor = await this.doctorsService.findByEmail(data.email);
        if (existingUser || existingDoctor) {
            throw new common_1.UnauthorizedException('Email already registered');
        }
        const user = await this.usersService.create({ ...data, role: 'user' });
        const payload = { sub: user.id, email: user.email, role: 'user' };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, name: user.name, email: user.email, role: 'user' },
        };
    }
    async registerDoctor(data) {
        const existingDoctor = await this.doctorsService.findByEmail(data.email);
        const existingUser = await this.usersService.findByEmail(data.email);
        if (existingDoctor || existingUser) {
            throw new common_1.UnauthorizedException('Email already registered');
        }
        const doctor = await this.doctorsService.create(data);
        const payload = { sub: doctor.id, email: doctor.email, role: 'doctor' };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, role: 'doctor' },
        };
    }
    async login(email, password, role) {
        let entity;
        if (role === 'user') {
            entity = await this.usersService.findByEmail(email);
        }
        else {
            entity = await this.doctorsService.findByEmail(email);
        }
        if (!entity) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, entity.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: entity.id, email: entity.email, role };
        return {
            access_token: this.jwtService.sign(payload),
            user: role === 'user' ? { id: entity.id, name: entity.name, email: entity.email, role } : { id: entity.id, name: entity.name, email: entity.email, specialization: entity.specialization, role },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        doctors_service_1.DoctorsService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
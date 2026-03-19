import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private doctorsService: DoctorsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'your-secret-key', // Use environment variable in production
    });
  }

  async validate(payload: any) {
    const { sub: id, role } = payload;
    if (role === 'user') {
      const user = await this.usersService.findOne(id);
      if (user) {
        return { id: user.id, email: user.email, role: 'user' };
      }
    } else if (role === 'doctor') {
      const doctor = await this.doctorsService.findOne(id);
      if (doctor) {
        return { id: doctor.id, email: doctor.email, role: 'doctor' };
      }
    }
    return null;
  }
}
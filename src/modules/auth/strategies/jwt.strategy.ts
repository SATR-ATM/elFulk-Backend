import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  ageGroup?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken() as unknown as
      StrategyOptions['jwtFromRequest'];

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'changeme',
    } as StrategyOptions);
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      ageGroup: payload.ageGroup,
    };
  }
}
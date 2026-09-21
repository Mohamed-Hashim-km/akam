import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['akam_token'];
          }
          return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'fallback_secret',
    });
  }

  async validate(payload: JwtPayload) {
    try {
      if (payload.sub) {
        const liveUser = await this.prisma.queryOne<{
          id: string;
          email: string;
          role: string;
        }>(`SELECT id, email, role FROM "user" WHERE id = $1`, [payload.sub]);

        if (liveUser) {
          return { id: liveUser.id, email: liveUser.email, role: liveUser.role };
        }
      }
    } catch (error) {
      // In case of transient DB read error, safely fallback to token claims
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

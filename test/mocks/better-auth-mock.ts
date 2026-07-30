import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const AllowAnonymous = () => () => {};
export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as unknown as Record<string, unknown>).session;
  },
);
export const AuthGuard = class {};
export class AuthService {
  get api() {
    return {};
  }
}
export type UserSession = {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
  session: { token: string; [key: string]: unknown };
};

// better-auth core mock
export const betterAuth = () => ({
  api: {
    signInEmail: () => Promise.resolve({ token: '', user: { id: '' } }),
    signUpEmail: () => Promise.resolve({ user: { id: '' }, token: '' }),
    getSession: () => Promise.resolve(null),
  },
  handler: () => new Response(),
});

// typeorm adapter mock
export const typeormAdapter = () => ({});

// bearer plugin mock
export const bearer = () => ({ id: 'bearer', hooks: {} });

import { betterAuth } from 'better-auth';
import { typeormAdapter } from '@hedystia/better-auth-typeorm';
import { bearer } from 'better-auth/plugins/bearer';
import { dataSource } from './typeorm/data-source';

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

const appleProvider =
  process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
    ? {
        apple: {
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  database: typeormAdapter(dataSource),
  secret: process.env.BETTER_AUTH_SECRET!,
  url: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: { strategy: 'jwt' },
  },
  user: {
    additionalFields: {
      first_name: {
        type: 'string',
        required: true,
        input: true,
      },
      last_name: {
        type: 'string',
        required: true,
        input: true,
      },
      phone_number: {
        type: 'string',
        required: false,
        input: true,
      },
      lock_alerts: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      limit_warning: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      is_active: {
        type: 'boolean',
        defaultValue: true,
        input: false,
      },
    },
  },
  socialProviders: {
    ...googleProvider,
    ...appleProvider,
  },
  ...(process.env.APPLE_CLIENT_ID
    ? { trustedOrigins: ['https://appleid.apple.com'] }
    : {}),
  plugins: [bearer()],
});

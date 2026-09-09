import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { UsersModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessPolicyModule } from './modules/access-policy/access-policy.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChildModule } from './modules/child/child.module';
import { ParentModule } from './modules/parent/parent.module';
import { NotificationModule } from './modules/notification/notification.module';
import { auth } from './auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNC === 'true',
    }),
    BetterAuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: false,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
      },
    }),
    UsersModule,
    AuthModule,
    AccessPolicyModule,
    AdminModule,
    ChildModule,
    ParentModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

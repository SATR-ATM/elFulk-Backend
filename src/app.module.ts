import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessPolicyModule } from './modules/access-policy/access-policy.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChildModule } from './modules/child/child.module';
import { ParentModule } from './modules/parent/parent.module';
import { StoriesModule } from './modules/story/story.module';
import { MediaModule } from './modules/media/media.module';
import { ImageKitModule } from './modules/imagekit/imagekit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.TYPEORM_HOST ?? 'localhost',
      port: Number(process.env.TYPEORM_PORT ?? 5432),
      username: process.env.TYPEORM_USERNAME ?? 'postgres',
      password: process.env.TYPEORM_PASSWORD ?? 'khaliltouils',
      database: process.env.TYPEORM_DATABASE ?? 'elFulk',
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNC === 'true',
    }),
    UsersModule,
    AuthModule,
    AccessPolicyModule,
    AdminModule,
    ChildModule,
    ParentModule,
    StoriesModule,
    MediaModule,
    ImageKitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
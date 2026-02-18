import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ParentsModule } from './parents/parents.module';
import { ChildrenModule } from './children/children.module';
import { AdminsModule } from './admins/admins.module';
import { AccessPolicyModule } from './access-policy/access-policy.module';
import { SessionsModule } from './sessions/sessions.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContentModule } from './content/content.module';
import { UsersModule } from './modules/users.module';
import { UsersModule } from './modules/users/users.module';
import { ParentsModule } from './modules/parents/parents.module';
import { ChildrenModule } from './modules/children/children.module';
import { AdminsModule } from './modules/admins/admins.module';
import { AccessPolicyModule } from './modules/access-policy/access-policy.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContentModule } from './modules/content/content.module';

@Module({
  imports: [
    UsersModule,
    ParentsModule,
    ChildrenModule,
    AdminsModule,
    AccessPolicyModule,
    SessionsModule,
    ActivityLogModule,
    NotificationsModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

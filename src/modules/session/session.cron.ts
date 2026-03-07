import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStatus } from './session.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SessionCleanupService {
  constructor(@InjectRepository(Session) private repo: Repository<Session>) {}

  @Cron('*/5 * * * *') // every 5 min
  async markExpiredSessions() {
    await this.repo
      .createQueryBuilder()
      .update(Session)
      .set({ status: SessionStatus.Ended })
      .where('endTime < :now AND status != :status', {
        now: new Date(),
        status: SessionStatus.Ended,
      })
      .execute();
  }
}

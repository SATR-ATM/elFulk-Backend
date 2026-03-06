import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { Repository } from 'typeorm';
import { CreateSessionDto } from './dto/create-session.dto';
import { Users, UsersType } from '../user/user.entity';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session) private sessionRepository: Repository<Session>,
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}

  MINIMUM_DURATION = 1 * 60 * 60 * 1000; // Hour * Minutes * Seconds * Milliseconds

  async create(session: CreateSessionDto): Promise<Session> {
    const child = await this.usersRepository.findOneBy({
      id: session.childId,
      type: UsersType.CHILD,
    });
    if (!child) {
      throw new NotFoundException(
        `Couldn't find child with id: ${session.childId}`,
      );
    }
    return this.sessionRepository.create({
      child: child,
      endTime: new Date(
        Date.now() + (session.endTime || this.MINIMUM_DURATION),
      ),
    });
  }

  async getAll(): Promise<Session[]> {
    return this.sessionRepository.find();
  }

  async get(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOneBy({ id });
    if (!session) {
      throw new NotFoundException(`Couldn't find session: id=${id}'`);
    }
    return session;
  }

  async update(data: UpdateSessionDto, id: string): Promise<Session> {
    const session = await this.get(id);
    session.endTime = new Date(Date.now() + data.endTime);
    return this.sessionRepository.save(session);
  }

  async delete(id: string): Promise<{ message: string }> {
    const session = await this.get(id);
    await this.sessionRepository.delete(session);
    return {
      message: 'Session deleted successfully',
    };
  }
}

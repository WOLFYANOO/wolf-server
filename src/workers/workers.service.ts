import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkersEntity } from './entities/worker.entity';
import { Repository } from 'typeorm';
import { SignInDto } from './dto/sign-in.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Response } from 'express';
import { RoleEnum } from 'src/types/enums/user.enum';
import { ErrorMsg } from 'src/utils/base';
import { UpdateWorkerPasswordDto } from './dto/update-worker-password.dto';
import { BanWorkerDto } from './dto/ban-worker.dto';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(WorkersEntity)
    private readonly workersRepo: Repository<WorkersEntity>,
  ) {}
  async signUpFirstUser(user_name: string, password: string) {
    const existingUser = await this.findWorkerByName(user_name);
    if (existingUser) {
      throw new ConflictException(
        'There is another user with the same user_name.',
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newWorker = this.workersRepo.create({
      user_name,
      password: hashedPassword,
      role: RoleEnum.OWNER,
    });
    try {
      await this.workersRepo.save(newWorker);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'First user created successfully.',
    };
  }
  async SignInUser({ user_name, password }: SignInDto, response: Response) {
    const userCount = await this.workersRepo.count();
    if (userCount === 0) {
      await this.signUpFirstUser(user_name, password);
    }
    const user = await this.findWorkerByName(user_name);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Incorrect password.');
    }
    this.checkUserStatus(user);
    const access_token = this.generateAccessToken({
      id: user.id,
      user_name: user.user_name,
      role: user.role,
    });
    const refresh_token = this.generateRefreshToken({
      id: user.id,
      user_name: user.user_name,
      role: user.role,
    });
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'high',
    });
    return {
      done: true,
      access_token,
    };
  }
  async RefreshToken(user_name: string) {
    const user = await this.findWorkerByName(user_name);
    if (!user) {
      throw new ForbiddenException('User not found.');
    }
    this.checkUserStatus(user);
    const access_token = this.generateAccessToken({
      id: user.id,
      user_name: user.user_name,
      role: user.role,
    });
    return {
      done: true,
      access_token,
    };
  }
  async SignOutUser(response: Response) {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    response.clearCookie('access_token', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return {
      done: true,
    };
  }
  async findOneWorker(id: string) {
    const worker = await this.findWorkerById(id, true);
    if (!worker) throw new NotFoundException();
    return worker;
  }
  async findAll(page: number = 1, limit: number = 1000) {
    const [workers, total] = await this.workersRepo
      .createQueryBuilder('worker')
      .loadRelationCountAndMap('worker.contacts_count', 'worker.contacts')
      .select([
        'worker.id',
        'worker.user_name',
        'worker.role',
        'worker.is_banned',
        'worker.banned_reason',
        'worker.created_at',
        'worker.updated_at',
      ])
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      workers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async addWorker(
    user_name: string,
    password: string,
    role: RoleEnum = RoleEnum.ADMIN,
  ) {
    const existingUser = await this.findWorkerByName(user_name);
    if (existingUser) {
      throw new ConflictException(
        'There is another user with the same user_name.',
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newWorker = this.workersRepo.create({
      user_name,
      password: hashedPassword,
      role,
    });
    try {
      await this.workersRepo.save(newWorker);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'Worker created successfully.',
    };
  }
  async workerProfile(user_name: string) {
    const worker = await this.findWorkerByName(user_name, true);
    if (!worker) {
      throw new ForbiddenException('User not found.');
    }
    this.checkUserStatus(worker);
    return {
      done: true,
      worker,
    };
  }
  async updateWorkerPassword(
    user_name: string,
    { password, new_password }: UpdateWorkerPasswordDto,
  ) {
    const worker = await this.findWorkerByName(user_name);
    if (!worker) {
      throw new ForbiddenException('User not found.');
    }
    const isCorrectPassword = await bcrypt.compare(password, worker.password);
    if (!isCorrectPassword) {
      throw new ConflictException('Incorrect password.');
    }
    const hashedPassword = await bcrypt.hash(new_password, 10);
    worker.password = hashedPassword;
    try {
      await this.workersRepo.save(worker);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'Worker updated successfully.',
    };
  }
  async BanWorker(worker_id: string, banned_reason: string) {
    const worker = await this.findWorkerById(worker_id);
    if (!worker) throw new NotFoundException('worker not found.');
    if (worker.role === 'owner')
      throw new ForbiddenException('لا يمكنك حظر مالك.');
    if (worker.is_banned) throw new ConflictException('worker already banned.');
    await this.workersRepo.save({ ...worker, is_banned: true, banned_reason });
    return {
      done: true,
      message: 'worker banned succefully.',
    };
  }
  async findWorkerById(user_id: string, needContacts: boolean = false) {
    const relations = [];
    if (needContacts) relations.push('contacts');
    return await this.workersRepo.findOne({
      where: { id: user_id },
      relations,
    });
  }

  async searchEngine(searchin: 'workers', searchwith: string) {
    if (searchin === 'workers') {
      const [results, total] = await this.workersRepo
        .createQueryBuilder('worker')
        .loadRelationCountAndMap('worker.contacts_count', 'worker.contacts')
        .select([
          'worker.id',
          'worker.user_name',
          'worker.role',
          'worker.is_banned',
          'worker.banned_reason',
          'worker.created_at',
          'worker.updated_at',
        ])
        .where('worker.user_name ILIKE :termStart', {
          termStart: `${searchwith.toLowerCase()}%`,
        })
        .orWhere('worker.user_name ILIKE :termEnd', {
          termEnd: `%${searchwith.toLowerCase()}`,
        })
        .getManyAndCount();
      return { results, total };
    }
    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }

  private async findWorkerByName(
    user_name: string,
    needContacts: boolean = false,
  ) {
    return await this.workersRepo.findOne({
      where: { user_name },
      relations: needContacts ? ['contacts'] : [],
    });
  }
  private checkUserStatus(worker: WorkersEntity) {
    if (worker.is_banned) {
      throw new ForbiddenException(
        `This email has been banned. Call the owner to know why.`,
      );
    }
  }
  private generateAccessToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: '15m',
    });
  }
  private generateRefreshToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET_KEY, {
      expiresIn: '7d',
    });
  }
}

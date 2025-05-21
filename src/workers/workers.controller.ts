import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import CreateWorkerDto from './dto/create-worker.dto';
import { Response } from 'express';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { OwnerGuard } from 'src/guards/owner.guard';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshGuard } from 'src/guards/refresh.guard';
import { UpdateWorkerPasswordDto } from './dto/update-worker-password.dto';
import { BanWorkerDto } from './dto/ban-worker.dto';
import { ReaderGuard } from 'src/guards/reader.guard';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}
  @Post('first-user')
  async signUpFirstUser(@Body() { user_name, password }: CreateWorkerDto) {
    return await this.workersService.signUpFirstUser(user_name, password);
  }
  @Post('sign-in')
  async signInUser(
    @Body() { user_name, password }: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.workersService.SignInUser(
      { user_name, password },
      response,
    );
  }
  @Get('refresh-token')
  @UseGuards(RefreshGuard)
  async refreshToken(@User() worker: WorkerTokenInterface) {
    return await this.workersService.RefreshToken(worker.user_name);
  }
  @Post('sign-out')
  @UseGuards(ReaderGuard)
  async signOutUser(@Res({ passthrough: true }) response: Response) {
    return await this.workersService.SignOutUser(response);
  }
  @Post('create-worker')
  @UseGuards(OwnerGuard)
  async createWorker(@Body() { user_name, password, role }: CreateWorkerDto) {
    return await this.workersService.addWorker(user_name, password, role);
  }

  @Get()
  @UseGuards(ReaderGuard)
  async findAll() {
    return await this.workersService.findAll();
  }

  @Get('profile')
  @UseGuards(ReaderGuard)
  async profile(@User() worker: WorkerTokenInterface) {
    return await this.workersService.workerProfile(worker.user_name);
  }
  @Patch('update-password')
  @UseGuards(ReaderGuard)
  async updatePassword(
    @User() worker: WorkerTokenInterface,
    @Body() updateWorkerPasswordDto: UpdateWorkerPasswordDto,
  ) {
    return await this.workersService.updateWorkerPassword(
      worker.user_name,
      updateWorkerPasswordDto,
    );
  }
  @Patch('ban/:id')
  @UseGuards(OwnerGuard)
  async BanWorker(
    @Param('id', new ParseUUIDPipe()) worker_id: string,
    @Body() { banned_reason }: BanWorkerDto,
  ) {
    return await this.workersService.BanWorker(worker_id, banned_reason);
  }
  @Get(':id')
  @UseGuards(ReaderGuard)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.workersService.findOneWorker(id);
  }
}

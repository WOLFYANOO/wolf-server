import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsEntity } from './entities/contacts.entity';
import { ClientsModule } from 'src/clients/clients.module';
import { WorkersModule } from 'src/workers/workers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactsEntity]),
    ClientsModule,
    WorkersModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}

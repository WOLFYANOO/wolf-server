import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateWorkerContactDto } from './dto/create-worker-contact.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { ReaderGuard } from 'src/guards/reader.guard';
import { OwnerGuard } from 'src/guards/owner.guard';

@Controller('contacts')
@UseGuards(ReaderGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post('client')
  @UseGuards(OwnerGuard)
  async createClientContact(
    @Body() createClientContactDto: CreateClientContactDto,
  ) {
    return await this.contactsService.CreateClientContact(
      createClientContactDto,
    );
  }

  @Patch('client/:id')
  @UseGuards(OwnerGuard)
  async updateContact(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return await this.contactsService.updateContact(id, updateContactDto);
  }

  @Delete('client/:id')
  @UseGuards(OwnerGuard)
  async deleteContact(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.contactsService.deleteContact(id);
  }

  @Post('worker/:id')
  @UseGuards(OwnerGuard)
  async createWorkerContact(
    @Param('id', new ParseUUIDPipe()) user_id: string,
    @Body() createWorkerContactDto: CreateWorkerContactDto,
  ) {
    return await this.contactsService.CreateWorkerContact(
      user_id,
      createWorkerContactDto,
    );
  }

  @Patch('worker/:contactId')
  @UseGuards(OwnerGuard)
  async updateWorkerContact(
    @User() { id }: any,
    @Param('contactId', new ParseUUIDPipe()) contactId: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return await this.contactsService.updateWorkerContact(
      id,
      contactId,
      updateContactDto,
    );
  }

  @Delete('worker/:contactId')
  @UseGuards(OwnerGuard)
  async deleteWorkerContact(
    @User() { id }: any,
    @Param('contactId', new ParseUUIDPipe()) contactId: string,
  ) {
    return await this.contactsService.deleteWorkerContact(id, contactId);
  }
}

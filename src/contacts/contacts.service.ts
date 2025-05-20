import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactsEntity } from './entities/contacts.entity';
import { Repository } from 'typeorm';
import { ClientsService } from 'src/clients/clients.service';
import { ErrorMsg } from 'src/utils/base';
import { WorkersService } from 'src/workers/workers.service';
import { CreateWorkerContactDto } from './dto/create-worker-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(ContactsEntity)
    private readonly contactsRepo: Repository<ContactsEntity>,
    private readonly clientsService: ClientsService,
    private readonly workersService: WorkersService,
  ) {}

  async CreateClientContact(createClientContactDto: CreateClientContactDto) {
    const { user_id } = createClientContactDto;
    let user = await this.clientsService.findClientById(user_id, true);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const condition = user.contacts.some(
      (contact) => contact.phone === createClientContactDto.phone,
    );
    if (condition) {
      throw new ConflictException('Contact already exists.');
    }
    const contact = this.contactsRepo.create({
      ...createClientContactDto,
      client: user,
    });
    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'Contact created successfully.',
    };
  }
  async updateContact(contactId: string, updateContactDto: UpdateContactDto) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId },
      relations: ['worker'],
    });
    console.log(updateContactDto);
    if (!contact) throw new NotFoundException('Contact not found.');
    if (contact.worker) {
      throw new ForbiddenException(
        'You cannot update this contact because it is a worker contact.',
      );
    }
    Object.assign(contact, updateContactDto);

    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'Contact updated successfully.',
    };
  }
  async deleteContact(contactId: string) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId },
      relations: ['worker'],
    });
    if (!contact) throw new NotFoundException('Contact not found.');
    if (contact.worker) {
      throw new ForbiddenException(
        'You cannot delete this contact because it is a worker contact.',
      );
    }
    await this.contactsRepo.delete(contactId);

    return {
      done: true,
      message: 'Contact deleted successfully.',
    };
  }
  async CreateWorkerContact(
    user_id: string,
    createWorkerContactDto: CreateWorkerContactDto,
  ) {
    let user = await this.workersService.findWorkerById(user_id, true);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const condition = user.contacts.some(
      (contact) => contact.phone === createWorkerContactDto.phone,
    );
    if (condition) {
      throw new ConflictException('Contact already exists.');
    }
    const contact = this.contactsRepo.create({
      ...createWorkerContactDto,
      worker: user,
    });
    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'Contact created successfully.',
    };
  }
  async updateWorkerContact(
    user_id: string,
    contactId: string,
    updateContactDto: UpdateContactDto,
  ) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId },
      relations: ['worker'],
    });
    if (!contact) throw new NotFoundException('Contact not found.');
    if (!contact.worker) {
      throw new ForbiddenException(
        'You cannot update this contact because it is a client contact.',
      );
    }
    if (contact.worker.id !== user_id) {
      throw new ForbiddenException(
        'You are not allowed to update this contact.',
      );
    }
    Object.assign(contact, updateContactDto);

    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'Contact updated successfully.',
    };
  }
  async deleteWorkerContact(user_id: string, contactId: string) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId },
      relations: ['worker'],
    });
    if (!contact) throw new NotFoundException('Contact not found.');
    if (!contact.worker) {
      throw new ForbiddenException(
        'You cannot delete this contact because it is a client contact.',
      );
    }
    if (contact.worker.id !== user_id) {
      throw new ForbiddenException(
        'You are not allowed to delete this contact.',
      );
    }
    await this.contactsRepo.delete(contactId);

    return {
      done: true,
      message: 'Contact deleted successfully.',
    };
  }
}

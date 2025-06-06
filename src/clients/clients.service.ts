import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsEntity } from './entities/client.entity';
import { ErrorMsg } from 'src/utils/base';
import { ShippingAddressesEntity } from './entities/shipping-addresses.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientsEntity)
    private readonly clientsRepo: Repository<ClientsEntity>,
    @InjectRepository(ShippingAddressesEntity)
    private readonly shippingAddressesRepo: Repository<ShippingAddressesEntity>,
  ) {}
  //
  async create(user_name: string, tax_num: string) {
    const client = await this.findClientByName(user_name);
    if (client)
      throw new ConflictException('User with this userName already exists.');
    const newClient = this.clientsRepo.create({ user_name, tax_num });
    try {
      await this.clientsRepo.save(newClient);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'Client created successfully.',
    };
  }
  async findOneById(id: string) {
    const client = await this.clientsRepo
      .createQueryBuilder('client')
      .andWhere('client.id = :id', { id })
      .leftJoinAndSelect('client.contacts', 'contacts')
      .leftJoinAndSelect('client.shipping_addresses', 'addresses')
      .leftJoinAndSelect('client.orders', 'orders')
      .leftJoinAndSelect('orders.payment', 'payment')
      .getOne();

    if (!client) throw new NotFoundException('Client not found.');
    return client;
  }
  async findAll(page: number = 1, limit: number = 1000) {
    const [clients, total] = await this.clientsRepo
      .createQueryBuilder('client')
      .loadRelationCountAndMap('client.orders_count', 'client.orders')
      .loadRelationCountAndMap('client.contacts_count', 'client.contacts')
      .loadRelationCountAndMap(
        'client.addresses_count',
        'client.shipping_addresses',
      )
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async updateClient(id: string, { user_name, tax_num }: UpdateClientDto) {
    const client = await this.findClientById(id);
    if (!client) throw new NotFoundException('Client not found.');
    if (user_name.trim() !== client.user_name.trim()) {
      const existingUser = await this.findClientByName(user_name);
      if (existingUser)
        throw new ConflictException('New userName is already in use.');
      client.user_name = user_name;
    }

    if (tax_num) client.tax_num = tax_num;
    try {
      await this.clientsRepo.save(client);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'client updated successfully.',
    };
  }
  async createAddress(createAddressDto: CreateAddressDto) {
    const client = await this.findClientByName(createAddressDto.client_name);
    if (!client) throw new NotFoundException('Client not found.');

    const address = this.shippingAddressesRepo.create({
      ...createAddressDto,
      client,
    });

    try {
      await this.shippingAddressesRepo.save(address);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return { done: true, message: 'Address created successfully.' };
  }

  async updateAddress(addressId: string, updateAddressDto: UpdateAddressDto) {
    const address = await this.shippingAddressesRepo.findOne({
      where: { id: addressId },
    });
    if (!address) throw new NotFoundException('Address not found.');

    Object.assign(address, updateAddressDto);

    try {
      await this.shippingAddressesRepo.save(address);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return { done: true, message: 'Address updated successfully.' };
  }

  async deleteAddress(addressId: string) {
    const result = await this.shippingAddressesRepo.delete(addressId);
    if (result.affected === 0)
      throw new NotFoundException('Address not found.');
    return { done: true, message: 'Address deleted successfully.' };
  }
  private async findClientByName(
    user_name: string,
    needContacts: boolean = false,
    needAddresses: boolean = false,
    needOrders: boolean = false,
  ) {
    const relations = [];
    if (needContacts) relations.push('contacts');
    if (needAddresses) relations.push('shipping_addresses');
    if (needOrders) relations.push('orders');
    return await this.clientsRepo.findOne({
      where: { user_name },
      relations,
    });
  }
  async findClientById(
    user_id: string,
    needContacts: boolean = false,
    needAddresses: boolean = false,
    needOrders: boolean = false,
  ) {
    const relations = [];
    if (needContacts) relations.push('contacts');
    if (needAddresses) relations.push('shipping_addresses');
    if (needOrders) relations.push('orders');
    return await this.clientsRepo.findOne({
      where: { id: user_id },
      relations,
    });
  }
  async searchEngine(searchin: 'clients', searchwith: string, column?: string) {
    if (searchin === 'clients') {
      const columns = ['client.user_name', 'client.tax_num'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.clientsRepo
        .createQueryBuilder('client')
        .loadRelationCountAndMap('client.orders_count', 'client.orders')
        .loadRelationCountAndMap('client.contacts_count', 'client.contacts')
        .loadRelationCountAndMap(
          'client.addresses_count',
          'client.shipping_addresses',
        );
      if (column) {
        query
          .where(`${column} ILIKE :termStart`, {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere(`${column} ILIKE :termEnd`, {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
        const [results, total] = await query
          .orderBy('sort.created_at', 'DESC')
          .getManyAndCount();
        return { results, total };
      } else {
        query
          .where(`client.user_name ILIKE :termStart`, {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere(`client.user_name ILIKE :termEnd`, {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere(`client.tax_num ILIKE :termStart`, {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere(`client.tax_num ILIKE :termEnd`, {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
        const [results, total] = await query
          .orderBy('client.created_at', 'DESC')
          .getManyAndCount();
        return { results, total };
      }
    }
    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}

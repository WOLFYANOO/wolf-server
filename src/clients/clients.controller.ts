import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { OwnerGuard } from 'src/guards/owner.guard';

@Controller('clients')
@UseGuards(ReaderGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('create-client')
  @UseGuards(OwnerGuard)
  async createClient(@Body() { user_name, tax_num }: CreateClientDto) {
    return await this.clientsService.create(user_name, tax_num);
  }

  @Get('find-one/:id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.clientsService.findOneById(id);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 1000,
  ) {
    return await this.clientsService.findAll(page, limit);
  }

  @Patch('update/:id')
  @UseGuards(OwnerGuard)
  async updateClient(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return await this.clientsService.updateClient(id, updateClientDto);
  }

  @Post('new-address')
  @UseGuards(OwnerGuard)
  async createAddress(@Body() createAddressDto: CreateAddressDto) {
    return await this.clientsService.createAddress(createAddressDto);
  }

  @Patch('update-address/:addressId')
  @UseGuards(OwnerGuard)
  async update(
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return await this.clientsService.updateAddress(addressId, dto);
  }

  @Delete('delete-address/:addressId')
  @UseGuards(OwnerGuard)
  async delete(@Param('addressId', new ParseUUIDPipe()) addressId: string) {
    return await this.clientsService.deleteAddress(addressId);
  }
}

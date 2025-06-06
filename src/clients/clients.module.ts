import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsEntity } from './entities/client.entity';
import { ShippingAddressesEntity } from './entities/shipping-addresses.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientsEntity, ShippingAddressesEntity])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}

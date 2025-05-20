import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersEntity } from './entities/order.entity';
import { OrderItemsEntity } from './entities/order-items.entity';
import { PaymentsEntity } from './entities/payments.entity';
import { ClientsModule } from 'src/clients/clients.module';
import { ProductsModule } from 'src/products/products.module';
import { ReturnEntity } from './entities/return.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdersEntity,
      OrderItemsEntity,
      PaymentsEntity,
      ReturnEntity,
    ]),
    ClientsModule,
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

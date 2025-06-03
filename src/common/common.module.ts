import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { ProductsModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';
import { CategoryModule } from 'src/category/category.module';
import { ClientsModule } from 'src/clients/clients.module';
import { WorkersModule } from 'src/workers/workers.module';

@Module({
  imports: [
    ProductsModule,
    OrdersModule,
    ProductsModule,
    CategoryModule,
    ClientsModule,
    WorkersModule,
  ],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}

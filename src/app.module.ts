import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { WorkersModule } from './workers/workers.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';
import { CategoryModule } from './category/category.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        migrations: [__dirname + '/migrations/*.{js,ts}'],
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    WorkersModule,
    ContactsModule,
    ClientsModule,
    CategoryModule,
    OrdersModule,
    ProductsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}

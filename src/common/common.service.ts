import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CategoryService } from 'src/category/category.service';
import { ClientsService } from 'src/clients/clients.service';
import { OrdersService } from 'src/orders/orders.service';
import { ProductsService } from 'src/products/products.service';
import { WorkersService } from 'src/workers/workers.service';

@Injectable()
export class CommonService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly categoryService: CategoryService,
    private readonly clientsService: ClientsService,
    private readonly workersService: WorkersService,
  ) {}
  async searchEngine(searchin: string, searchwith?: string, column?: string) {
    const repos = [
      'sorts',
      'products',
      'costs',
      'categories',
      'orders',
      'returns',
      'clients',
      'workers',
    ];
    if (!searchin || searchin === '') {
      throw new BadRequestException('يجب اختيار المستودع المطلب البحث به.');
    }
    let service;
    if (!repos.includes(searchin)) {
      throw new ConflictException('لا يوجد مستودع بهذا الاسم.');
    }
    if (
      searchin === 'sorts' ||
      searchin === 'products' ||
      searchin === 'costs'
    ) {
      service = this.productsService;
    } else if (searchin === 'categories') {
      service = this.categoryService;
    } else if (searchin === 'orders' || searchin === 'returns') {
      service = this.ordersService;
    } else if (searchin === 'clients') {
      service = this.clientsService;
    } else if (searchin === 'workers') {
      service = this.workersService;
    }
    return service.searchEngine(searchin, searchwith || '', column);
  }
  async getGenralCalcs() {
    const calcCurrentInventory =
      await this.productsService.calcCurrentInventory();
    return {
      totalCostsPrice: calcCurrentInventory.totalCostsPrice,
      totalSortsPrices: calcCurrentInventory.totalPrices,
    };
  }

  async getGraphCalcs(year: string, month?: string) {
    const orders = await this.ordersService.countOrders(
      Number(year),
      Number(month),
    );
    return { orders: orders.count, sales: orders.earning };
  }
}

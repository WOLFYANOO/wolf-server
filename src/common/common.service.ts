import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class CommonService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
  ) {}
  async searchEngine(searchin: string, searchwith: string) {
    if (!searchin || searchin === '') {
      throw new BadRequestException('يجب اختيار المستودع المطلب البحث به.');
    }
    let service;
    if (searchin === 'sorts') {
      service = this.productsService;
    } else {
      throw new ConflictException('لا يوجد مستودع بهذا الاسم.');
    }
    return service.searchEngine(searchin, searchwith);
  }
  async getAllCalcs() {
    const calcCurrentInventoryCost =
      await this.productsService.calcCurrentInventoryCost();
    const calcCurrentInventoryPrices =
      await this.productsService.calcCurrentInventoryPrices();
    const calcReturns = await this.ordersService.calcReturns();
    const calcEarnings = await this.ordersService.calcEarnings();
    return {
      totalCostsPrice: calcCurrentInventoryCost.totalCostsPrice,
      totalSortsPrices: calcCurrentInventoryPrices.totalSortsPrices,
      totalReturnsPrices: calcReturns.totalReturnsPrices,
      countTotalReturnsPrices: calcReturns.total,
      paidOrders: calcEarnings.paidOrders,
      countPaidOrders: calcEarnings.countPaidOrders,
      notPaidOrders: calcEarnings.notPaidOrders,
      countNotPaidOrders: calcEarnings.countNotPaidOrders,
    };
  }
}

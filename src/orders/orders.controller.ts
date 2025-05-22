import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { ReaderGuard } from 'src/guards/reader.guard';
import { OwnerGuard } from 'src/guards/owner.guard';
import { ReturnDto } from './dto/return.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
@UseGuards(ReaderGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post()
  @UseGuards(OwnerGuard)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  async findAll() {
    return await this.ordersService.getAllOrders();
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.ordersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OwnerGuard)
  async updateOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return await this.ordersService.updateOrder(id, updateOrderDto);
  }
  @Post('returns/:itemId')
  @UseGuards(OwnerGuard)
  async returnOrder(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() { reason, qty }: ReturnDto,
  ) {
    return await this.ordersService.returnOneItem(itemId, qty, reason);
  }
}

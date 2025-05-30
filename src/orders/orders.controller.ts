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

  @Patch(':id')
  @UseGuards(OwnerGuard)
  async updateOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return await this.ordersService.updateOrder(id, updateOrderDto);
  }
  @Post('returns/:orderId')
  @UseGuards(OwnerGuard)
  async makeReturn(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() { returns }: ReturnDto,
  ) {
    return await this.ordersService.makeReturn(orderId, returns);
  }
  @Get('returns')
  async findAllReturns() {
    return await this.ordersService.getAllReturn();
  }
  @Get('returns/:id')
  async findOrderReturns(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.ordersService.getAllReturn(undefined, undefined, id);
  }
  @Get('returns/returns-items/:id')
  async findReturnsItems(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.ordersService.findReturnsItems(id);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.ordersService.findOne(id);
  }
}

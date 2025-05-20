import { ContactsEntity } from 'src/contacts/entities/contacts.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ShippingAddressesEntity } from './shipping-addresses.entity';
import { OrdersEntity } from 'src/orders/entities/order.entity';

@Entity({ name: 'clients' })
export class ClientsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_name: string;

  @Column({ nullable: true })
  tax_num: string;

  @OneToMany(() => ContactsEntity, (contact) => contact.client, {
    cascade: true,
  })
  contacts: ContactsEntity[];

  @OneToMany(() => ShippingAddressesEntity, (address) => address.client, {
    cascade: true,
  })
  shipping_addresses: ShippingAddressesEntity[];

  @OneToMany(() => OrdersEntity, (order) => order.client, { cascade: true })
  orders: OrdersEntity[];

  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}

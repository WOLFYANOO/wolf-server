import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientsEntity } from './client.entity';
import { GovernoratesEnums } from 'src/types/enums/user.enum';

@Entity({ name: 'shipping_addresses' })
export class ShippingAddressesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClientsEntity, (client) => client.shipping_addresses)
  client: ClientsEntity;

  @Column({ type: 'enum', enum: GovernoratesEnums })
  governorate: GovernoratesEnums;

  @Column()
  city: string;

  @Column()
  street: string;

  @Column({ nullable: true })
  more_info: string;

  @Column({ default: false })
  is_main: boolean;

  @Column()
  address_for: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

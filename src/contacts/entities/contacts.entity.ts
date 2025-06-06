import { ClientsEntity } from 'src/clients/entities/client.entity';
import { WorkersEntity } from 'src/workers/entities/worker.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'contacts' })
export class ContactsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => ClientsEntity, (client) => client.contacts, {
    nullable: true,
  })
  client: ClientsEntity;

  @ManyToOne(() => WorkersEntity, (worker) => worker.contacts, {
    nullable: true,
  })
  worker: WorkersEntity;

  @Column()
  phone: string;

  @Column({ nullable: true })
  note: string;

  @Column({ default: false })
  is_main: boolean;

  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}

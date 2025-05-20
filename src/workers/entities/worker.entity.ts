import { ContactsEntity } from 'src/contacts/entities/contacts.entity';
import { RoleEnum } from 'src/types/enums/user.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'workers' })
export class WorkersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  user_name: string;
  @Column()
  password: string;
  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.ADMIN })
  role: RoleEnum;
  @OneToMany(() => ContactsEntity, (contact) => contact.worker, {
    cascade: true,
  })
  contacts: ContactsEntity[];
  @Column({ default: false })
  is_banned: boolean;
  @Column({ nullable: true })
  banned_reason: string;
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  GENERAL = 'general',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

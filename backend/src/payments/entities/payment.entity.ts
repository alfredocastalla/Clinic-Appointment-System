import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column({ nullable: true })
  appointmentId?: number;

  @Column('float')
  amount: number;

  @Column()
  currency: string;

  @Column()
  status: string;

  @Column()
  method: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  paidAt?: string;

  @Column({ nullable: true })
  transactionId?: string;

  @CreateDateColumn()
  createdAt: string;
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  type: string;

  @Column()
  last4: string;

  @Column()
  brand: string;

  @Column()
  expiryMonth: number;

  @Column()
  expiryYear: number;

  @Column()
  isDefault: boolean;
}

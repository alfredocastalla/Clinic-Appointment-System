import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  patientId?: number;

  @Column()
  patientName: string;

  @Column()
  doctorId: number;

  @Column()
  doctorName: string;

  @Column()
  medication: string;

  @Column()
  dosage: string;

  @Column('text')
  instructions: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'date' })
  date: string;

  @CreateDateColumn()
  createdAt: Date;
}

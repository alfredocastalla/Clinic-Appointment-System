import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  patientId: number;

  @Column()
  patientName: string;

  @Column()
  doctorId: number;

  @Column()
  date: string;

  @Column()
  status: string;
}

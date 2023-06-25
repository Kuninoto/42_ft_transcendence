import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

export enum UserStatus {
  ONLINE,
  OFFLINE,
  IN_MATCH,
}

@Entity('User')
export class User {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'user_id',
  })
  id: number;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ONLINE,
  })
  status: UserStatus;

  @Column({ default: true })
  is_auth: boolean;

  @Column({ default: false })
  has_2fa: boolean;

  @Column({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  last_updated_at: Date;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  avatar_url: string;
}

import { roomVisit } from 'Shared/types/roomVisitTypes';
import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Room } from './room';
import { User } from './user';

@ObjectType()
@Entity()
export class RoomVisit {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Date)
  @Column({ type: 'timestamp' })
  visitTime: Date;

  @ManyToOne(() => Room, (room) => room.visits, { cascade: true, onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  room: Promise<Room>;

  @ManyToOne(() => User, (user) => user.roomVisits, { cascade: true, onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  user: Promise<User>;
}

import { roomVisit } from 'Shared/types/roomVisitTypes';
import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Room } from './room';
import { User } from './user';

@ObjectType()
@Entity()
export class RoomVisit implements roomVisit {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Date)
  @Column({ type: 'timestamp' })
  visitTime: Date;

  @ManyToOne(() => Room, (room) => room.visits, { cascade: true })
  room: Room;

  @ManyToOne(() => User, (user) => user.visitedRooms, { cascade: true })
  user: User;
}

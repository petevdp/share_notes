import { clientSideRoom, room } from 'Shared/types/roomTypes';
import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { RoomVisit } from './roomVisit';
import { User } from './user';

@Entity()
export class Room implements room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  gistName: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.ownedRooms, { cascade: true })
  owner: User;

  @OneToMany(() => RoomVisit, (visit) => visit.room)
  visits: RoomVisit[];
}

@ObjectType()
export class ClientSideRoom implements clientSideRoom {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  gistName: string;

  @Field(() => User)
  owner: User;

  @Field()
  hashId: string;

  @Field(() => Number)
  createdAt: Date;
}

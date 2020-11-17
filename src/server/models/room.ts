import { RoomVisitResolver } from 'Server/resolvers/roomVisitResolver';
import { clientSideRoom, room } from 'Shared/types/roomTypes';
import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { RoomVisit } from './roomVisit';
import { User } from './user';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  gistName?: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  savedRoomData?: string;

  @ManyToOne(() => User, (user) => user.ownedRooms)
  owner: Promise<User>;

  @OneToMany(() => RoomVisit, (visit) => visit.room)
  visits: Promise<RoomVisit[]>;
}

@ObjectType()
export class ClientSideRoom {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  gistName?: string;

  @Field(() => User)
  owner: Promise<User>;

  @Field()
  hashId: string;

  @Field(() => Number)
  createdAt: Date;

  @Field(() => [RoomVisit])
  visits: Promise<RoomVisit[]>;
}

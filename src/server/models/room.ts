import { clientSideRoom } from 'Shared/types/roomTypes';
import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './user';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  gistName: string;

  @ManyToOne(() => User, (user) => user.ownedRooms, { cascade: true })
  owner: User;
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
}

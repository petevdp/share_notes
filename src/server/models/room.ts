import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { User } from './user';
import { ObjectType, Field, ID } from 'type-graphql';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne((type) => User, (user) => user.ownedRooms, { cascade: true })
  owner: User;
}

@ObjectType()
export class ClientSideRoom {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field(() => User)
  owner: User;

  @Field()
  hashId: String;
}

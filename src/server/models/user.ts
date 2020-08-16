import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, BaseEntity } from 'typeorm';
import { Room } from './room';
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
@Entity()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column()
  username: string;

  @Field(() => [Room])
  @OneToMany((type) => Room, (room) => room.owner)
  @JoinColumn()
  ownedRooms: Room[];
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { User } from './user';
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
@Entity()
export class Room {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column()
  name: string;

  @Field(() => User)
  @ManyToOne((type) => User, (user) => user.ownedRooms, { cascade: true })
  owner: User;
}

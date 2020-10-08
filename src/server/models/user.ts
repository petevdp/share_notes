import { user } from 'Shared/types/userTypes';
import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Room } from './room';

@ObjectType()
@Entity()
export class User implements user {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => ID)
  @Column()
  githubDatabaseId: number;

  @Field(() => String)
  @Column()
  githubLogin: string;

  @OneToMany(() => Room, (room) => room.owner)
  @JoinColumn()
  ownedRooms: Room[];
}

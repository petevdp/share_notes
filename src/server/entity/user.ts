import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from 'typeorm';
import { Room } from './room';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany((type) => Room, (room) => room.owner)
  @JoinColumn()
  ownedRooms: Room[];
  username: string;
}

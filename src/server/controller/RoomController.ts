import { Controller, Query, Mutation } from 'vesper';
import { EntityManager } from 'typeorm';
import { User } from 'Server/entity/user';
import { RoomCreateArgs, RoomArgs } from 'Shared/args';
import { UserArgs, UserCreateArgs } from 'Shared/args';
import { Room } from 'Server/entity/room';

@Controller()
export class RoomController {
  constructor(private entityManager: EntityManager) {}

  @Query()
  rooms() {
    return this.entityManager.find(Room);
  }

  @Query()
  room({ id }: RoomArgs) {
    return this.entityManager.findOne(Room, id);
  }

  @Mutation()
  async roomCreate(args: RoomCreateArgs) {
    console.log('idk');

    const owner = await this.entityManager.findOne(User, args.ownerId);
    const room = new Room();
    room.name = args.name;
    room.owner = owner;
    console.log('room: ', room);

    return this.entityManager.save(room);
  }
}

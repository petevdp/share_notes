import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Room } from 'Server/models/room';
import { CreateRoomInput } from 'Server/inputs/createRoomInput';
import { User } from 'Server/models/user';

@Resolver()
export class RoomResolver {
  @Query(() => [Room])
  rooms() {
    return Room.find();
  }

  @Mutation(() => Room)
  async createRoom(@Arg('data') data: CreateRoomInput) {
    const owner = await User.findOne(data.ownerId);
    const room = Room.create({ ...data, owner });
    await room.save();
    return room;
  }
}

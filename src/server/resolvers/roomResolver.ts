import { CreateRoomInput, DeleteRoomInput, RoomInput } from 'Server/inputs/roomInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { Arg, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

@Service()
@Resolver(() => ClientSideRoom)
export class RoomResolver {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly clientSideRoomService: ClientSideRoomService,
  ) {}

  @Query(() => ClientSideRoom)
  async room(@Arg('data') roomInput: RoomInput) {
    return this.clientSideRoomService.findRoom(roomInput);
  }

  @Query(() => [ClientSideRoom])
  async rooms() {
    const rooms = await this.roomRepository.find();
    return this.clientSideRoomService.getClientSideRooms(rooms);
  }

  @FieldResolver(() => User)
  async owner(@Root() room: ClientSideRoom): Promise<User | null> {
    const owner = await this.roomRepository.findOne({ id: room.id }, { relations: ['owner'] }).then((r) => r?.owner);
    return owner || null;
  }

  @Mutation(() => ClientSideRoom)
  async createRoom(@Arg('data') userData: CreateRoomInput) {
    const owner = await this.userRepository.findOne({ id: parseInt(userData.ownerId) });

    const room = this.roomRepository.create({
      ...userData,
      owner,
    });

    await this.roomRepository.save(room);
    const clientSideRoom = this.clientSideRoomService.getClientSideRoom(room);
    return clientSideRoom;
  }

  @Mutation(() => Boolean)
  async deleteRoom(@Arg('data') data: DeleteRoomInput) {
    const result = await this.roomRepository.delete(data.id);
    return !!result.affected;
  }
}

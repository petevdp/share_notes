import { Resolver, Query, Mutation, Arg, FieldResolver, Root, Ctx, Authorized } from 'type-graphql';
import { Room, ClientSideRoom } from 'Server/models/room';
import { CreateRoomInput, RoomInput } from 'Shared/inputs/roomInputs';
import { User } from 'Server/models/user';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';

@Service()
@Resolver((of) => ClientSideRoom)
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
  async owner(@Root() room: ClientSideRoom): Promise<User> {
    const owner = await this.roomRepository.findOne({ id: room.id }, { relations: ['owner'] }).then((r) => r.owner);
    return owner;
  }

  @Mutation(() => ClientSideRoom)
  async createRoom(@Arg('data') userData: CreateRoomInput) {
    const owner = await this.userRepository.findOne({ id: userData.ownerId });

    let room = this.roomRepository.create({
      ...userData,
      owner,
    });

    await this.roomRepository.save(room);
    return this.clientSideRoomService.getClientSideRoom(room);
  }
}

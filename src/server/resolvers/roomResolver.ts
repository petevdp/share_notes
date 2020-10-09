import { AuthorizedContext } from 'Server/context';
import { CreateRoomInput, DeleteRoomInput, RoomInput } from 'Server/inputs/roomInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { TedisService, USER_ID_BY_SESSION_KEY } from 'Server/services/tedisService';
import { Arg, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
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
    private readonly tedisService: TedisService,
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
      createdAt: new Date(),
      owner,
    });
    console.log('room: ', room);
    await this.roomRepository.save(room);
    const clientSideRoom = this.clientSideRoomService.getClientSideRoom(room);
    return clientSideRoom;
  }

  @Authorized()
  @Mutation(() => [ClientSideRoom])
  async deleteRoom(@Arg('data') data: DeleteRoomInput, @Ctx() context: AuthorizedContext) {
    await this.roomRepository.delete(data.id);
    const userIdStr = await this.tedisService.tedis.hget(USER_ID_BY_SESSION_KEY, context.githubSessionToken);
    if (!userIdStr) {
      throw "got through authorization but session wasn't set for currentUser query";
    }
    const rooms = await this.userRepository
      .findOne({ id: parseInt(userIdStr) }, { relations: ['ownedRooms'] })
      .then((u) => u?.ownedRooms);

    if (!rooms) {
      throw "got through authorization but session wasn't set for currentUser query";
    }

    return rooms?.map((r) => this.clientSideRoomService.getClientSideRoom(r)) || [];
  }
}

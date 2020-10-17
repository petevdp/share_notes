import { AuthorizedContext } from 'Server/context';
import { CreateRoomInput, DeleteRoomInput, RoomInput } from 'Server/inputs/roomInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { RoomMember } from 'Server/models/roomMember';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { TedisService, USER_ID_BY_SESSION_KEY } from 'Server/services/tedisService';
import { YjsService } from 'Server/services/yjsService';
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
    @InjectRepository(RoomVisit) private readonly roomVisitRepository: Repository<RoomVisit>,
    private readonly clientSideRoomService: ClientSideRoomService,
    private readonly tedisService: TedisService,
    private readonly yjsService: YjsService,
  ) {}

  @Query(() => ClientSideRoom, { nullable: true })
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

  @FieldResolver(() => [RoomMember])
  async activeRoomMembers(@Root() room: ClientSideRoom): Promise<RoomMember[]> {
    return this.yjsService.activeRoomMembers(room.hashId);
  }

  @FieldResolver(() => [RoomVisit])
  async visits(
    @Root() room: Room,
    @Arg('userId', { nullable: true }) userId: string,
    @Arg('fromCurrentUser', { nullable: true }) fromCurrentUser: boolean,
    @Arg('first', { nullable: true }) first: number,
    @Ctx() context: AuthorizedContext,
  ): Promise<RoomVisit[]> {
    if (!first && !userId && !fromCurrentUser) {
      return room.visits;
    } else {
      let query = this.roomVisitRepository.createQueryBuilder('roomVisit');
      if (!fromCurrentUser) {
        query = query.innerJoin('roomVisit.user', 'user').where('user.id = :userId', { userId });
      } else if (userId) {
        const currentUserId = (await this.tedisService.getCurrentUserId(context.githubSessionToken)) as string;
        query = query.innerJoin('roomVisit.user', 'user').where('user.id = :userId', { userId: currentUserId });
      } else {
        /// don't know how to handle this case, but not needed;
      }
      const visits = await query.orderBy('roomVisit.visitTime', 'DESC').limit(first).getMany();
      return visits;
    }
  }

  @Mutation(() => ClientSideRoom)
  async createRoom(@Arg('data') userData: CreateRoomInput) {
    const owner = await this.userRepository.findOneOrFail({ id: parseInt(userData.ownerId) });

    const room = new Room();
    room.createdAt = new Date();
    room.name = userData.name;
    room.owner = Promise.resolve(owner);
    room.gistName = userData.gistName;
    const savedRoom = await this.roomRepository.save(room);
    const clientSideRoom = this.clientSideRoomService.getClientSideRoom(savedRoom);
    return clientSideRoom;
  }

  @Authorized()
  @Mutation(() => [ClientSideRoom])
  async deleteRoom(@Arg('data') data: DeleteRoomInput, @Ctx() context: AuthorizedContext) {
    await this.roomRepository.delete(data.id);
    const userId = await this.tedisService.getCurrentUserId(context.githubSessionToken);
    if (!userId) {
      throw "got through authorization but session wasn't set for currentUser query";
    }
    const rooms = await this.userRepository
      .findOne({ id: parseInt(userId) }, { relations: ['ownedRooms'] })
      .then((u) => u?.ownedRooms);

    if (!rooms) {
      throw "got through authorization but session wasn't set for currentUser query";
    }

    return rooms?.map((r) => this.clientSideRoomService.getClientSideRoom(r)) || [];
  }
}

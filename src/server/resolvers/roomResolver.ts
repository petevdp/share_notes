import produce from 'immer';
import { AuthorizedContext } from 'Server/context';
import { CreateRoomInput, DeleteRoomInput, RoomInput } from 'Server/inputs/roomInputs';
import { RoomVisitsInput } from 'Server/inputs/roomVisitInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
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
    @InjectRepository(RoomVisit) private readonly roomVisitRepository: Repository<RoomVisit>,
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
        console.log('current: ', currentUserId);
        query = query.innerJoin('roomVisit.user', 'user').where('user.id = :userId', { userId: currentUserId });
      }
      const visits = await query.orderBy('roomVisit.visitTime', 'DESC').limit(first).getMany();
      console.log('visits: ', visits);
      return visits;
    }
  }

  @Mutation(() => ClientSideRoom)
  async createRoom(@Arg('data') userData: CreateRoomInput) {
    const owner = await this.userRepository.findOne({ id: parseInt(userData.ownerId) });

    const room = this.roomRepository.create({
      ...userData,
      createdAt: new Date(),
      owner,
    });
    await this.roomRepository.save(room);
    const clientSideRoom = this.clientSideRoomService.getClientSideRoom(room);
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

  // @Query(() => [ClientSideRoom])
  // async roomsByVisits(
  //   @Arg('data') input: RoomVisitsInput,
  //   @Ctx() context: AuthorizedContext,
  // ): Promise<ClientSideRoom[]> {
  //   const conditions: string[] = [];
  //   const id = await this.tedisService.getCurrentUserId(context.githubSessionToken);
  //   if (!id) {
  //     throw 'not logged in';
  //   }
  //   // make sure records being returned are from this user or from owned rooms
  //   conditions.push('user.id = :currentUserId OR roomOwner.id = :currentUserId');
  //   const queryParameters: {
  //     dateRangeStart?: Date;
  //     dateRangeEnd?: Date;
  //     roomIds?: string[];
  //     userIds?: string[];
  //     currentUserId: string;
  //   } = { currentUserId: id };

  //   if (input.dateRangeStart) {
  //     conditions.push('roomVisit.createdAt >= :dateRangeStart');
  //     queryParameters.dateRangeStart = input.dateRangeStart;
  //   }

  //   if (input.dateRangeEnd) {
  //     conditions.push('roomVisit.createdAt < :dateRangeEnd');
  //     queryParameters.dateRangeEnd = input.dateRangeEnd;
  //   }

  //   if (input.roomIds) {
  //     conditions.push('room.id in (:...roomIds)');
  //     queryParameters.roomIds = input.roomIds;
  //   }

  //   if (input.userIds) {
  //     conditions.push('user.id in (:...userIds)');
  //     queryParameters.userIds = input.userIds;
  //   }

  //   const condition = conditions.map((c) => `(${c})`).join(' AND ');

  //   const rooms = await this.roomRepository
  //     .createQueryBuilder('room')
  //     .innerJoinAndSelect('room.visits', 'roomVisit')
  //     .innerJoinAndSelect('roomVisit.user', 'user')
  //     .innerJoin('room.owner', 'roomOwner')
  //     .where(condition, queryParameters)
  //     .orderBy('roomVisit.visitTime', input.sort === 'ascending' ? 'ASC' : 'DESC')
  //     .limit(input.first)
  //     .getMany();

  //   return rooms
  //     .map((r) => ({ ...r, visits: r.visits.slice(0, 1) }))
  //     .map((r) => this.clientSideRoomService.getClientSideRoom(r));
  // }
}

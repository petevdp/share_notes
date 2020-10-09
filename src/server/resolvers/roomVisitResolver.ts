import { AuthorizedContext } from 'Server/context';
import { RoomVisitsInput } from 'Server/inputs/roomVisitInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { TedisService } from 'Server/services/tedisService';
import { Arg, Ctx, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

@Service()
@Resolver(() => RoomVisit)
export class RoomVisitResolver {
  constructor(
    private readonly clientSideRoomService: ClientSideRoomService,
    private readonly tedisService: TedisService,
    @InjectRepository(RoomVisit) private readonly roomVisitRepository: Repository<RoomVisit>,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
  ) {}

  @FieldResolver(() => ClientSideRoom)
  room(@Root() visit: RoomVisit) {
    return this.clientSideRoomService.getClientSideRoom(visit.room);
  }

  @FieldResolver(() => User)
  user(@Root() visit: RoomVisit) {
    return visit.user;
  }

  @Query(() => [RoomVisit])
  async roomVisits(@Arg('data') input: RoomVisitsInput, @Ctx() context: AuthorizedContext) {
    const conditions: string[] = [];

    const id = await this.tedisService.getCurrentUserId(context.githubSessionToken);

    if (!id) {
      return null;
    }
    // make sure records being returned are from this user or from owned rooms
    conditions.push('user.id = :currentUserId OR roomOwner.id = :currentUserId');
    const queryParameters: {
      dateRangeStart?: Date;
      dateRangeEnd?: Date;
      roomIds?: string[];
      userIds?: string[];
      currentUserId: string;
    } = { currentUserId: id };

    if (input.dateRangeStart) {
      conditions.push('roomVisit.createdAt >= :dateRangeStart');
      queryParameters.dateRangeStart = input.dateRangeStart;
    }

    if (input.dateRangeEnd) {
      conditions.push('roomVisit.createdAt < :dateRangeEnd');
      queryParameters.dateRangeEnd = input.dateRangeEnd;
    }

    if (input.roomIds) {
      conditions.push('room.id in (:...roomIds)');
      queryParameters.roomIds = input.roomIds;
    }

    if (input.userIds) {
      conditions.push('user.id in (:...userIds)');
      queryParameters.userIds = input.userIds;
    }

    const condition = conditions.map((c) => `(${c})`).join(' AND ');

    const visits = await this.roomVisitRepository
      .createQueryBuilder('roomVisit')
      .innerJoinAndSelect('roomVisit.room', 'room')
      .innerJoinAndSelect('roomVisit.user', 'user')
      .innerJoin('room.owner', 'roomOwner')
      .where(condition, queryParameters)
      .orderBy('roomVisit.visitTime', input.sort === 'ascending' ? 'ASC' : 'DESC')
      .limit(input.first)
      .getMany();

    return visits;
  }
}

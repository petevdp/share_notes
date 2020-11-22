import { AuthorizedContext } from 'Server/context';
import { RoomVisitsInput } from 'Server/inputs/roomVisitInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { TedisService } from 'Server/services/tedisService';
import { Arg, Authorized, Ctx, FieldResolver, Query, Resolver, Root } from 'type-graphql';
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
  async room(@Root() visit: RoomVisit) {
    return this.clientSideRoomService.getClientSideRoom(await visit.room);
  }

  @FieldResolver(() => User)
  user(@Root() visit: RoomVisit) {
    return visit.user;
  }

  @Authorized()
  @Query(() => [RoomVisit])
  async roomVisits(@Arg('data') input: RoomVisitsInput, @Ctx() context: AuthorizedContext) {
    const id = await this.tedisService.getCurrentUserId(context.githubSessionToken);

    if (!id) {
      return null;
    }
    let query = this.roomVisitRepository
      .createQueryBuilder('roomVisit')
      .innerJoinAndSelect('roomVisit.room', 'room')
      .innerJoinAndSelect('roomVisit.user', 'user')
      .innerJoin('room.owner', 'roomOwner')
      .where('user.id = :currentUserId OR roomOwner.id = :currentUserId', { currentUserId: id });

    if (input.dateRangeStart) {
      query = query.andWhere('roomVisit.createdAt >= :dateRangeStart', { dateRangeStart: input.dateRangeStart });
    }

    if (input.dateRangeEnd) {
      query = query.andWhere('roomVisit.createdAt < :dateRangeEnd', { dateRangeEnd: input.dateRangeEnd });
    }

    if (input.roomIds) {
      query = query.andWhere('room.id in (:...roomIds)', { roomIds: input.roomIds });
    }

    if (input.userIds) {
      query = query.andWhere('user.id in (:...userIds)', { userIds: input.userIds });
    }

    return query
      .orderBy('roomVisit.visitTime', input.sort === 'ascending' ? 'ASC' : 'DESC')
      .limit(input.first)
      .getMany();
  }
}

import { AuthorizedContext } from 'Server/context';
import { RoomVisitsInput } from 'Server/inputs/roomVisitInputs';
import { ClientSideRoom } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { Arg, Authorized, Ctx, Field, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

@Service()
@Resolver(() => RoomVisit)
export class RoomVisitResolver {
  constructor(
    private readonly clientSideRoomService: ClientSideRoomService,
    @InjectRepository(RoomVisit) private readonly roomVisitRepository: Repository<RoomVisit>,
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
    const queryParameters: { dateRangeStart?: Date; dateRangeEnd?: Date; roomIds?: string[]; userIds?: string[] } = {};

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
      .where(condition, queryParameters)
      .getMany();

    console.log('visits: ', visits);

    return visits;
  }
}

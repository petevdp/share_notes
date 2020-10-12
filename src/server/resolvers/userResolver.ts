import { AuthorizedContext } from 'Server/context';
import { RoomVisitsInput } from 'Server/inputs/roomVisitInputs';
import { RoomVisitsForUserInput, UserInput } from 'Server/inputs/userInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { HashIdService } from 'Server/services/hashIdService';
import { TedisService, USER_ID_BY_SESSION_KEY } from 'Server/services/tedisService';
import { Arg, Authorized, Ctx, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

@Service()
@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    private readonly clientSideRoomService: ClientSideRoomService,
    private readonly tedisService: TedisService,
    private readonly hashIdService: HashIdService,
  ) {}
  @Query(() => [User])
  users() {
    return this.userRepository.find();
  }

  @Authorized()
  @Query(() => User)
  async currentUser(@Ctx() context: AuthorizedContext): Promise<User | null> {
    const userIdStr = await this.tedisService.tedis.hget(USER_ID_BY_SESSION_KEY, context.githubSessionToken);
    if (userIdStr === undefined) {
      throw "got through authorization but session wasn't set for currentUser query";
    }
    return (await this.userRepository.findOne({ id: Number(userIdStr) })) || null;
  }

  @Query(() => User)
  async user(@Arg('data') data: UserInput): Promise<User | null> {
    return (await this.userRepository.findOne({ id: data.id })) || null;
  }

  @FieldResolver(() => [ClientSideRoom])
  async ownedRooms(@Root() user: User): Promise<ClientSideRoom[] | null> {
    return user.ownedRooms.then((rooms) => rooms.map((r) => this.getClientSideRoom(r)));
  }

  @FieldResolver(() => [RoomVisit])
  async roomVisits(@Root() user: User, @Arg('data') input: RoomVisitsForUserInput): Promise<RoomVisit[]> {
    if (input.perRoom) {
      const out = await this.roomRepository
        .createQueryBuilder('room')
        .innerJoinAndSelect('user.roomVisits', 'roomVisits')
        .innerJoinAndSelect('room.visits', 'roomVisit')
        .innerJoinAndSelect('roomVisit.user', 'user')
        .innerJoin('room.owner', 'roomOwner')
        .orderBy('roomVisits.visitTime', input.sort)
        .limit(input.first)
        .getMany();

      return Promise.all(out.map((r) => r.visits.then((v) => v[0])));
    }

    if (!user.roomVisits) {
      return this.userRepository
        .findOneOrFail({ id: user.id }, { relations: ['roomVisits'] })
        .then((user) => user.roomVisits);
    }

    return user.roomVisits;
  }

  private getClientSideRoom(room: Room) {
    return {
      ...room,
      hashId: this.hashIdService.hashIds.encode(room.id),
    };
  }
}

import { AuthorizedContext } from 'Server/context';
import { UserInput } from 'Server/inputs/userInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { User } from 'Server/models/user';
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
    const rooms = await this.userRepository
      .findOne({ id: user.id }, { relations: ['ownedRooms'] })
      .then((u) => u?.ownedRooms);

    return rooms?.map((r) => this.getClientSideRoom(r)) || null;
  }

  private getClientSideRoom(room: Room) {
    return {
      ...room,
      hashId: this.hashIdService.hashIds.encode(room.id),
    };
  }
}

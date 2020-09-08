import { Resolver, Query, Arg, FieldResolver, Root, Ctx, Authorized } from 'type-graphql';
import { User } from 'Server/models/user';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { UserInput } from 'Shared/inputs/userInputs';
import { Room, ClientSideRoom } from 'Server/models/room';
import { HashIdService } from 'Server/services/hashIdService';
import { TedisService, USER_ID_BY_SESSION_KEY } from 'Server/services/tedisService';
import { Context } from 'Server/context';

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
  async currentUser(@Ctx() context: Context): Promise<User> {
    const userIdStr = await this.tedisService.tedis.hget(USER_ID_BY_SESSION_KEY, context.githubSessionToken);
    if (userIdStr === undefined) {
      throw "got through authorization but session wasn't set for currentUser query";
    }
    return this.userRepository.findOne({ id: Number(userIdStr) });
  }

  @Query(() => User)
  async user(@Arg('data') data: UserInput): Promise<User> {
    return this.userRepository.findOne({ id: data.id });
  }

  @FieldResolver(() => [ClientSideRoom])
  async ownedRooms(@Root() user: User) {
    const rooms = await this.userRepository
      .findOne({ id: user.id }, { relations: ['ownedRooms'] })
      .then((u) => u.ownedRooms);

    return rooms.map((r) => this.getClientSideRoom(r));
  }

  private getClientSideRoom(room: Room) {
    return {
      ...room,
      hashId: this.hashIdService.hashIds.encode(room.id),
    };
  }
}

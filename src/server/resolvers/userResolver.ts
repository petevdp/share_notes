import { Resolver, Query, Mutation, Arg, FieldResolver, Root, ResolverInterface } from 'type-graphql';
import { User } from 'Server/models/user';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { CreateUserInput, UserInput } from 'Shared/inputs/userInputs';
import { Room, ClientSideRoom } from 'Server/models/room';
import { HashIdService } from 'Server/services/hashIdService';

@Service()
@Resolver((of) => User)
export class UserResolver {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    private readonly hashIdService: HashIdService,
  ) {}
  @Query(() => [User])
  users() {
    return this.userRepository.find();
  }

  @Query(() => User)
  currentUser(@Arg('data') data: UserInput) {
    return this.userRepository.findOne({ id: data.id });
  }

  @Query(() => User)
  user(@Arg('data') data: UserInput) {
    return this.userRepository.findOne({ id: data.id });
  }

  @FieldResolver(() => ClientSideRoom)
  async ownedRooms(@Root() user: User) {
    const rooms = await this.userRepository
      .findOne({ id: user.id }, { relations: ['ownedRooms'] })
      .then((u) => u.ownedRooms);

    return rooms.map((r) => this.getClientSideRoom(r));
  }

  @Mutation(() => User)
  async createUser(@Arg('data') data: CreateUserInput) {
    const user = this.userRepository.create({ ...data, ownedRooms: [] });
    await this.userRepository.save(user);
    return user;
  }

  private getClientSideRoom(room: Room) {
    return {
      ...room,
      hashId: this.hashIdService.hashIds.encode(room.id),
    };
  }
}

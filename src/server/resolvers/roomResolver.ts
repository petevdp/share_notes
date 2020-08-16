import { Resolver, Query, Mutation, Arg, FieldResolver, Root } from 'type-graphql';
import { Room } from 'Server/models/room';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import { User } from 'Server/models/user';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';

@Service()
@Resolver((of) => Room)
export class RoomResolver {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  @Query(() => [Room])
  async rooms() {
    const room = await this.roomRepository.find();
    return room;
  }

  @FieldResolver()
  async owner(@Root() room: Room) {
    return await this.roomRepository.findOne({ id: room.id }, { relations: ['owner'] }).then((r) => r.owner);
  }

  @Mutation(() => Room)
  async createRoom(@Arg('data') data: CreateRoomInput) {
    const owner = await this.userRepository.findOne({ id: data.ownerId });
    const room = this.roomRepository.create(data);
    room.owner = owner;
    return this.roomRepository.save(room);
  }
}

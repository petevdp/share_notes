import { Resolver, Query, Mutation, Arg, FieldResolver, Root } from 'type-graphql';
import { Room } from 'Server/models/room';
import { CreateRoomInput, RoomInput } from 'Shared/inputs/roomInputs';
import { User } from 'Server/models/user';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Service()
@Resolver((of) => Room)
export class RoomResolver {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Query(() => Room)
  async room(@Arg('data') roomInput: RoomInput) {
    return this.roomRepository.findOne(roomInput);
  }

  @Query(() => [Room])
  async rooms() {
    return this.roomRepository.find();
  }

  @FieldResolver()
  async owner(@Root() room: Room) {
    return await this.roomRepository.findOne({ id: room.id }, { relations: ['owner'] }).then((r) => r.owner);
  }

  @Mutation(() => Room)
  async createRoom(@Arg('data') userData: CreateRoomInput) {
    const owner = await this.userRepository.findOne({ id: userData.ownerId });
    const uuid = uuidv4();
    const room = this.roomRepository.create({
      ...userData,
      uuid,
      owner,
    });
    await this.roomRepository.save(room);
  }
}

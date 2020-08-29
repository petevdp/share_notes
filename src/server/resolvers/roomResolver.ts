import { Resolver, Query, Mutation, Arg, FieldResolver, Root } from 'type-graphql';
import { Room, ClientSideRoom } from 'Server/models/room';
import { CreateRoomInput, RoomInput } from 'Shared/inputs/roomInputs';
import { User } from 'Server/models/user';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { HashIdService } from 'Server/services/hashIdService';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { stringify } from 'querystring';
import { YdocService } from 'Server/services/ydocService';
// import { YdocService } from 'Server/services/ydocService';

@Service()
@Resolver((of) => ClientSideRoom)
export class RoomResolver {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly clientSideRoomService: ClientSideRoomService,
    private readonly ydocService: YdocService,
  ) {}

  @Query(() => ClientSideRoom)
  async room(@Arg('data') roomInput: RoomInput) {
    console.log('ydoc: ');
    console.log(this.ydocService.doc);
    return this.clientSideRoomService.findRoom(roomInput);
  }

  @Query(() => [ClientSideRoom])
  async rooms() {
    const rooms = await this.roomRepository.find();
    return this.clientSideRoomService.getClientSideRooms(rooms);
  }

  @FieldResolver(() => User)
  owner(@Root() room: ClientSideRoom) {
    return this.roomRepository.findOne({ id: room.id }, { relations: ['owner'] }).then((r) => r.owner);
  }

  @Mutation(() => ClientSideRoom)
  async createRoom(@Arg('data') userData: CreateRoomInput) {
    const owner = await this.userRepository.findOne({ id: userData.ownerId });
    let room = this.roomRepository.create({
      ...userData,
      owner,
    });
    room = await this.roomRepository.save(room);
    return this.clientSideRoomService.getClientSideRoom(room);
  }
}

import { RoomInput } from 'Server/inputs/roomInputs';
import { Room } from 'Server/models/room';
import { User } from 'Server/models/user';
import { HashIdService } from 'Server/services/hashIdService';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

export interface createRoomFields {
  name: string;
  owner: number | User;
}

@Service()
export class ClientSideRoomService {
  constructor(
    private readonly hashIdService: HashIdService,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
  ) {}

  getIdFromHashId(hashId: string) {
    const [id] = (this.hashIdService.hashIds.decode(hashId) as unknown) as number[];
    return id;
  }

  async findRoom(input: RoomInput) {
    const { hashId: _, ...rest } = input;
    let roomPartial: Partial<Room> = rest;
    const id = this.getIdFromHashId(input.hashId);
    if (!id) {
      return;
    }
    const room = await this.roomRepository.findOne(roomPartial, { relations: ['owner'] });
    return room && this.getClientSideRoom(room);
  }

  getClientSideRooms(rooms: Room[]) {
    return rooms.map((room) => this.getClientSideRoom(room));
  }

  public getClientSideRoom(room: Room) {
    return {
      ...room,
      hashId: this.hashIdService.hashIds.encode(room.id),

      // the below properties are are internally getters, so we need to assign this explicitely
      owner: room.owner,
      visits: room.visits,
    };
  }
}

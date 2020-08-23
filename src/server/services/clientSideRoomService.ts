import { Entity, EntityRepository, EntityManager, Repository } from 'typeorm';
import { User } from 'Server/models/user';
import { Room } from 'Server/models/room';
import { HashIdService } from 'Server/services/hashIdService';
import { Service, Inject } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { RoomInput } from '../../../dist/src/shared/inputs/roomInputs';

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

  async findRoom(input: RoomInput) {
    let { hashId, ...rest } = input;
    let roomPartial: Partial<Room> = rest;
    if (input.hashId) {
      const [id] = (this.hashIdService.hashIds.decode(input.hashId) as unknown) as number[];
      if (!roomPartial.id) {
        roomPartial = {
          ...roomPartial,
          id: (id as undefined) as number,
        };
      }
    }
    const room = await this.roomRepository.findOne(roomPartial);
    return this.getClientSideRoom(room);
  }

  getClientSideRooms(rooms: Room[]) {
    return rooms.map(this.getClientSideRoom);
  }

  public getClientSideRoom(room: Room) {
    return {
      ...room,
      hashId: this.hashIdService.hashIds.encode(room.id),
    };
  }
}

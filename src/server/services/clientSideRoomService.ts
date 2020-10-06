import { Room } from 'Server/models/room';
import { User } from 'Server/models/user';
import { HashIdService } from 'Server/services/hashIdService';
import { RoomInput } from 'Shared/inputs/roomInputs';
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

  async findRoom(input: RoomInput) {
    const { hashId: _, ...rest } = input;
    let roomPartial: Partial<Room> = rest;
    if (input.id) {
      roomPartial = { id: input.id };
    } else if (input.hashId) {
      const [id] = (this.hashIdService.hashIds.decode(input.hashId) as unknown) as number[];
      if (id) {
        roomPartial = {
          ...roomPartial,
          id,
        };
      }
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
    };
  }
}

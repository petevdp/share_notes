import { Room } from 'Server/models/room';
import { User } from 'Server/models/user';
import { HashIdService } from 'Server/services/hashIdService';
import { Inject, Service } from 'typedi';
import { Entity, EntityManager, EntityRepository, Repository } from 'typeorm';
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
    const { hashId, ...rest } = input;
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
    const room = await this.roomRepository.findOne(roomPartial);
    return room && this.getClientSideRoom(room);
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

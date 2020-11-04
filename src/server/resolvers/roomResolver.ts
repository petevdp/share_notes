import { fork } from 'child_process';
import { log } from 'console';
import fs from 'fs';
import pipe from 'lodash/fp/pipe';
import { AuthorizedContext } from 'Server/context';
import {
  CreateRoomInput,
  DeleteRoomInput,
  RoomInput,
  UpdateRoomGistInput,
  UpdateRoomInput,
  validateUpdateRoomGistInput,
} from 'Server/inputs/roomInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { RoomMember } from 'Server/models/roomMember';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { CREATED_GISTS_LOG } from 'Server/paths';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { TedisService, USER_ID_BY_SESSION_KEY } from 'Server/services/tedisService';
import { YjsService } from 'Server/services/yjsService';
import { githubRequestWithAuth } from 'Server/utils/githubUtils';
import { GistUpdateType } from 'Shared/types/roomTypes';
import { Arg, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

@Service()
@Resolver(() => ClientSideRoom)
export class RoomResolver {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RoomVisit) private readonly roomVisitRepository: Repository<RoomVisit>,
    private readonly clientSideRoomService: ClientSideRoomService,
    private readonly tedisService: TedisService,
    private readonly yjsService: YjsService,
  ) {}

  @Query(() => ClientSideRoom, { nullable: true })
  async room(@Arg('data') roomInput: RoomInput) {
    return this.clientSideRoomService.findRoom(roomInput);
  }

  @Query(() => [ClientSideRoom])
  async rooms() {
    const rooms = await this.roomRepository.find();
    return this.clientSideRoomService.getClientSideRooms(rooms);
  }

  @FieldResolver(() => User)
  async owner(@Root() room: ClientSideRoom): Promise<User | null> {
    const owner = await this.roomRepository.findOne({ id: room.id }, { relations: ['owner'] }).then((r) => r?.owner);
    return owner || null;
  }

  @FieldResolver(() => [RoomMember])
  async activeRoomMembers(@Root() room: ClientSideRoom): Promise<RoomMember[]> {
    return this.yjsService.activeRoomMembers(room.hashId);
  }

  @FieldResolver(() => [RoomVisit])
  async visits(
    @Root() room: Room,
    @Arg('userId', { nullable: true }) userId: string,
    @Arg('fromCurrentUser', { nullable: true }) fromCurrentUser: boolean,
    @Arg('first', { nullable: true }) first: number,
    @Ctx() context: AuthorizedContext,
  ): Promise<RoomVisit[]> {
    let query = this.roomVisitRepository
      .createQueryBuilder('roomVisit')
      .innerJoin('roomVisit.room', 'room')
      .where('room.id = :roomId', { roomId: room.id })
      .orderBy('roomVisit.visitTime', 'DESC');

    if (fromCurrentUser || userId) {
      const userIdToCheck = fromCurrentUser
        ? ((await this.tedisService.getCurrentUserId(context.githubSessionToken)) as string)
        : userId;

      const userSpecificQuery = query
        .innerJoin('roomVisit.user', 'user')
        .andWhere('user.id = :userId', { userId: userIdToCheck });

      if (first) {
        return userSpecificQuery.limit(first).getMany();
      } else {
        return userSpecificQuery.getMany();
      }
    } else if (!first) {
      return query.getMany();
    } else {
      return query.limit(first).getMany();
    }
  }

  @Mutation(() => ClientSideRoom)
  async createRoom(@Arg('data') userData: CreateRoomInput) {
    const owner = await this.userRepository.findOneOrFail({ id: parseInt(userData.ownerId) });
    const room = new Room();
    room.createdAt = new Date();
    room.name = userData.name;
    room.owner = Promise.resolve(owner);
    room.gistName = userData.gistName;
    const savedRoom = await this.roomRepository.save(room);
    const clientSideRoom = this.clientSideRoomService.getClientSideRoom(savedRoom);
    return clientSideRoom;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteRoom(@Arg('data') data: DeleteRoomInput, @Ctx() context: AuthorizedContext) {
    await this.roomRepository.delete(data.id);
    const userId = await this.tedisService.getCurrentUserId(context.githubSessionToken);
    if (!userId) {
      throw "got through authorization but session wasn't set for currentUser query";
    }
    const rooms = await this.userRepository
      .findOne({ id: parseInt(userId) }, { relations: ['ownedRooms'] })
      .then((u) => u?.ownedRooms);

    if (!rooms) {
      throw "got through authorization but session wasn't set for currentUser query";
    }

    return true;
  }

  @Authorized()
  @Mutation(() => ClientSideRoom)
  async updateRoom(@Arg('input') input: UpdateRoomInput, @Ctx() context: AuthorizedContext) {
    const { gistUpdate: gistUpdateInput, roomName, roomId } = input;
    const gistUpdate = validateUpdateRoomGistInput(gistUpdateInput);
    const currentUserId = await this.tedisService.getCurrentUserId(context.githubSessionToken);
    if (!currentUserId) {
      throw 'idk';
    }
    const room = await this.roomRepository.findOneOrFail({ id: parseInt(roomId) }, { relations: ['owner'] });

    if (parseInt(currentUserId) !== (await room.owner).id) {
      throw 'user doesnt own this room';
    }

    const owner = await room.owner;

    switch (gistUpdate.type) {
      case GistUpdateType.Create:
        const { name, description } = gistUpdate;
        const newGistData = await githubRequestWithAuth(context.githubSessionToken)('POST /gists', {
          files: { [name]: { content: name } },
          description,
        }).then((res) => res.data);
        room.gistName = newGistData.id;
        break;

      case GistUpdateType.Import:
        const { gistId } = gistUpdate;
        const originalGistData = await githubRequestWithAuth(context.githubSessionToken)('GET /gists/:gist_id', {
          gist_id: gistId,
        }).then((res) => res.data);

        if (originalGistData.owner.id !== owner.githubDatabaseId) {
          // this user doesn't own the room, so we create a fork
          const forkedGistData = await githubRequestWithAuth(context.githubSessionToken)('POST /gists/:gist_id/forks', {
            gist_id: gistId,
          }).then((res) => res.data);

          room.gistName = forkedGistData.id;
        } else {
          // this user owns the room
          room.gistName = originalGistData.id;
        }
        break;

      case GistUpdateType.Delete:
        delete room.gistName;
        break;

      case GistUpdateType.None:
        break;
    }

    room.name = roomName;

    return this.roomRepository.save(room).then((room) => this.clientSideRoomService.getClientSideRoom(room));
  }
}

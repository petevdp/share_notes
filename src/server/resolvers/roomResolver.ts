import { UserInputError } from 'apollo-server-express';
import { AuthorizedContext } from 'Server/context';
import {
  CreateRoomInput,
  DeleteRoomInput,
  RoomInput,
  UpdateRoomInput,
  validateUpdateRoomGistInput,
} from 'Server/inputs/roomInputs';
import { ClientSideRoom, Room } from 'Server/models/room';
import { RoomMember } from 'Server/models/roomMember';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { ClientSideRoomService } from 'Server/services/clientSideRoomService';
import { TedisService } from 'Server/services/tedisService';
import { YjsService } from 'Server/services/yjsService';
import { githubRequestWithAuth } from 'Server/utils/githubUtils';
import { fileInputForGithub } from 'Shared/githubTypes';
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

  @Authorized()
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
        ? ((await this.tedisService.getCurrentUserId(context.githubSessionToken)) as number)
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

  @Authorized()
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
    const room = await this.roomRepository.findOneOrFail(this.clientSideRoomService.getIdFromHashId(data.hashId), {
      relations: ['owner'],
    });
    const userId = await this.tedisService.getCurrentUserId(context.githubSessionToken);
    const owner = await room.owner;
    if (userId && owner.id !== userId) {
      throw new UserInputError("user doesn't own this room");
    }
    await this.roomRepository.delete(room.id);
    return true;
  }

  @Authorized()
  @Mutation(() => ClientSideRoom)
  async updateRoom(@Arg('input') input: UpdateRoomInput, @Ctx() context: AuthorizedContext) {
    const { gistUpdate: gistUpdateInput, roomName, roomHashId } = input;
    const gistUpdate = validateUpdateRoomGistInput(gistUpdateInput);
    const currentUserId = await this.tedisService.getCurrentUserId(context.githubSessionToken);
    if (!currentUserId) {
      throw 'idk';
    }
    const room = await this.roomRepository.findOneOrFail(this.clientSideRoomService.getIdFromHashId(roomHashId), {
      relations: ['owner'],
    });
    console.log({ currentUserId: currentUserId, owner: await room.owner });

    if (currentUserId !== (await room.owner).id) {
      throw "user doesn't own this room";
    }

    const owner = await room.owner;

    switch (gistUpdate.type) {
      case GistUpdateType.Create:
        const { description } = gistUpdate;
        const filesForGithub = this.yjsService.getDocForRoom(roomHashId)?.getFilesForGithub();

        const newGistData = await githubRequestWithAuth(context.githubSessionToken)('POST /gists', {
          files: filesForGithub as fileInputForGithub,
          description,
        }).then((res) => res.data);
        room.gistName = newGistData.id;
        break;

      case GistUpdateType.Import:
        const gistId = gistUpdate.gistId as string;
        const originalGistData = await githubRequestWithAuth(context.githubSessionToken)('GET /gists/:gist_id', {
          gist_id: gistId,
        })
          .catch((err) => {
            throw new UserInputError('Unable to find gistId for import', { invalidArgs: gistId });
          })
          .then((res) => res.data);

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
        // we have to do this to actually delete this field. Adding null to the type leads to typeorm issues.
        room.gistName = (null as unknown) as undefined;
        break;

      case GistUpdateType.None:
        break;
    }

    room.name = roomName;

    return this.roomRepository.save(room).then((room) => this.clientSideRoomService.getClientSideRoom(room));
  }
}

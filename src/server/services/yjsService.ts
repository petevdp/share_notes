import { request as octokitRequest } from '@octokit/request';
import { IncomingMessage } from 'http';
import path from 'path';
import { Room } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { getYjsDocNameForRoom } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';
import { roomDetails, RoomManager, startingRoomDetails } from 'Shared/roomManager';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import WebSocket from 'ws';
import {} from 'y-websocket/bin/utils';
import { docs, setupWSConnection, WSSharedDoc } from 'y-websocket/bin/utils';
import * as Y from 'yjs';

import { ClientSideRoomService } from './clientSideRoomService';
import { TedisService, TOKEN_BY_USER_ID, USER_ID_BY_SESSION_KEY } from './tedisService';

@Service()
export class YjsService {
  readonly docs: Map<string, Y.Doc>;
  constructor(
    private readonly clientSideRoomService: ClientSideRoomService,
    private readonly tedisService: TedisService,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RoomVisit) private readonly roomVisitRepository: Repository<RoomVisit>,
  ) {
    this.docs = docs;
  }

  addDoc(docName: string) {
    const doc = new WSSharedDoc(docName);
    this.docs.set(docName, doc);
    return doc;
  }

  async setupWsConnection(conn: WebSocket, req: IncomingMessage, user?: User) {
    const url = req.url as string;
    const roomHashId = path.basename(url.slice(1).split('?')[0]);
    const docName = getYjsDocNameForRoom(roomHashId);
    let newDoc = !this.docs.has(docName);
    setupWSConnection(conn, req, { gc: true, docName: docName });

    (async () => {
      if (!req.headers.cookie) {
        return;
      }
      const userToken = getCookie('session-token', req.headers.cookie);
      if (!userToken) {
        return;
      }
      const userId = await this.tedisService.tedis.hget(USER_ID_BY_SESSION_KEY, userToken);
      if (!userId) {
        return;
      }
      const [user, room]: [User, Room | undefined] = await Promise.all([
        this.userRepository.findOneOrFail({ id: parseInt(userId) }),
        this.clientSideRoomService.findRoom({ hashId: roomHashId }),
      ]);

      if (!room) {
        throw "couldn't find room";
      }

      this.roomVisitRepository.insert({ user, room, visitTime: new Date() });
    })();

    const doc = this.docs.get(docName);
    if (!doc) {
      throw 'y no doc';
    }
    if (newDoc) {
      const manager = new ServerSideRoomManager(doc);
      const clientSideRoom = await this.clientSideRoomService.findRoom({ hashId: roomHashId });
      if (!clientSideRoom) {
        throw "couldn't find clintsideroom";
      }

      const token = await this.tedisService.tedis.hget(TOKEN_BY_USER_ID, clientSideRoom.owner.id.toString());
      const details = await octokitRequest
        .defaults({
          headers: { authorization: `bearer ${token}` },
        })('GET /gists/:gist_id', { gist_id: clientSideRoom.gistName })
        .then((res) => res.data);

      manager.populate(
        {
          gistName: clientSideRoom?.gistName,
          hashId: clientSideRoom.hashId,
          id: clientSideRoom.id.toString(),
          name: clientSideRoom.name,
        },
        details,
      );
    }
  }

  getDocForRoom(roomHashId: string) {
    return this.docs.get(getYjsDocNameForRoom(roomHashId));
  }
}

export class ServerSideRoomManager extends RoomManager {
  constructor(yDoc: Y.Doc) {
    super(yDoc);
  }
  populate(startingRoomDetails: startingRoomDetails, gistDetails: gistDetails) {
    const details: roomDetails = {
      ...startingRoomDetails,
      gistLoaded: true,
    };
    // this.ydoc.transact(() => {
    for (let [key, detail] of Object.entries(details)) {
      this.yData.details.set(key, detail);
    }

    this.ydoc.transact(() => {
      for (let file of Object.values(gistDetails.files)) {
        this.addNewFile({ filename: file.filename, content: file.content });
      }
    });
    // });
  }
}

export function getCookie(name: string, cookies: string) {
  const nameEQ = name + '=';
  const ca = cookies.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

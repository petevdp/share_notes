import { request as octokitRequest } from '@octokit/request';
import { IncomingMessage } from 'http';
import __isEmpty from 'lodash/isEmpty';
import path from 'path';
import { Observable } from 'rxjs/internal/Observable';
import { fromArray } from 'rxjs/internal/observable/fromArray';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { map } from 'rxjs/internal/operators/map';
import { scan } from 'rxjs/internal/operators/scan';
import { tap } from 'rxjs/internal/operators/tap';
import { Room } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { getYjsDocNameForRoom } from 'Shared/environment';
import { fileDetails, gistDetails } from 'Shared/githubTypes';
import { roomDetails, RoomManager, startingRoomDetails } from 'Shared/roomManager';
import {
  clientAwareness,
  globalAwareness,
  globalAwarenessMap,
  roomMember,
  roomMemberWithComputed,
} from 'Shared/types/roomMemberAwarenessTypes';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import WebSocket from 'ws';
import { docs, setupWSConnection, WSSharedDoc } from 'y-websocket/bin/utils';
import * as Y from 'yjs';

import { ClientSideRoomService } from './clientSideRoomService';
import { TedisService, TOKEN_BY_USER_ID, USER_ID_BY_SESSION_KEY } from './tedisService';
export interface startingRoomFiles {
  [k: string]: {
    filename?: string;
    type?: string;
    language?: string;
    raw_url?: string;
    size?: number;
    truncated?: boolean;
    content?: string;
    [k: string]: unknown;
  };
}
@Service()
export class YjsService {
  readonly docs: Map<string, WSSharedDoc>;
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

  activeRoomMembers(roomHashId: string) {
    const docName = getYjsDocNameForRoom(roomHashId);
    const doc = this.docs.get(docName);
    if (!doc) {
      return [];
    }
    return ([...doc.awareness.getStates().values()] as clientAwareness[])
      .map((memberAwareness) => memberAwareness.roomMemberDetails)
      .filter(Boolean) as roomMemberWithComputed[];
  }

  async setupWsConnection(conn: WebSocket, req: IncomingMessage) {
    const url = req.url as string;
    const roomHashId = path.basename(url.slice(1).split('?')[0]);
    const docName = getYjsDocNameForRoom(roomHashId);
    let isNewDoc = !this.docs.has(docName);
    setupWSConnection(conn, req, { gc: true, docName: docName });
    conn.addEventListener('close', () => {
      const doc = this.docs.get(docName);
      if (doc) {
        const ids = doc.conns.get(conn);
        if (!ids || ids.size === 0) {
          const data = JSON.stringify(doc.toJSON());
        }
      }
    });

    if (!req.headers.cookie) {
      return;
    }
    const userToken = getCookie('session-token', req.headers.cookie);
    if (!userToken) {
      return;
    }
    const userId = await this.tedisService.tedis.hget(USER_ID_BY_SESSION_KEY, userToken);
    if (!userId) {
      throw "user isn't logged in or doesn't exist";
    }

    const userPromise = this.userRepository.findOneOrFail(userId);
    const roomId = this.clientSideRoomService.getIdFromHashId(roomHashId);
    const roomPromise = this.roomRepository.findOneOrFail(roomId.toString());

    // create a visit
    const visit = new RoomVisit();
    visit.visitTime = new Date();
    await Promise.all([userPromise, roomPromise]).then(() => {
      visit.user = userPromise;
      visit.room = roomPromise;
    });
    try {
      this.roomVisitRepository.save(visit);
    } catch (err) {
      console.log(err);
    }

    const doc = this.docs.get(docName);
    if (!doc) {
      throw 'y no doc';
    }
    if (isNewDoc) {
      const manager = new ServerSideRoomManager(doc);
      const clientSideRoom = this.clientSideRoomService.getClientSideRoom(await roomPromise);
      if (!clientSideRoom) {
        throw "couldn't find clintsideroom";
      }

      const token = await this.tedisService.tedis.hget(TOKEN_BY_USER_ID, (await clientSideRoom.owner).id.toString());

      let details: gistDetails | undefined;
      if (clientSideRoom.gistName) {
        details = await octokitRequest
          .defaults({
            headers: { authorization: `bearer ${token}` },
          })('GET /gists/:gist_id', { gist_id: clientSideRoom.gistName })
          .then((res) => res.data);
      }

      if (__isEmpty(manager.yData.details.toJSON())) {
        manager.populate(
          {
            gistName: clientSideRoom.gistName,
            hashId: clientSideRoom.hashId,
            id: clientSideRoom.id,
            name: clientSideRoom.name,
          },
          details?.files,
        );
      }
    }
  }

  getDocForRoom(roomHashId: string) {
    return this.docs.get(getYjsDocNameForRoom(roomHashId));
  }
}

export class ServerSideRoomManager extends RoomManager {
  constructor(public ydoc: WSSharedDoc) {
    super(ydoc);

    const idDelta$ = new Observable<globalAwarenessMap>((observer) => {
      const listener = () => {
        console.log('listener fired');
        console.log(ydoc.awareness.getStates());
        observer.next(ydoc.awareness.getStates() as globalAwarenessMap);
      };
      ydoc.awareness.on('change', listener);
      this.roomDestroyed$$.subscribe(() => {
        this.ydoc.awareness.off('change', listener);
        observer.complete();
      });
      console.log({ initialState: ydoc.awareness.getStates() });

      return () => ydoc.awareness.off('change', listener);
    }).pipe(
      scan<
        globalAwarenessMap,
        { deltas: { clientID: number; userID: string; deltaValue: boolean }[]; prevIDs: Set<string> }
      >(
        ({ prevIDs }, awarenessMap) => {
          const currIDs = new Set(
            [...awarenessMap.values()].map((client) => client.roomMemberDetails?.userIdOrAnonID).filter(Boolean),
          ) as Set<string>;
          const deltas: { clientID: number; userID: string; deltaValue: boolean }[] = [];
          for (let userID of [...new Set([...currIDs, ...prevIDs])]) {
            console.log('testing id: ', userID);
            const [clientID] = [...awarenessMap.entries()].find(
              ([, client]) =>
                client.roomMemberDetails?.userIdOrAnonID && client.roomMemberDetails.userIdOrAnonID === userID,
            ) as [number, clientAwareness];
            if (!prevIDs.has(userID) && currIDs.has(userID)) {
              deltas.push({ clientID, userID, deltaValue: true });
            } else if (prevIDs.has(userID) && !currIDs.has(userID)) {
              deltas.push({ clientID, userID, deltaValue: true });
            }
          }
          console.log({ deltas });
          return { deltas, prevIDs: currIDs };
        },
        { deltas: [], prevIDs: new Set<string>() },
      ),
      concatMap(({ deltas }) => fromArray(deltas)),
    );
  }

  populate(startingRoomDetails: startingRoomDetails, files?: { [key: string]: fileDetails }) {
    const details: roomDetails = {
      ...startingRoomDetails,
      gistLoaded: true,
    };

    for (let [key, detail] of Object.entries(details)) {
      this.yData.details.set(key, detail);
    }

    if (files) {
      this.ydoc.transact(() => {
        Object.entries(files);
        for (let [filename, file] of Object.entries(files)) {
          this.addNewFile({ filename, content: file.content || filename });
        }
      });
    } else {
      this.ydoc.transact(() => {
        const filename = startingRoomDetails.name.toLowerCase().split(' ').join('-');
        this.addNewFile({
          filename,
          content: `# ${filename}`,
        });
      });
    }
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

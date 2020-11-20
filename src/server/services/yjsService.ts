import { request as octokitRequest } from '@octokit/request';
import { IncomingMessage } from 'http';
import _ from 'lodash';
import __isEmpty from 'lodash/isEmpty';
import path from 'path';
import { Observable } from 'rxjs/internal/Observable';
import { fromArray } from 'rxjs/internal/observable/fromArray';
import { of } from 'rxjs/internal/observable/of';
import { race } from 'rxjs/internal/observable/race';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { delay } from 'rxjs/internal/operators/delay';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { map } from 'rxjs/internal/operators/map';
import { mapTo } from 'rxjs/internal/operators/mapTo';
import { scan } from 'rxjs/internal/operators/scan';
import { tap } from 'rxjs/internal/operators/tap';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Room } from 'Server/models/room';
import { RoomVisit } from 'Server/models/roomVisit';
import { User } from 'Server/models/user';
import { getYjsDocNameForRoom } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';
import { allBaseFileDetailsStates, allFileContentsState, RoomManager } from 'Shared/roomManager';
import { clientAwareness, globalAwarenessMap, roomMemberWithComputed } from 'Shared/types/roomMemberAwarenessTypes';
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

interface combinedFilesState {
  fileContents: allFileContentsState;
  fileDetails: allBaseFileDetailsStates;
}

@Service()
export class YjsService {
  readonly roomManagers: Map<string, ServerSideRoomManager>;
  constructor(
    private readonly clientSideRoomService: ClientSideRoomService,
    private readonly tedisService: TedisService,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RoomVisit) private readonly roomVisitRepository: Repository<RoomVisit>,
  ) {
    this.roomManagers = new Map();
  }

  // unsure if we still need this method, safe to delete
  // addRoom(roomId: number) {
  //   const doc = new WSSharedDoc(docName);
  //   const roomManager = new ServerSideRoomManager(doc);
  //   this.roomManagers.set(docName, roomManager);
  //   return roomManager;
  // }

  activeRoomMembers(roomHashId: string) {
    const docName = getYjsDocNameForRoom(roomHashId);
    const manager = this.roomManagers.get(docName);
    if (!manager) {
      return [];
    }

    return manager.activeRoomMembers();
  }

  async setupWsConnection(conn: WebSocket, req: IncomingMessage) {
    const url = req.url as string;
    const roomHashId = path.basename(url.slice(1).split('?')[0]);
    // conn.addEventListener('close', () => {
    //   if (manager) {
    //     const ids = manager.ydoc.conns.get(conn);
    //     if (!ids || ids.size === 0) {
    //       // persist some doc data if
    //     }
    //   }
    // });
    const docName = getYjsDocNameForRoom(roomHashId);
    setupWSConnection(conn, req, { gc: true, docName: docName });

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

    // setupWSConnection will create the doc for us
    const doc = docs.get(docName) as WSSharedDoc;

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

    const isNewRoom = !this.roomManagers.has(docName);
    if (isNewRoom) {
      console.log('new room, popoulating');
      const room = await roomPromise;
      const clientSideRoom = this.clientSideRoomService.getClientSideRoom(room);
      if (!clientSideRoom) {
        throw "couldn't find clintsideroom";
      }
      const manager = new ServerSideRoomManager(doc, roomId, clientSideRoom.hashId, this.roomRepository);
      this.roomManagers.set(docName, manager);
      manager.roomDestroyed$$.subscribe(() => {
        this.roomManagers.delete(docName);
      });

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
        if (room.savedFileContentsAndDetails) {
          manager.loadSavedDocumentContentsIntoYjs();
        } else {
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
  }

  getDocForRoom(roomHashId: string) {
    return this.roomManagers.get(getYjsDocNameForRoom(roomHashId));
  }
}

export class ServerSideRoomManager extends RoomManager {
  constructor(
    public ydoc: WSSharedDoc,
    private roomId: number,
    roomHashId: string,
    private roomRepository: Repository<Room>,
  ) {
    super(roomHashId, ydoc);

    const awareness$ = new Observable<globalAwarenessMap>((observer) => {
      const listener = () => {
        console.log('listener fired');
        // console.log(ydoc.awareness.getStates());
        observer.next(ydoc.awareness.getStates() as globalAwarenessMap);
      };
      ydoc.awareness.on('change', listener);
      this.roomDestroyed$$.subscribe(() => {
        this.ydoc.awareness.off('change', listener);
        observer.complete();
      });
      return () => ydoc.awareness.off('change', listener);
    });

    const userId$ = awareness$.pipe(map((awareness) => [...awareness.keys()]));

    const userIdDelta$ = awareness$.pipe(
      map(
        (awareness) =>
          new Set(
            [...awareness.values()].map((client) => client.roomMemberDetails?.userIdOrAnonID).filter(Boolean),
          ) as Set<string>,
      ),
      tap((ids) => console.log({ ids })),
      scan<Set<string>, { deltas: { userID: string; deltaValue: boolean }[]; prevIDs: Set<string> }>(
        ({ prevIDs }, currIDs) => {
          const deltas: { userID: string; deltaValue: boolean }[] = [];
          for (let userID of [...new Set([...currIDs, ...prevIDs])]) {
            if (!prevIDs.has(userID) && currIDs.has(userID)) {
              deltas.push({ userID, deltaValue: true });
            }

            if (prevIDs.has(userID) && !currIDs.has(userID)) {
              deltas.push({ userID, deltaValue: false });
            }
          }
          console.log({ deltas });
          return { deltas, prevIDs: currIDs };
        },
        { deltas: [], prevIDs: new Set<string>() },
      ),
      concatMap(({ deltas }) => fromArray(deltas)),
    );

    userIdDelta$
      .pipe(
        filter(({ deltaValue }) => !deltaValue),
        withLatestFrom(userId$),
        tap(([, userIds]) => console.log({ userIds })),
        filter(([, userIds]) => userIds.length === 0),
      )
      .subscribe(async () => {
        const fileContents = this.getAllFileContents();
        const fileDetails = this.getFileDetails();

        const combinedFilesState: combinedFilesState = { fileContents, fileDetails };

        // after 1000 seconds
        const shouldSuspendRoom = await race(
          userIdDelta$.pipe(
            filter(({ deltaValue }) => deltaValue),
            first(),
            mapTo(false),
          ),
          of(true).pipe(delay(1000)),
        ).toPromise();

        if (shouldSuspendRoom) {
          this.roomRepository
            .createQueryBuilder('room')
            .update(Room)
            .set({ savedFileContentsAndDetails: JSON.stringify(combinedFilesState) })
            .where('id = :id', { id: this.roomId })
            .execute();

          this.destroy();
        }
      });
  }

  async loadSavedDocumentContentsIntoYjs() {
    const combinedContents = await this.getSavedCombinedFileContents();
    if (!combinedContents) {
      return;
    }
    this.ydoc.transact(() => {
      Object.entries(combinedContents.fileDetails).forEach(([tabId, details]) => {
        this.yData.fileDetails.set(tabId, details);
      });

      Object.entries(combinedContents.fileContents).forEach(([tabId, contents]) => {
        this.yData.fileContents.set(tabId, new Y.Text(contents));
      });
    });
  }

  async getSavedCombinedFileContents() {
    const room = await this.roomRepository.findOneOrFail(this.roomId);

    if (!room.savedFileContentsAndDetails) {
      return;
    }

    return JSON.parse(room.savedFileContentsAndDetails) as combinedFilesState;
  }

  activeRoomMembers() {
    return ([...this.ydoc.awareness.getStates().values()] as clientAwareness[])
      .map((memberAwareness) => memberAwareness.roomMemberDetails)
      .filter(Boolean) as roomMemberWithComputed[];
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

import { Service } from 'typedi';
import { WebsocketProvider } from 'y-websocket';
import { PersistenceDoc, RedisPersistence } from 'y-redis';
import { Doc } from 'yjs';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM } from 'Shared/environment';
import Websocket from 'ws';

@Service()
export class YdocService {
  provider: WebsocketProvider;
  constructor(public doc: Doc) {}
}

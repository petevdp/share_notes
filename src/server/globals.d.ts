declare module 'module-alias/register';
declare module 'y-websocket/bin/utils' {
  import Y from 'yjs';
  import { Awareness } from 'y-protocols/awareness';
  import WebSocket, { Websocket } from 'ws';
  export class WSSharedDoc extends Y.Doc {
    constructor(name: string): void;
    name: string;
    awareness: Awareness;
    conns: Map<WebSocket, Set<number>>;
  }

  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    options: { docName: string; gc: boolean },
  ): void;

  export const docs: Map<string, WSSharedDoc>;
}
declare module 'language-detect';

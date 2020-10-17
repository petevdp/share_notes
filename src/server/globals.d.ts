declare module 'module-alias/register';
declare module 'y-websocket/bin/utils' {
  import Y from 'yjs';
  import { Awareness } from 'y-protocols/awareness';
  export class WSSharedDoc extends Y.Doc {
    constructor(name: string): void;
    name: string;
    awareness: Awareness;
  }

  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    options: { docName: string; gc: boolean },
  ): void;

  export const docs: Map<string, WSSharedDoc>;
}
declare module 'language-detect';

import Y from 'yjs';

export function getKeysForMap(map: Y.Map<unknown>) {
  const keyIterator = map.keys();
  const keys = [];
  let curr = keyIterator.next();
  while (!curr.done) {
    keys.push(curr.value);
    curr = keyIterator.next();
  }
  return keys;
}

export function getEntriesForMap<T>(map: Y.Map<T>) {
  const entryIterator = map.entries();
  const entries: [string, T][] = [];
  let curr = entryIterator.next();
  while (!curr.done) {
    entries.push(curr.value);
    curr = entryIterator.next();
  }
  return entries;
}

interface awarenessChangeIndexes {
  added: number[];
  updated: number[];
  removed: number[];
}

export type awarenessListener = (chnageIndexes: awarenessChangeIndexes, transactionOrigin: any) => void;

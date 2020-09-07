import { createIterator } from 'lib0/iterator';
import Y from 'yjs';
import { current } from '@reduxjs/toolkit';

export function iteratorOfArray<T>(arr: T[]) {
  let currIndex = 0;
  return createIterator<T>(() => {
    let elt = arr[currIndex];
    currIndex += 1;
    return {
      value: elt,
      done: currIndex === arr.length,
    };
  });
}

export function getKeysForMap(map: Y.Map<unknown>) {
  const keyIterator = map.keys();
  let keys = [];
  let curr = keyIterator.next();
  while (!curr.done) {
    console.log('pushing key');
    keys.push(curr.value);
    curr = keyIterator.next();
  }
  return keys;
}

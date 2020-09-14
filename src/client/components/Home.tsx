import React, { useEffect, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from 'Client/store';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import { createRoom } from 'Client/room/types';

export function Home() {
  const history = useHistory();
  const [roomName, setRoomName] = useState('');
  const [gistName, setGistName] = useState('');
  const roomSlice = useSelector((s: rootState) => s.room);
  const ownedRooms = useSelector((s: rootState) => s.session.user?.ownedRooms);
  const dispatch = useDispatch();

  useEffect(() => {
    if (roomSlice.isCurrentUserCreatingRoom && roomSlice.room?.hashId) {
      console.log('room');
      history.push(`/rooms/${roomSlice.room.hashId}`);
    }
  }, [roomSlice.isCurrentUserCreatingRoom, roomSlice.room?.hashId]);

  const roomElements =
    ownedRooms &&
    ownedRooms.map((r) => (
      <div key={r.id}>
        <Link to={`/rooms/${r.hashId}`}>
          id: {r.id} name: {r.name} hash: {r.hashId}
        </Link>
      </div>
    ));

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const roomInput: CreateRoomInput = {
            name: roomName,
            gistName: gistName,
            ownerId: 1,
          };
          dispatch(createRoom(roomInput));
        }}
      >
        <FormControl label={() => 'Room Name'}>
          <Input value={roomName} onChange={(e) => setRoomName(e.currentTarget.value)} />
        </FormControl>
        <FormControl label={() => 'Gist name'}>
          <Input value={gistName} onChange={(e) => setGistName(e.currentTarget.value)} />
        </FormControl>
        <Button type="submit">Create</Button>
      </form>
      {ownedRooms && roomElements}
    </>
  );
}

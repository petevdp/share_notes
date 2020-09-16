import React, { useEffect, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from 'Client/store';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import { createRoom, switchToRoom } from 'Client/room/types';

export function Home() {
  const history = useHistory();
  const [roomName, setRoomName] = useState('');
  const [gistName, setGistName] = useState('');
  const { ownedRooms, isCurrentUserCreatingRoom, roomHashId } = useSelector((s: rootState) => ({
    ownedRooms: s.session.user?.ownedRooms,
    isCurrentUserCreatingRoom: s.room.isCurrentUserCreatingRoom,
    roomHashId: s.room.currentRoom?.roomDetails?.hashId,
  }));
  const dispatch = useDispatch();

  useEffect(() => {
    if (isCurrentUserCreatingRoom && roomHashId) {
      console.log('room');
      dispatch(switchToRoom(roomHashId));
      history.push(`/rooms/${roomHashId}`);
    }
  }, [isCurrentUserCreatingRoom, roomHashId]);

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

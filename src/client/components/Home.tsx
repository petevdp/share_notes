import React, { useEffect, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from 'Client/store';
import { UserInput } from 'Shared/inputs/userInputs';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import { USER_ROOMS, userRoomsResponse, CREATE_ROOM, createRoomResponse } from 'Client/queries';
import { useQuery, gql, useMutation } from '@apollo/client';

export function Home() {
  const history = useHistory();
  const [roomName, setRoomName] = useState('');
  const [gistName, setGistName] = useState('');
  const [createRoom, { error: createRoomError, error: createRoomLoading, data: createRoomData }] = useMutation<
    createRoomResponse
  >(CREATE_ROOM);

  useEffect(() => {
    if (createRoomData) {
      history.push(`/rooms/${createRoomData.createRoom.hashId}`);
    }
  }, [createRoomData]);

  const userInput: UserInput = { id: 1 };
  const { loading, error, data } = useQuery<userRoomsResponse>(USER_ROOMS, {
    variables: { data: userInput },
  });

  const roomElements =
    data &&
    data.user.ownedRooms.map((r) => (
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
            gistName: gistName || undefined,
            ownerId: 1,
          };
          createRoom({ variables: { data: roomInput } });
        }}
      >
        <FormControl label={() => 'Room Name'}>
          <Input value={roomName} onChange={(e) => setRoomName(e.currentTarget.value)} />
        </FormControl>
        <FormControl label={() => 'Gist name'}>
          <Input value={roomName} onChange={(e) => setRoomName(e.currentTarget.value)} />
        </FormControl>
        <Button type="submit">Create</Button>
      </form>
      {loading && 'loading'}
      {error && 'error'}
      {data && roomElements}
    </>
  );
}

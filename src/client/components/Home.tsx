import React, { useEffect, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from 'Client/store';
import { Editor } from 'Client/components/NewEditor';
import { UserInput } from 'Shared/inputs/userInputs';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import { useQuery, gql, useMutation } from '@apollo/client';

interface userRoomsOutput {
  user: {
    ownedRooms: { id: number; name: string; hashId: string }[];
  };
}

const USER_ROOMS = gql`
  query GetUserOwnedRooms($data: UserInput!) {
    user(data: $data) {
      ownedRooms {
        id
        name
        hashId
      }
    }
  }
`;
interface createRoomOutput {
  createRoom: {
    hashId: string;
  };
}

const CREATE_ROOM = gql`
  mutation CreateRoom($data: CreateRoomInput!) {
    createRoom(data: $data) {
      hashId
    }
  }
`;

export function Home() {
  const history = useHistory();
  const [roomName, setRoomName] = useState('');
  const [createRoom, { error: createRoomError, error: createRoomLoading, data: createRoomData }] = useMutation<
    createRoomOutput
  >(CREATE_ROOM);

  useEffect(() => {
    if (createRoomData) {
      history.push(`/rooms/${createRoomData.createRoom.hashId}`);
    }
  }, [createRoomData]);

  const userInput: UserInput = { id: 1 };
  const { loading, error, data } = useQuery<userRoomsOutput>(USER_ROOMS, {
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
            ownerId: 1,
          };
          createRoom({ variables: { data: roomInput } });
        }}
      >
        <FormControl label={() => 'Room Name'}>
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

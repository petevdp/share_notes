import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from 'Client/store';
import { Editor } from 'Client/components/NewEditor';
import { UserInput } from 'Shared/inputs/userInputs';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import { useQuery, gql, useMutation } from '@apollo/client';
import * as UrlSafeBase64 from 'url-safe-base64';

interface userRoomsOutput {
  user: {
    ownedRooms: { id: number; name: string }[];
  };
}

const USER_ROOMS = gql`
  query GetUserOwnedRooms($data: UserInput!) {
    user(data: $data) {
      ownedRooms {
        id
        name
      }
    }
  }
`;
interface createRoomOutput {
  room: {
    uuid: string;
  };
}

const CREATE_ROOM = gql`
  mutation createRoom($data: CreateRoomInput!) {
    uuid
  }
`;

export function Home() {
  const history = useHistory();
  const [roomName] = useState('');
  const [createRoom, { error: createRoomError, error: createRoomLoading, data: createRoomData }] = useMutation<
    createRoomOutput
  >(CREATE_ROOM);

  useEffect(() => {
    if (createRoomData) {
      const base64uuid = UrlSafeBase64.encode(createRoomData.room.uuid);
      history.push('/rooms/' + base64uuid);
    }
  }, [createRoomData]);

  const userInput: UserInput = { id: 1 };
  const { loading, error, data } = useQuery<userRoomsOutput>(USER_ROOMS, {
    variables: { data: userInput },
  });

  const roomElements =
    data &&
    data.user.ownedRooms.map((r) => (
      <span key={r.id}>
        id: {r.id} name: {r.name}
      </span>
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
          <Input />
        </FormControl>
        <Button type="submit">Create</Button>
      </form>
      {loading && 'loading'}
      {error && 'error'}
      {data && roomElements}
      <div>
        <Editor />
      </div>
    </>
  );
}

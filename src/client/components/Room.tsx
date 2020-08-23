import { useParams } from 'react-router-dom';
import React, { useEffect } from 'react';
import * as UrlSafeBase64 from 'url-safe-base64';

import { RoomInput } from 'Shared/inputs/roomInputs';
import { useQuery, gql } from '@apollo/client';
import { Editor } from './NewEditor';

interface getRoomResult {
  room: {
    name: string;
  };
}

const queries = {
  getRoom: gql`
    query GetRoom($data: RoomInput!) {
      room(data: $data) {
        id
        name
      }
    }
  `,
};

export const Room: React.FC = () => {
  const { roomHashId } = useParams();
  const { loading, error, data } = useQuery<getRoomResult>(queries.getRoom, {
    variables: { data: { hashId: roomHashId } },
  });

  return (
    <span>
      {loading && 'loading'}
      {error && 'error'}
      {data && data.room.name}
      <Editor hashId={roomHashId}></Editor>
    </span>
  );
};

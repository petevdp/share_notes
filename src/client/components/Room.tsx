import { useParams } from 'react-router-dom';
import React, { useEffect } from 'react';
import * as UrlSafeBase64 from 'url-safe-base64';

import { RoomInput } from 'Shared/inputs/roomInputs';
import { useQuery, gql } from '@apollo/client';

interface getRoomResult {
  room: {
    name: string;
  };
}

const queries = {
  getRoom: gql`
    query room($data: RoomInput!) {
      name
    }
  `,
};

export const Room: React.FC = () => {
  const { base64RoomUuid } = useParams();
  const roomUuid = UrlSafeBase64.decode(base64RoomUuid);
  const { loading, error, data } = useQuery<getRoomResult>(queries.getRoom, {
    variables: { data: { uuid: roomUuid } },
  });

  return (
    <span>
      {loading && 'loading'}
      {error && 'error'}
      {data && data.room.name}
    </span>
  );
};

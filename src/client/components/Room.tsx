import { useParams } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Editor } from './Editor';
import { GET_ROOM, getRoomResponse } from 'Client/queries';

const queries = {};

export const Room: React.FC = () => {
  const { roomHashId } = useParams();
  const { loading, error, data } = useQuery<getRoomResponse>(GET_ROOM, {
    variables: { data: { hashId: roomHashId } },
    context: {
      api: 'github',
    },
  });

  return (
    <span>
      {loading && 'loading'}
      {error && 'error'}
      {data && data.room.name}
      <Editor hashId={roomHashId} getRoomResponse={data}></Editor>
    </span>
  );
};

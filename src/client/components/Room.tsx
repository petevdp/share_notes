import { useParams } from 'react-router-dom';

import React, { useEffect } from 'react';

export const Room: React.FC = () => {
  const { roomId } = useParams();
  useEffect(() => {
    if (!roomId) {
      throw 'idk';
    }
  }, [roomId]);

  return <span>"roomId: " + roomId;</span>;
};

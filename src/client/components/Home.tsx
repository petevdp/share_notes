import React, { useEffect, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from 'Client/store';
import { Card } from 'baseui/card';
import { ListItem, ListItemLabel } from 'baseui/list';

export function Home() {
  const { ownedRooms, isCurrentUserCreatingRoom, roomHashId } = useSelector((s: rootState) => ({
    ownedRooms: s.session.user?.ownedRooms,
    isCurrentUserCreatingRoom: s.room.isCurrentUserCreatingRoom,
    roomHashId: s.room.currentRoom?.roomDetails?.hashId,
  }));

  const roomElements =
    ownedRooms &&
    ownedRooms.map((r) => (
      <div key={r.id}>
        <Link to={`/rooms/${r.hashId}`}>
          <ListItem>
            <ListItemLabel>{r.name}</ListItemLabel>
          </ListItem>
        </Link>
      </div>
    ));

  return (
    <>
      <Card title="Owned Rooms">
        <ul>{ownedRooms && roomElements?.reverse()}</ul>
      </Card>
    </>
  );
}

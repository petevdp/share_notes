import React, { useEffect, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from 'Client/store';
import { Card } from 'baseui/card';
import { ListItem, ListItemLabel, MenuAdapter } from 'baseui/list';
import { Menu, StatefulMenu } from 'baseui/menu';
import { ChevronRight } from 'baseui/icon';
import { withStyle } from 'baseui';
import { StyledNavItem, StyledNavLink } from 'baseui/side-navigation';

const RoomListItem = withStyle(StyledNavItem, ({ $theme }) => ({
  paddingTop: $theme.sizing.scale200,
  paddingBottom: $theme.sizing.scale200,
}));

export function Home() {
  const { ownedRooms, isCurrentUserCreatingRoom, roomHashId } = useSelector((s: rootState) => ({
    ownedRooms: s.session.user?.ownedRooms,
    isCurrentUserCreatingRoom: s.room.isCurrentUserCreatingRoom,
    roomHashId: s.room.currentRoom?.roomDetails?.hashId,
  }));

  // if (!ownedRooms) {
  //   throw 'not logged in';
  // }

  const roomElements =
    ownedRooms &&
    ownedRooms.slice(0, 10).map((r) => (
      <RoomListItem key={r.id}>
        <Link to={`/rooms/${r.hashId}`}>{r.name}</Link>
      </RoomListItem>
    ));

  return (
    <>
      <Card title="Owned Rooms">
        <ul>{roomElements}</ul>
      </Card>
    </>
  );
}

import { withStyle } from 'baseui';
import { Button } from 'baseui/button';
import { Card } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { ChevronRight } from 'baseui/icon';
import { Input } from 'baseui/input';
import { StyledLink } from 'baseui/link';
import { ListItem, ListItemLabel, MenuAdapter } from 'baseui/list';
import { Menu, StatefulMenu } from 'baseui/menu';
import { StyledNavItem, StyledNavLink } from 'baseui/side-navigation';
import { rootState } from 'Client/store';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';

const RoomListItem = withStyle(StyledNavItem, ({ $theme }) => ({
  paddingTop: $theme.sizing.scale200,
  paddingBottom: $theme.sizing.scale200,
}));

export function Home() {
  const { ownedRooms } = useSelector((s: rootState) => ({
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
        <StyledLink $as={Link} to={`/rooms/${r.hashId}`}>
          {r.name}
        </StyledLink>
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

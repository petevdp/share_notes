import { withStyle } from 'baseui';
import { Card } from 'baseui/card';
import { StyledLink } from 'baseui/link';
import { StyledNavItem } from 'baseui/side-navigation';
import { rootState } from 'Client/store';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

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

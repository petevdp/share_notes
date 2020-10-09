import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card } from 'baseui/card';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Delete } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { ListItem } from 'baseui/list';
import { recentRoomsActions } from 'Client/recentRooms/types';
import { deleteRoom } from 'Client/room/types';
import { rootState } from 'Client/store';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export function Home() {
  const [css] = useStyletron();
  const dispatch = useDispatch();
  const ownedRooms = useSelector((s: rootState) => s.session.user?.ownedRooms);
  const recentRooms = useSelector((s: rootState) => s.recentRooms);
  const currentUserId = useSelector((s: rootState) => s.session.user?.id);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    dispatch(recentRoomsActions.fetchRecentRooms(currentUserId, 5));
  }, [currentUserId]);

  const recentRoomElements =
    recentRooms &&
    recentRooms.map((r) => (
      <ListItem
        endEnhancer={() => (
          <Button onClick={() => dispatch(deleteRoom(r.id.toString()))} size="compact" kind="secondary" shape="round">
            <Delete />
          </Button>
        )}
        key={r.id}
      >
        <StyledLink $as={Link} to={`/rooms/${r.hashId}`}>
          {r.name}
        </StyledLink>
      </ListItem>
    ));

  const roomElements =
    ownedRooms &&
    ownedRooms
      .filter((room) => !recentRooms.map((r) => r.id).includes(room.id))
      .map((r) => (
        <ListItem
          endEnhancer={() => (
            <Button onClick={() => dispatch(deleteRoom(r.id.toString()))} size="compact" kind="secondary" shape="round">
              <Delete />
            </Button>
          )}
          key={r.id}
        >
          <StyledLink $as={Link} to={`/rooms/${r.hashId}`}>
            {r.name}
          </StyledLink>
        </ListItem>
      ));

  return (
    <div
      className={css({
        width: 'min(100%, 700px)',
        marginTop: '0px',
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <HeadingLevel>
        <Heading>Your Rooms</Heading>
        <div
          className={css({
            display: 'grid',
            gridGap: '8px',
          })}
        >
          <Card title="Recent">
            <ul>{recentRoomElements}</ul>
          </Card>
          <Card title="Your Rooms">
            <ul>{roomElements}</ul>
          </Card>
        </div>
      </HeadingLevel>
    </div>
  );
}

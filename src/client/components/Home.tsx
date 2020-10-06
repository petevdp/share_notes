import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card } from 'baseui/card';
import { Delete } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { ListItem } from 'baseui/list';
import { rootState } from 'Client/store';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export function Home() {
  const [css] = useStyletron();
  const { ownedRooms } = useSelector((s: rootState) => ({
    ownedRooms: s.session.user?.ownedRooms,
    roomHashId: s.room.currentRoom?.roomDetails?.hashId,
  }));

  const roomElements =
    ownedRooms &&
    ownedRooms.map((r) => (
      <ListItem
        endEnhancer={() => (
          <Button size="compact" kind="secondary" shape="round">
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
        margin: 'auto',
      })}
    >
      <Card title="Owned Rooms">
        <ul>{roomElements}</ul>
      </Card>
    </div>
  );
}

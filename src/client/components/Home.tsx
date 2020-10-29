import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card } from 'baseui/card';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Delete } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { ListItem } from 'baseui/list';
import { ownedRoomsActions } from 'Client/slices/ownedRooms/types';
import { deleteRoom } from 'Client/slices/room/types';
import { rootState } from 'Client/store';
import { roomWithVisited } from 'Client/utils/queries';
import { formatRoomVisitedTime } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import { last } from 'lodash';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { clientSideRoom } from 'Shared/types/roomTypes';
import { roomVisit } from 'Shared/types/roomVisitTypes';

export function Home() {
  const [css] = useStyletron();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: rootState) => state.currentUserDetails);
  const ownedRooms = useSelector((state: rootState) => state.ownedRooms?.allRooms);

  // const [recentRooms, setRecentRooms] = useState<clientSideRoom[] | null>(null);
  // useEffect(() => {
  //   gqlRequest()
  // }, []);

  useEffect(() => {
    if (!currentUser.userDetails?.id) {
      return;
    }
    dispatch(ownedRoomsActions.fetchOwnedRooms());
  }, [currentUser.userDetails?.id]);

  const ownedRoomElements = ownedRooms && ownedRooms.map((r) => <RoomListElement key={r.id} room={r} />);

  return (
    <div
      className={css({
        width: 'min(100%, 700px)',
        marginTop: '0px',
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <div
        className={css({
          display: 'grid',
          gridGap: '8px',
        })}
      >
        <Card title="Your Rooms">
          <ul>{ownedRoomElements}</ul>
        </Card>
      </div>
    </div>
  );
}

function RoomListElement({ room }: { room: roomWithVisited }) {
  const dispatch = useDispatch();
  const lastVisit = room.visits[0];
  const [css] = useStyletron();
  return (
    <ListItem
      overrides={
        {
          // Content: {
          //   style: {
          //     display: 'flex',
          //     justifyContent: 'space-between',
          //   },
          // },
        }
      }
      endEnhancer={() => (
        <>
          <span className={css({ marginRight: '10px', fontSize: '15px', fontWeight: 'lighter' })}>
            last visted: {lastVisit && formatRoomVisitedTime(lastVisit.visitTime)}{' '}
          </span>
          <Button
            onClick={() => dispatch(deleteRoom(room.id.toString()))}
            size="compact"
            kind="secondary"
            shape="round"
          >
            <Delete />
          </Button>
        </>
      )}
    >
      <StyledLink $as={Link} to={`/rooms/${room.hashId}`}>
        {room.name}
      </StyledLink>
    </ListItem>
  );
}

import { useStyletron } from 'baseui';
import { Button, StyledBaseButton } from 'baseui/button';
import { Card } from 'baseui/card';
import { Delete } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { ListItem } from 'baseui/list';
import { Paragraph1 } from 'baseui/typography';
import { ownedRoomsActions } from 'Client/slices/ownedRooms/types';
import { deleteRoom } from 'Client/slices/room/types';
import { rootState } from 'Client/store';
import { RouterLinkButton, StyledRouterLink } from 'Client/utils/basewebUtils';
import { roomWithVisited } from 'Client/utils/queries';
import { formatRoomVisitedTime } from 'Client/utils/utils';
import React, { ReactNode, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export function Home() {
  const [css] = useStyletron();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: rootState) => state.currentUserDetails);
  const ownedRooms = useSelector((state: rootState) => state.ownedRooms?.allRooms);

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
        marginTop: '20px',
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
        <span className={css({ margin: 'auto' })}>
          <RouterLinkButton to="/rooms/new" buttonProps={{ kind: 'secondary' }}>
            Create New Room
          </RouterLinkButton>
        </span>
        {ownedRoomElements && ownedRoomElements.length > 0 ? (
          <Card title="Your Rooms">
            <ul>{ownedRoomElements}</ul>
          </Card>
        ) : (
          <Paragraph1 className={css({ textAlign: 'center' })} as="p">
            {"You don't currently have any rooms."}
            <br />
            {"When you create rooms, they'll appear here."}
          </Paragraph1>
        )}
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
      <StyledRouterLink to={`/rooms/${room.hashId}`}>{room.name}</StyledRouterLink>
    </ListItem>
  );
}

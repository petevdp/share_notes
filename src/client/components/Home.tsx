import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card } from 'baseui/card';
import { Delete } from 'baseui/icon';
import { ListItem } from 'baseui/list';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'baseui/modal';
import { Paragraph1 } from 'baseui/typography';
import { ownedRoomsActions } from 'Client/slices/ownedRooms/types';
import { deleteRoom } from 'Client/slices/room/types';
import { rootState } from 'Client/store';
import { RouterLinkButton, StyledRouterLink } from 'Client/utils/basewebUtils';
import { roomWithVisited } from 'Client/utils/queries';
import { formatRoomVisitedTime } from 'Client/utils/utils';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [css] = useStyletron();
  return (
    <ListItem
      endEnhancer={() => (
        <>
          <span className={css({ marginRight: '10px', fontSize: '15px', fontWeight: 'lighter' })}>
            last visted: {lastVisit && formatRoomVisitedTime(lastVisit.visitTime)}{' '}
          </span>
          <Button onClick={() => setIsDeleteModalOpen(true)} size="compact" kind="secondary" shape="round">
            <Delete />
          </Button>
          <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
            <ModalHeader>Delete room {room.name}</ModalHeader>
            <ModalBody>Are you sure you want to delete room {room.name}?</ModalBody>
            <ModalFooter>
              <Button
                overrides={{ BaseButton: { style: { width: '100%' } } }}
                onClick={() => dispatch(deleteRoom(room.hashId))}
              >
                Confirm
              </Button>
            </ModalFooter>
          </Modal>
        </>
      )}
    >
      <StyledRouterLink to={`/rooms/${room.hashId}`}>
        <span>{room.name}</span>
      </StyledRouterLink>
    </ListItem>
  );
}

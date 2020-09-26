import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Modal, ModalBody, ModalHeader } from 'baseui/modal';
import { roomSliceStateWithErrorSelector } from 'Client/roomCreation/slice';
import { roomCreationActions } from 'Client/roomCreation/types';
import { rootState } from 'Client/store';
import React, { ReactElement, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';

export function CreateRoomModal(): ReactElement {
  const dispatch = useDispatch();
  const history = useHistory();
  const { isCurrentUserCreatingRoom, roomHashId, currentUser } = useSelector((s: rootState) => ({
    isCurrentUserCreatingRoom: s.room.isCurrentUserCreatingRoom,
    currentUser: s.session.user,
    roomHashId: s.room.currentRoom?.roomDetails?.hashId,
  }));
  const roomCreation = useSelector(roomSliceStateWithErrorSelector);

  if (!currentUser) {
    throw 'current user not set';
  }

  useEffect(() => {
    if (isCurrentUserCreatingRoom && roomHashId) {
      history.push(`/rooms/${roomHashId}`);
    }
  }, [isCurrentUserCreatingRoom, roomHashId]);

  return (
    <Modal
      unstable_ModalBackdropScroll={true}
      isOpen={roomCreation.isOpen}
      onClose={() => dispatch(roomCreationActions.close(currentUser.githubLogin))}
      overrides={{
        Root: {
          style: {
            zIndex: 5,
          },
        },
      }}
    >
      <ModalHeader>New Room</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const url = new URL(roomCreation.gistUrl);
            const gistName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
            const roomInput: CreateRoomInput = {
              name: roomCreation.roomName,
              gistName,
              ownerId: currentUser.id,
            };
            dispatch(roomCreationActions.createRoom(roomInput, currentUser.githubLogin));
          }}
        >
          <FormControl label={() => 'Room Name'}>
            <Input
              value={roomCreation.roomName}
              onChange={(e) => dispatch(roomCreationActions.setRoomName(e.currentTarget.value))}
            />
          </FormControl>
          <FormControl error={roomCreation.gistUrlError} label={'Gist Url'}>
            <Input
              value={roomCreation.gistUrl}
              error={!!roomCreation.gistUrlError}
              onChange={(e) => dispatch(roomCreationActions.setGistUrl(e.currentTarget.value))}
            />
          </FormControl>
          <Button type="submit" disabled={!!roomCreation.gistUrlError}>
            Create
          </Button>
        </form>
      </ModalBody>
    </Modal>
  );
}

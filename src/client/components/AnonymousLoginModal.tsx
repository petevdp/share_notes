import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Modal, ModalBody, ModalHeader } from 'baseui/modal';
import { isLoggedInForRoomSelector } from 'Client/slices/room/types';
import { anonymousLoginActions } from 'Client/slices/session/types';
import { rootState } from 'Client/store';
import { RoomModalZIndexOverride } from 'Client/utils/basewebUtils';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

export function AnonymousLoginModal() {
  const formData = useSelector((state: rootState) => state.session.anonymousLoginForm);
  const isLoggedIn = useSelector(isLoggedInForRoomSelector);
  const currentRoomSet = useSelector((state: rootState) => !!state.room.currentRoom);
  const tokenPresenceChecked = useSelector((s: rootState) => s.session.tokenPresenceChecked);
  const dispatch = useDispatch();
  const error = null;

  useEffect(() => {
    if (!isLoggedIn && tokenPresenceChecked && currentRoomSet) {
      dispatch(anonymousLoginActions.startAnonymousLogin());
    }
  }, [tokenPresenceChecked, isLoggedIn, currentRoomSet]);

  return (
    <Modal
      overrides={RoomModalZIndexOverride}
      isOpen={!!formData}
      onClose={() => dispatch(anonymousLoginActions.cancel())}
      unstable_ModalBackdropScroll={true}
    >
      <ModalHeader>Start Editing Anonymously</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!error && formData) {
              dispatch(anonymousLoginActions.logInAnonymously(formData.username, uuidv4()));
            }
          }}
        >
          <FormControl error={error} label="Nickname">
            <Input
              error={!!error}
              inputMode="inputmode"
              clearable
              value={formData?.username || ''}
              onChange={(e) => dispatch(anonymousLoginActions.setUsername(e.currentTarget.value))}
            />
          </FormControl>
          <Button type="submit" disabled={!!error}>
            Join Room
          </Button>
        </form>
      </ModalBody>
    </Modal>
  );
}

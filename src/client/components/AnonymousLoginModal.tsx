import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'baseui/modal';
import { isLoggedInForRoomSelector } from 'Client/slices/room/types';
import { loginWithGithub } from 'Client/slices/session/epics';
import { isLoggedInWithGithubSelector } from 'Client/slices/session/slice';
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
    console.log(isLoggedIn, tokenPresenceChecked, currentRoomSet);
    if (!isLoggedIn && tokenPresenceChecked && currentRoomSet) {
      dispatch(anonymousLoginActions.startAnonymousLogin());
    }
  }, [tokenPresenceChecked, isLoggedIn, currentRoomSet]);
  const [css] = useStyletron();

  return (
    <Modal
      overrides={RoomModalZIndexOverride}
      isOpen={!!formData}
      onClose={() => dispatch(anonymousLoginActions.cancel())}
      unstable_ModalBackdropScroll={true}
      closeable={false}
    >
      <ModalHeader>Start Editing Anonymously:</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!error && formData) {
              dispatch(anonymousLoginActions.logInAnonymously(formData.username, uuidv4()));
            }
          }}
        >
          <FormControl error={error} label="Nickname:">
            <span className={css({ display: 'flex', height: '45px' })}>
              <Input
                error={!!error}
                inputMode="inputmode"
                clearable
                value={formData?.username || ''}
                onChange={(e) => dispatch(anonymousLoginActions.setUsername(e.currentTarget.value))}
                overrides={{ Root: { style: { marginRight: '5px' } } }}
              />
              <Button type="submit" disabled={!!error} overrides={{ BaseButton: { style: { width: '90px' } } }}>
                Join
              </Button>
            </span>
          </FormControl>
          {/* <span className={css({ display: 'flex', justifyContent: 'space-between' })}>
            <Button overrides={{ BaseButton: { style: { width: '80px', height: '45px' } } }} type="button">
              Log In
            </Button>
          </span> */}
        </form>
      </ModalBody>
      <ModalHeader>Or Log In with Github:</ModalHeader>
      <ModalBody>
        <Button onClick={() => loginWithGithub()}>Log In</Button>
      </ModalBody>
    </Modal>
  );
}

import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card, StyledAction, StyledBody } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'baseui/modal';
import { fetchCurrentUsersGists } from 'Client/slices/roomCreation/epics';
import {
  GistUpdateType,
  ROOM_UPDATE_ACTION_NAMESPACE,
  roomUpdatingSliceStateWithComputedSelector,
} from 'Client/slices/roomUpdating/types';
import { roomUpdateActions } from 'Client/slices/roomUpdating/types';
import { DEBUG_FLAGS } from 'Client/utils/debugFlags';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { GistCard } from './GistCard';
import { GistCreationFields } from './GistCreationFields';
import { GistImportFields } from './GistImportFIelds';

const { close, setRoomName, setGistUpdateType, setOwnedGists } = roomUpdateActions;
export function EditRoomModal() {
  const state = useSelector(roomUpdatingSliceStateWithComputedSelector);
  const dispatch = useDispatch();
  // useFetchImportableGistDetails(roomCreation.gistImportFields, (data) =>
  //   dispatch(setGistDetails(data)),
  // );
  const isOpen = !!state;
  useEffect(() => {
    if (isOpen) {
      fetchCurrentUsersGists().then((gistDetails) => dispatch(setOwnedGists(gistDetails)));
    }
  }, [isOpen]);
  useEffect(() => {
    return () => {
      dispatch(close());
    };
  }, []);
  const [css] = useStyletron();

  if (!state) {
    return null;
  }
  const { startingDetails } = state;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  return (
    <Modal unstable_ModalBackdropScroll={true} isOpen={isOpen} onClose={() => dispatch(roomUpdateActions.close())}>
      <ModalHeader>Edit Room</ModalHeader>
      <form onSubmit={onSubmit}>
        <ModalBody>
          <FormControl label={'Room Name'}>
            <Input value={state.roomName} onChange={(e) => dispatch(setRoomName(e.currentTarget.value))}></Input>
          </FormControl>
          {state.gistUpdateType === GistUpdateType.None && !startingDetails.gistDetails && (
            <Card>
              <StyledBody>No Gist Linked</StyledBody>
              <StyledAction>
                <Button kind="secondary" onClick={() => dispatch(setGistUpdateType(GistUpdateType.Import))}>
                  Import Existing Gist
                </Button>
                <span> or </span>
                <Button kind="secondary" onClick={() => dispatch(setGistUpdateType(GistUpdateType.Create))}>
                  Create New Gist
                </Button>
              </StyledAction>
            </Card>
          )}
          {state.gistUpdateType === GistUpdateType.None && startingDetails.gistDetails && (
            <GistCard details={startingDetails.gistDetails} title={'Linked Gist:'} />
          )}
          {state.gistUpdateType === GistUpdateType.Create && (
            <Card
              title={
                <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                  <span>Create Gist</span>
                  <span>
                    <Button
                      size="mini"
                      kind="tertiary"
                      onClick={() => dispatch(setGistUpdateType(GistUpdateType.Import))}
                    >
                      Import New Gist Instead
                    </Button>
                    <Button
                      onClick={() => dispatch(setGistUpdateType(GistUpdateType.None))}
                      size="mini"
                      kind="tertiary"
                    >
                      Cancel
                    </Button>
                  </span>
                </div>
              }
            >
              <GistCreationFields actionNamespace={ROOM_UPDATE_ACTION_NAMESPACE} fields={state.gistCreationFields} />
            </Card>
          )}
          {state.gistUpdateType === GistUpdateType.Import && (
            <Card
              title={
                <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                  <span>Import Gist</span>
                  <span>
                    <Button
                      size="mini"
                      kind="tertiary"
                      onClick={() => dispatch(setGistUpdateType(GistUpdateType.Create))}
                    >
                      Create New Gist Instead
                    </Button>
                    <Button
                      onClick={() => dispatch(setGistUpdateType(GistUpdateType.None))}
                      size="mini"
                      kind="tertiary"
                    >
                      Cancel
                    </Button>
                  </span>
                </div>
              }
            >
              <GistImportFields
                actionNamespace={ROOM_UPDATE_ACTION_NAMESPACE}
                fields={state.gistImportFields}
                gistSelectionOptions={state.gistSelectionOptions}
              />
            </Card>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="submit">Save</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

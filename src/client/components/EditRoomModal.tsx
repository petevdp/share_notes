import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card, StyledAction, StyledBody } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'baseui/modal';
import { StyledSpinnerNext as Spinner } from 'baseui/spinner';
import { fetchCurrentUsersGists } from 'Client/slices/roomCreation/epics';
import {
  ROOM_UPDATE_ACTION_NAMESPACE,
  roomUpdatingSliceStateWithComputedSelector,
} from 'Client/slices/roomUpdating/types';
import { roomUpdateActions } from 'Client/slices/roomUpdating/types';
import { RoomModalZIndexOverride, SubmitButtonWithSpinner } from 'Client/utils/basewebUtils';
import { DEBUG_FLAGS } from 'Client/utils/debugFlags';
import React, { PropsWithChildren, ReactNode, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { gistUpdate, GistUpdateType } from 'Shared/types/roomTypes';

import { GistCard } from './GistCard';
import { GistCreationFields } from './GistCreationFields';
import { GistImportFields } from './GistImportFIelds';

const { close, setRoomName, setGistUpdateType, setOwnedGists, updateRoom } = roomUpdateActions;
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
  const [css, theme] = useStyletron();

  if (!state) {
    return null;
  }
  const { startingDetails } = state;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.canSubmit) {
      return;
    }

    const gistUpdate: gistUpdate = ((): gistUpdate => {
      const { Create, Import, Delete, None } = GistUpdateType;
      switch (state.gistUpdateType) {
        case Create:
          return {
            type: Create,
            name: state.gistCreationFields.name,
            description: state.gistCreationFields.description,
          };
        case Import:
          return {
            type: Import,
            gistId: state.gistImportFields.gistUrlId as string,
          };
        case Delete:
          return {
            type: Delete,
          };
        case None:
          return {
            type: None,
          };
      }
    })();

    dispatch(
      updateRoom(state.roomName, state.startingDetails.roomDetails.id.toString(), gistUpdate, state.startingDetails),
    );
  };
  return (
    <Modal
      overrides={RoomModalZIndexOverride}
      unstable_ModalBackdropScroll={true}
      isOpen={isOpen}
      onClose={() => dispatch(roomUpdateActions.close())}
    >
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
                <Button
                  type="button"
                  kind="secondary"
                  onClick={() => dispatch(setGistUpdateType(GistUpdateType.Import))}
                >
                  Import Existing Gist
                </Button>
                <span> or </span>
                <Button
                  type="button"
                  kind="secondary"
                  onClick={() => dispatch(setGistUpdateType(GistUpdateType.Create))}
                >
                  Create New Gist
                </Button>
              </StyledAction>
            </Card>
          )}
          {state.gistUpdateType === GistUpdateType.None && startingDetails.gistDetails && (
            <GistCard
              details={startingDetails.gistDetails}
              title={
                <GistEditCardTitle titleText="Current Gist">
                  <Button
                    type="button"
                    size="mini"
                    kind="tertiary"
                    onClick={() => dispatch(setGistUpdateType(GistUpdateType.Import))}
                  >
                    Import New Gist
                  </Button>
                  <Button
                    type="button"
                    onClick={() => dispatch(setGistUpdateType(GistUpdateType.Create))}
                    size="mini"
                    kind="tertiary"
                  >
                    Create New Gist
                  </Button>
                </GistEditCardTitle>
              }
            />
          )}
          {state.gistUpdateType === GistUpdateType.Create && (
            <Card
              title={
                <GistEditCardTitle titleText="Create Gist">
                  <Button
                    type="button"
                    size="mini"
                    kind="tertiary"
                    onClick={() => dispatch(setGistUpdateType(GistUpdateType.Import))}
                  >
                    Import New Gist Instead
                  </Button>
                  <Button
                    type="button"
                    onClick={() => dispatch(setGistUpdateType(GistUpdateType.None))}
                    size="mini"
                    kind="tertiary"
                  >
                    Cancel
                  </Button>
                </GistEditCardTitle>
              }
            >
              <GistCreationFields actionNamespace={ROOM_UPDATE_ACTION_NAMESPACE} fields={state.gistCreationFields} />
            </Card>
          )}
          {state.gistUpdateType === GistUpdateType.Import && (
            <Card
              title={
                <GistEditCardTitle titleText="Import Gist">
                  <Button
                    type="button"
                    size="mini"
                    kind="secondary"
                    onClick={() => dispatch(setGistUpdateType(GistUpdateType.Create))}
                  >
                    Create New Gist Instead
                  </Button>
                  <Button
                    type="button"
                    onClick={() => dispatch(setGistUpdateType(GistUpdateType.None))}
                    size="mini"
                    kind="tertiary"
                  >
                    Cancel
                  </Button>
                </GistEditCardTitle>
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
          <Button
            disabled={!state.canSubmit}
            isLoading={state.submitted}
            overrides={{ Root: { style: { width: '100%' } } }}
          >
            Save
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function GistEditCardTitle({ children, titleText }: React.Props<unknown> & { titleText: ReactNode }) {
  const [css] = useStyletron();
  return (
    <div className={css({ display: 'flex', justifyContent: 'space-between', fontSize: '20px' })}>
      <span className={css({ fontSize: '18px' })}>{titleText}</span>
      <span> {children} </span>
    </div>
  );
}

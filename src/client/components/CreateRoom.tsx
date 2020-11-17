import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card, StyledAction, StyledBody } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Input } from 'baseui/input';
import { StyledLink } from 'baseui/link';
import { FILL, Tab, Tabs } from 'baseui/tabs-motion';
import { StatefulTooltip } from 'baseui/tooltip';
import { currentUser } from 'Client/slices/currentUserDetails/types';
import { fetchCurrentUsersGists, useFetchImportableGistDetails } from 'Client/slices/roomCreation/epics';
import {
  computedRoomCreationSliceStateSelector,
  getComputedRoomCreationSliceState,
  ROOM_CREATION_ACTION_NAMESPACE,
  roomCreationActions,
  RoomCreationFormType,
} from 'Client/slices/roomCreation/types';
import { rootState } from 'Client/store';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { GistCreationFields } from './GistCreationFields';
import { GistImportFields } from './GistImportFIelds';

export function RoomCreation() {
  const roomHashId = useSelector((s: rootState) => s.room.currentRoom?.roomDetails?.hashId);
  const initializingRoom = useSelector((s: rootState) => s.room.currentRoom?.initializingRoom);
  const currentUserDetails = useSelector((s: rootState) => s.currentUserDetails.userDetails);

  const [css] = useStyletron();

  if (roomHashId && initializingRoom) {
    return <Redirect to={`/rooms/${roomHashId}`} />;
  }

  return (
    <div
      className={css({
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      })}
    >
      <HeadingLevel>
        <Heading>Create a New Room</Heading>
        <Card
          overrides={{
            Root: {
              style: {
                width: 'min(600px, 100%)',
              },
            },
          }}
        >
          <RoomCreationForm currentUserDetails={currentUserDetails} />
        </Card>
      </HeadingLevel>
    </div>
  );
}

function RoomCreationForm({ currentUserDetails }: { currentUserDetails: currentUser | undefined }) {
  const dispatch = useDispatch();
  const [] = useStyletron();
  const roomCreationState = useSelector(computedRoomCreationSliceStateSelector);
  const roomCreation = getComputedRoomCreationSliceState(roomCreationState);
  useFetchImportableGistDetails(roomCreation.gistImportFields, (data) =>
    dispatch(roomCreationActions.setGistDetails(data)),
  );
  useEffect(() => {
    fetchCurrentUsersGists().then((gistDetails) => dispatch(roomCreationActions.setOwnedGists(gistDetails)));
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!currentUserDetails) {
          return;
        }
        if (!roomCreation.canSubmit) {
          return;
        }
        dispatch(roomCreationActions.createRoom(roomCreation));
        dispatch(roomCreationActions.createRoom(roomCreation));
      }}
    >
      <StyledBody>
        <FormControl label={() => 'Room Name'}>
          <Input
            value={roomCreation.roomName}
            onChange={(e) => dispatch(roomCreationActions.setRoomName(e.currentTarget.value))}
          />
        </FormControl>
        <FormControl
          label={() => (
            <>
              Gist Configuration{'   '}
              <StatefulTooltip content="Create a Github gist to save your notes, or import an existing gist.">
                <StyledLink>?</StyledLink>
              </StatefulTooltip>
            </>
          )}
        >
          <Tabs
            fill={FILL.fixed}
            activeKey={roomCreation.formSelected}
            onChange={(e) => {
              dispatch(roomCreationActions.setActiveForm(Number(e.activeKey)));
            }}
          >
            <Tab title="No Gist" key={RoomCreationFormType.NoGist}></Tab>
            <Tab title="Import Existing Gist" key={RoomCreationFormType.Import}>
              <GistImportFields
                actionNamespace={ROOM_CREATION_ACTION_NAMESPACE}
                fields={roomCreation.gistImportFields}
                gistSelectionOptions={roomCreation.gistSelectionOptions}
              />
            </Tab>
            <Tab title="Create New Gist" key={RoomCreationFormType.Creation}>
              <GistCreationFields
                fields={roomCreation.gistCreationFields}
                actionNamespace={ROOM_CREATION_ACTION_NAMESPACE}
              />
            </Tab>
          </Tabs>
        </FormControl>
      </StyledBody>
      <StyledAction>
        <Button
          overrides={{
            Root: {
              style: {
                width: '100%',
              },
            },
          }}
          type="submit"
          disabled={!roomCreation.canSubmit}
          isLoading={roomCreation.submitted}
        >
          Create
        </Button>
      </StyledAction>
    </form>
  );
}

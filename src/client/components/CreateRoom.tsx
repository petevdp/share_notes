import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card, StyledAction, StyledBody } from 'baseui/card';
import { Checkbox } from 'baseui/checkbox';
import { FormControl } from 'baseui/form-control';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Check } from 'baseui/icon';
import { Input } from 'baseui/input';
import { Select } from 'baseui/select';
import { FILL, Tab, Tabs } from 'baseui/tabs-motion';
import { Tag } from 'baseui/tag';
import { Label1 } from 'baseui/typography';
import { currentUser } from 'Client/slices/currentUserDetails/types';
import {
  getCurrentUsersGists as fetchCurrentUsersGists,
  useFetchImportableGistDetails,
} from 'Client/slices/roomCreation/epics';
import { initialState, roomCreationSlice } from 'Client/slices/roomCreation/slice';
import {
  getComputedRoomCreationSliceState,
  GistImportStatus,
  roomCreationActions,
  RoomCreationFormType,
  roomCreationSliceStateWithComputed,
} from 'Client/slices/roomCreation/types';
import { rootState } from 'Client/store';
import React, { useEffect, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { AnyAction } from 'redux';

export function CreateRoom() {
  const dispatch = useDispatch();
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
  const globalDispatch = useDispatch();
  const [] = useStyletron();
  const [roomCreationState, roomCreationDispatch] = useReducer(roomCreationSlice.reducer, initialState);
  const roomCreation = getComputedRoomCreationSliceState(roomCreationState);
  useFetchImportableGistDetails(roomCreation.gistImportForm, roomCreationDispatch);
  useEffect(() => {
    fetchCurrentUsersGists().then((gistDetails) =>
      roomCreationDispatch(roomCreationActions.setOwnedGists(gistDetails)),
    );
  }, []);
  console.log(roomCreation);

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
        globalDispatch(roomCreationActions.createRoom(roomCreation));
      }}
    >
      <StyledBody>
        <FormControl label={() => 'Room Name'}>
          <Input
            value={roomCreation.roomName}
            onChange={(e) => roomCreationDispatch(roomCreationActions.setRoomName(e.currentTarget.value))}
          />
        </FormControl>
        <Tabs
          fill={FILL.fixed}
          activeKey={roomCreation.formSelected}
          onChange={(e) => {
            console.log(e);
            roomCreationDispatch(roomCreationActions.setActiveForm(Number(e.activeKey)));
          }}
        >
          <Tab title="Import Existing Gist" key={RoomCreationFormType.Import}>
            <GistImportFields roomCreation={roomCreation} roomCreationDispatch={roomCreationDispatch} />
          </Tab>
          <Tab title="Create New Gist" key={RoomCreationFormType.Creation}>
            <GistCreationFields roomCreation={roomCreation} roomCreationDispatch={roomCreationDispatch} />
          </Tab>
        </Tabs>
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
        >
          Create
        </Button>
      </StyledAction>
    </form>
  );
}

function GistImportFields({
  roomCreation,
  roomCreationDispatch,
}: {
  roomCreation: roomCreationSliceStateWithComputed;
  roomCreationDispatch: React.Dispatch<AnyAction>;
}) {
  const [css, theme] = useStyletron();

  return (
    <>
      <FormControl label={() => 'Your Gists'}>
        <Select
          options={roomCreation.gistSelectionOptions}
          value={roomCreation.gistImportForm.selectedGistValue}
          onChange={({ value }) => roomCreationDispatch(roomCreationActions.gistImport.setGistSelectionValue(value))}
          labelKey="label"
          valueKey="id"
          placeholder="Choose from owned Gists"
          maxDropdownHeight="300px"
          type={'search'}
        />
      </FormControl>
      <FormControl error={roomCreation.gistImportForm.errorMessage} label={'Gist Url'}>
        <Input
          value={roomCreation.gistImportForm.gistUrl}
          error={roomCreation.gistImportForm.status === GistImportStatus.Invalid}
          onChange={(e) => {
            roomCreationDispatch(roomCreationActions.gistImport.setGistUrl(e.currentTarget.value));
          }}
        />
      </FormControl>
      <Heading styleLevel={6}>Selected Gist Details</Heading>
      {roomCreation.gistImportForm.detailsForUrlAtGist && (
        <Card>
          <div>
            <Label1>Description</Label1>
            <div className={css({ backgroundColor: theme.colors.backgroundTertiary, padding: '5px' })}>
              {roomCreation.gistImportForm.detailsForUrlAtGist.description || '(empty)'}
            </div>
          </div>
          <div>
            <Label1>Files</Label1>
            {/* <ul> */}
            {Object.values(roomCreation.gistImportForm.detailsForUrlAtGist.files).map((f) => (
              <Tag closeable={false} key={f.filename} overrides={{ Text: { style: { maxWidth: 'unset' } } }}>
                {f.filename}
              </Tag>
            ))}
            {/* </ul> */}
          </div>
        </Card>
      )}
      {roomCreation.gistImportForm.status === GistImportStatus.UnownedGist && (
        <Checkbox
          overrides={{
            Root: {
              style: {
                width: 'max-content',
              },
            },
          }}
          checked={roomCreation.gistImportForm.shouldForkCheckboxChecked}
          onChange={() => {
            const checked = (event?.target as any).checked as boolean;
            roomCreationDispatch(roomCreationActions.setIsCheckboxChecked(checked));
          }}
        >
          {"You don't own the currently selected gist. Fork Instead?"}
        </Checkbox>
      )}
    </>
  );
}

function GistCreationFields({
  roomCreation,
  roomCreationDispatch,
}: {
  roomCreation: roomCreationSliceStateWithComputed;
  roomCreationDispatch: React.Dispatch<AnyAction>;
}) {
  const form = roomCreation.gistCreationForm;
  return (
    <>
      <FormControl label="gist name">
        <Input
          value={form.name}
          onChange={(e) => roomCreationDispatch(roomCreationActions.gistCreation.setGistName(e.currentTarget.value))}
        />
      </FormControl>
      <FormControl label="Gist Description">
        <Input
          value={form.description}
          onChange={(e) =>
            roomCreationDispatch(roomCreationActions.gistCreation.setGistDescription(e.currentTarget.value))
          }
        />
      </FormControl>
      <Checkbox
        overrides={{
          Root: {
            style: {
              width: 'max-content',
            },
          },
        }}
        checked={form.isPrivate}
        onChange={(e) => {
          const checked = (event?.target as any).checked as boolean;
          roomCreationDispatch(roomCreationActions.gistCreation.setIsGistPrivate(checked));
        }}
      >
        Private Gist
      </Checkbox>
    </>
  );
}

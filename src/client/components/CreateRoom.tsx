import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card, StyledAction, StyledBody } from 'baseui/card';
import { Checkbox } from 'baseui/checkbox';
import { FormControl } from 'baseui/form-control';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Input } from 'baseui/input';
import { Option, Select } from 'baseui/select';
import { Tag } from 'baseui/tag';
import { Label1 } from 'baseui/typography';
import {
  computedRoomCreationSliceStateSelector,
  GistUrlInputStatus,
  roomCreationActions,
} from 'Client/slices/roomCreation/types';
import { rootState } from 'Client/store';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { gistDetails } from 'Shared/githubTypes';
import { createRoomInput } from 'Shared/types/roomTypes';

export function CreateRoom() {
  const dispatch = useDispatch();
  const { roomHashId, currentUser, initializingRoom } = useSelector((s: rootState) => ({
    currentUser: s.session.user,
    roomHashId: s.room.currentRoom?.roomDetails?.hashId,
    initializingRoom: s.room.currentRoom?.initializingRoom,
  }));
  const roomCreation = useSelector(computedRoomCreationSliceStateSelector);

  const gistSelectionOptions: Option[] = roomCreation.ownedGists
    ? (Object.values(roomCreation.ownedGists) as gistDetails[]).map((gist) => ({
        id: gist.id,
        label: Object.values(gist.files)[0].filename,
        details: gist,
      }))
    : [];

  if (!currentUser) {
    throw 'current user not set';
  }

  useEffect(() => {
    dispatch(roomCreationActions.roomCreationOpened());
  }, []);
  const [css, theme] = useStyletron();

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
        <HeadingLevel>
          <Card
            overrides={{
              Root: {
                style: {
                  width: 'min(600px, 100%)',
                },
              },
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const url = new URL(roomCreation.gistUrl);
                const gistId = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
                const roomInput: createRoomInput = {
                  name: roomCreation.roomName,
                  gistName: gistId,
                  ownerId: currentUser.id,
                };
                dispatch(roomCreationActions.createRoom(roomInput, currentUser.githubLogin));
              }}
            >
              <StyledBody>
                <FormControl label={() => 'Room Name'}>
                  <Input
                    value={roomCreation.roomName}
                    onChange={(e) => dispatch(roomCreationActions.setRoomName(e.currentTarget.value))}
                  />
                </FormControl>
                <FormControl label={() => 'Your Gists'}>
                  <Select
                    options={gistSelectionOptions}
                    value={roomCreation.selectedGistValue}
                    onChange={({ value }) => dispatch(roomCreationActions.setGistSelectionValue(value))}
                    labelKey="label"
                    valueKey="id"
                    placeholder="Choose from owned Gists"
                    maxDropdownHeight="300px"
                    type={'search'}
                  />
                </FormControl>
                <FormControl error={roomCreation.errorMessage} label={'Gist Url'}>
                  <Input
                    value={roomCreation.gistUrl}
                    error={roomCreation.urlInputStatus === GistUrlInputStatus.Invalid}
                    onChange={(e) => dispatch(roomCreationActions.setGistUrl(e.currentTarget.value))}
                  />
                </FormControl>
                {roomCreation.detailsForUrlAtGist && (
                  <Card>
                    <Heading styleLevel={6}>Selected Gist Details</Heading>
                    <div>
                      <Label1>Description</Label1>
                      <div className={css({ backgroundColor: theme.colors.backgroundTertiary, padding: '5px' })}>
                        {roomCreation.detailsForUrlAtGist.description || '(empty)'}
                      </div>
                    </div>
                    <div>
                      <Label1>Files</Label1>
                      {/* <ul> */}
                      {Object.values(roomCreation.detailsForUrlAtGist.files).map((f) => (
                        <Tag closeable={false} key={f.filename} overrides={{ Text: { style: { maxWidth: 'unset' } } }}>
                          {f.filename}
                        </Tag>
                      ))}
                      {/* </ul> */}
                    </div>
                  </Card>
                )}
                {roomCreation.urlInputStatus === GistUrlInputStatus.UnownedGist && (
                  <Checkbox
                    checked={roomCreation.shouldForkCheckboxChecked}
                    onChange={() => {
                      const checked = (event?.target as any).checked as boolean;
                      dispatch(roomCreationActions.setIsCheckboxChecked(checked));
                    }}
                  >
                    {"You don't own the currently selected gist. Fork Instead?"}
                  </Checkbox>
                )}
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
                  disabled={
                    ![GistUrlInputStatus.OwnedGist, GistUrlInputStatus.UnownedGist].includes(
                      roomCreation.urlInputStatus,
                    ) ||
                    (roomCreation.urlInputStatus === GistUrlInputStatus.UnownedGist &&
                      !roomCreation.shouldForkCheckboxChecked)
                  }
                >
                  Create
                </Button>
              </StyledAction>
            </form>
          </Card>
        </HeadingLevel>
      </HeadingLevel>
    </div>
  );
}

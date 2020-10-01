import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card, StyledAction, StyledBody } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Input } from 'baseui/input';
import { ListItem } from 'baseui/list';
import { Option, Select } from 'baseui/select';
import { Skeleton } from 'baseui/skeleton';
import { Tag } from 'baseui/tag';
import { Textarea } from 'baseui/textarea';
import { Label1 } from 'baseui/typography';
import { roomCreationSliceStateWithErrorSelector } from 'Client/roomCreation/slice';
import { roomCreationActions } from 'Client/roomCreation/types';
import { rootState } from 'Client/store';
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';

export function CreateRoom() {
  const dispatch = useDispatch();
  const { isCurrentUserCreatingRoom, roomHashId, currentUser } = useSelector((s: rootState) => ({
    isCurrentUserCreatingRoom: s.room.isCurrentUserCreatingRoom,
    currentUser: s.session.user,
    roomHashId: s.room.currentRoom?.roomDetails?.hashId,
  }));
  const roomCreation = useSelector(roomCreationSliceStateWithErrorSelector);

  const gistSelectionOptions: Option[] = roomCreation.ownedGists
    ? roomCreation.ownedGists.map((g) => ({ id: g.id, label: Object.values(g.files)[0].filename, details: g }))
    : [];

  const selectedId = roomCreation.selectedGistValue[0]?.id;
  const selectedGist = useMemo(() => {
    return selectedId && roomCreation.ownedGists?.find((g) => g.id === selectedId);
  }, [selectedId]);

  if (!currentUser) {
    throw 'current user not set';
  }

  useEffect(() => {
    dispatch(roomCreationActions.roomCreationOpened());
    return () => {
      dispatch(roomCreationActions.roomCreationClosed(currentUser.githubLogin));
    };
  }, []);
  const [css, theme] = useStyletron();

  if (isCurrentUserCreatingRoom && roomHashId) {
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
                const gistName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
                const roomInput: CreateRoomInput = {
                  name: roomCreation.roomName,
                  gistName,
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
                <FormControl label={() => 'Selected Gist'}>
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
                <FormControl error={roomCreation.gistUrlError} label={'Gist Url'}>
                  <Input
                    value={roomCreation.gistUrl}
                    error={!!roomCreation.gistUrlError}
                    onChange={(e) => dispatch(roomCreationActions.setGistUrl(e.currentTarget.value))}
                  />
                </FormControl>
                {selectedGist && (
                  <Card>
                    <Heading styleLevel={6}>Selected Gist Details</Heading>
                    <div>
                      <Label1>Description</Label1>
                      <Textarea disabled value={selectedGist.description || '(empty)'} />
                    </div>
                    <div>
                      <Label1>Files</Label1>
                      {/* <ul> */}
                      {Object.values(selectedGist.files).map((f) => (
                        <Tag closeable={false} key={f.filename} overrides={{ Text: { style: { maxWidth: 'unset' } } }}>
                          {f.filename}
                        </Tag>
                      ))}
                      {/* </ul> */}
                    </div>
                  </Card>
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
                  disabled={!!roomCreation.gistUrlError}
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

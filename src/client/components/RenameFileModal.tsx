import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Modal, ModalBody, ModalHeader } from 'baseui/modal';
import {
  currentFileRenameWithComputedSelector,
  fileRenamingActions,
  RenameError,
  renameFile,
} from 'Client/slices/room/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { RoomModalZIndexOverride } from 'Client/utils/basewebUtils';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function RenameFileModal() {
  const dispatch = useDispatch();
  const fileDetails = useSelector((rootState: rootState) => {
    const currentRoom = rootState.room.currentRoom;
    if (!currentRoom?.roomSharedState.fileDetailsStates || !currentRoom.currentTabId) {
      return;
    }
    return currentRoom.roomSharedState.fileDetailsStates[currentRoom.currentTabId];
  });

  const currentRename = useSelector(currentFileRenameWithComputedSelector);
  const errorCodes = currentRename?.errors;

  const errorMessage = useMemo(() => {
    return errorCodes
      ?.map((code) => RENAME_ERROR_MESSAGES.get(code))
      .filter(Boolean)
      .map((msg) => <div key={msg}>{msg}</div>);
  }, [errorCodes]);

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const changedFilename = e.currentTarget.value;
    dispatch(fileRenamingActions.setNewFileName(changedFilename));
  };

  return (
    <Modal
      isOpen={!!currentRename}
      onClose={() => dispatch(fileRenamingActions.close())}
      unstable_ModalBackdropScroll={true}
      overrides={RoomModalZIndexOverride}
    >
      <ModalHeader>Rename {fileDetails?.filename || 'File'}</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentRename?.isValid) {
              dispatch(renameFile(currentRename.tabIdToRename, currentRename.newFilename));
            }
          }}
        >
          <FormControl error={errorMessage} label="New Filename">
            <Input
              error={!currentRename?.isValid}
              inputMode="inputmode"
              clearable
              value={currentRename?.newFilename || ''}
              onChange={onChange}
            />
          </FormControl>
          <Button type="submit" disabled={!currentRename?.isValid}>
            Rename
          </Button>
        </form>
      </ModalBody>
    </Modal>
  );
}

const { Empty, Invalid, Duplicate } = RenameError;
const RENAME_ERROR_MESSAGES = new Map([
  [Empty, "Filenames can't be empty."],
  [Invalid, 'Please provide a valid filename(numbers, letters, dashes(-), underscores(_) periods(.) and spaces.'],
  [Duplicate, 'Filenames must be unique.'],
]);

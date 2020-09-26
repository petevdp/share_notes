import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Modal, ModalBody, ModalHeader } from 'baseui/modal';
import { fileRenamingActions, renameFile } from 'Client/room/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
export function RenameFileModal() {
  const dispatch = useDispatch();
  const { fileDetails, otherFilenames, currentRename } = useSelector((rootState: rootState) => {
    const currentRoom = rootState.room.currentRoom;
    if (!currentRoom?.fileDetailsStates || !currentRoom.currentTabId) {
      return { fileDetails: undefined, otherFilenames: undefined, currentRename: currentRoom?.currentRename };
    }
    const otherFilenames = Object.values(currentRoom.fileDetailsStates)
      .filter((d) => d.tabId !== currentRoom.currentTabId)
      .map((d) => d.filename);

    return {
      fileDetails: currentRoom.fileDetailsStates[currentRoom.currentTabId],
      otherFilenames,
      currentRename: currentRoom?.currentRename,
    };
  });

  const error = useMemo(() => {
    if (!currentRename) {
      return null;
    }
    const { userChangedNewFilename, newFilename } = currentRename;
    if (!userChangedNewFilename) {
      return null;
    }
    if (newFilename.length === 0) {
      return "Filenames can't be empty.";
    }
    if (!/^[a-zA-Z0-9_.\-/ ]+$/.test(newFilename)) {
      return 'Please provide a valid filename(numbers, letters, dashes(-), underscores(_) periods(.) and spaces';
    }
    if (otherFilenames && otherFilenames.includes(newFilename)) {
      return 'Filenames must be unique.';
    }
    return null;
  }, [currentRename, otherFilenames]);

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const changedFilename = e.currentTarget.value;
    dispatch(fileRenamingActions.setNewFileName(changedFilename));
  };

  return (
    <Modal
      isOpen={!!currentRename}
      onClose={() => dispatch(fileRenamingActions.close())}
      unstable_ModalBackdropScroll={true}
      overrides={{
        Root: {
          style: {
            zIndex: 5,
          },
        },
      }}
    >
      <ModalHeader>Rename {fileDetails?.filename || 'File'}</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!error && currentRename) {
              dispatch(renameFile(currentRename.tabIdToRename, currentRename.newFilename));
            }
          }}
        >
          <FormControl error={error} label="New Filename">
            <Input
              error={!!error}
              inputMode="inputmode"
              clearable
              value={currentRename?.newFilename || ''}
              onChange={onChange}
            />
          </FormControl>
          <Button type="submit" disabled={!!error}>
            Rename
          </Button>
        </form>
      </ModalBody>
    </Modal>
  );
}

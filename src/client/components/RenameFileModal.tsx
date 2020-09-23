import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'baseui/modal';
import { Input } from 'baseui/input';
import { FormControl } from 'baseui/form-control';
import { useDispatch, useSelector } from 'react-redux';
import { renameFile } from 'Client/room/types';
import { Button } from 'baseui/button';
import { rootState } from 'Client/store';
export function RenameFileModal({
  tabId,
  isOpen,
  closeModal,
}: {
  tabId?: string;
  isOpen: boolean;
  closeModal: Function;
}) {
  const dispatch = useDispatch();
  const { fileDetails, otherFilenames } = useSelector((rootState: rootState) => {
    const currentRoom = rootState.room.currentRoom;
    if (!currentRoom?.fileDetailsStates || !currentRoom.currentTabId) {
      return { fileDetails: undefined, otherFilenames: undefined };
    }
    const otherFilenames = Object.values(currentRoom.fileDetailsStates)
      .filter((d) => d.tabId !== currentRoom.currentTabId)
      .map((d) => d.filename);

    return { fileDetails: currentRoom.fileDetailsStates[currentRoom.currentTabId], otherFilenames };
  });
  const [newFilename, setNewFilename] = useState('');
  const [userChangedFilename, setUserChangedFilename] = useState(false);
  const error = useMemo(() => {
    if (!userChangedFilename) {
      return null;
    }
    if (newFilename.length === 0) {
      return "Filenames can't be empty.";
    }
    if (!/^[a-zA-Z0-9_./-/ ]+$/.test(newFilename)) {
      return 'Please provide a valid filename(numbers, letters, dashes(-), underscrods(_) periods(.) and spaces';
    }
    if (otherFilenames && otherFilenames.includes(newFilename)) {
      return 'Filenames must be unique.';
    }
    return null;
  }, [userChangedFilename, otherFilenames, newFilename]);
  const displayedError = userChangedFilename && error;

  useEffect(() => {
    if (fileDetails && !isOpen) {
      setNewFilename(fileDetails.filename);
    }
  }, [fileDetails, isOpen, setNewFilename]);
  useEffect(() => {
    if (!isOpen) {
      setUserChangedFilename(false);
    }
  }, [isOpen, setUserChangedFilename]);

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const changedFilename = e.currentTarget.value;
    setUserChangedFilename(true);
    setNewFilename(changedFilename);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal()} unstable_ModalBackdropScroll={true}>
      <ModalHeader>Rename {fileDetails?.filename || 'File'}</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (tabId && !error) {
              dispatch(renameFile(tabId, newFilename));
              setUserChangedFilename(true);
              setNewFilename('');
              closeModal();
            }
          }}
        >
          <FormControl error={displayedError} label="New Filename">
            <Input error={!!displayedError} inputMode="inputmode" clearable value={newFilename} onChange={onChange} />
          </FormControl>
          <Button type="submit" disabled={!!displayedError}>
            Rename
          </Button>
        </form>
      </ModalBody>
    </Modal>
  );
}

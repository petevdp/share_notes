import React, { useState, useEffect, useRef } from 'react';
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
  const fileDetails = useSelector((rootState: rootState) => {
    const currentRoom = rootState.room.currentRoom;
    if (!currentRoom?.fileDetailsStates || !currentRoom.currentTabId) {
      return;
    }
    return currentRoom.fileDetailsStates[currentRoom.currentTabId];
  });
  const [newFilename, setNewFilename] = useState('');

  useEffect(() => {
    if (fileDetails && !isOpen) {
      setNewFilename(fileDetails.filename);
    }
  }, [fileDetails, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal()}>
      <ModalHeader>Rename {fileDetails?.filename || 'File'}</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (tabId) {
              dispatch(renameFile(tabId, newFilename));
              setNewFilename('');
              closeModal();
            }
          }}
        >
          <FormControl label="New Filename">
            <Input value={newFilename} onChange={(e) => setNewFilename(e.currentTarget.value)} />
          </FormControl>
          <Button type="submit">Rename</Button>
        </form>
      </ModalBody>
    </Modal>
  );
}

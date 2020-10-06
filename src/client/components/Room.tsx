import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { ChevronDown, Plus } from 'baseui/icon';
import { ItemT, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { useSnackbar } from 'baseui/snackbar';
import { addNewFile, destroyRoom, fileRenamingActions, initRoom, saveBackToGist } from 'Client/room/types';
import { rootState } from 'Client/store';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { AnonymousLoginModal } from './AnonymousLoginModal';
import { RenameFileModal } from './RenameFileModal';
import { TabContent } from './TabContent';
import { TabList } from './Tabs';

export function Room() {
  const [css] = useStyletron();
  const { roomHashId } = useParams<{ roomHashId: string }>();
  const dispatch = useDispatch();
  const currentRoom = useSelector((s: rootState) => s.room.currentRoom);
  const { enqueue } = useSnackbar();

  useEffect(() => {
    if (currentRoom?.forkedGistDetails) {
      enqueue({ message: 'Created new Fork for Gist.' });
    }
  });
  useEffect(() => {
    if (roomHashId) {
      dispatch(initRoom(roomHashId));
      return () => {
        dispatch(destroyRoom());
      };
    }
  }, [roomHashId]);

  // const openTab = (tabId: string) =>
  //   setOpenTabs((s) => {
  //     const newOpen = new Set(s.values());
  //     newOpen.add(tabId);
  //     return newOpen;
  //   });

  // obfuscate key for addNewFile with the room hash to avoid potential duplicate keys
  const addNewFileKey = `${roomHashId}-add-new-file`;
  const actionItems: ItemT[] = [
    { label: 'save back to gist', key: 'saveBackToGist' },
    {
      label: 'Rename File',
      key: 'renameFile',
    },
  ];

  const onActionItemSelect = ({ item: { key } }: { item: { label: string; key: string } }) => {
    switch (key) {
      case 'saveBackToGist':
        dispatch(saveBackToGist());
        break;
      case 'renameFile':
        if (currentRoom?.currentTabId) {
          dispatch(fileRenamingActions.startRenameCurrentFile());
        }
    }
  };

  return (
    <div
      className={css({
        width: '100%',
        height: '100%',
        // display: 'grid',
        // gridTemplateColumns: '1.95fr .05fr',
        // gridTemplateRows: '100%',
      })}
    >
      <div
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          paddingLeft: '2em',
          paddingRight: '2em',
        })}
      >
        <span
          className={css({
            display: 'flex',
            width: '100%',
          })}
        >
          <TabList />
          <Button key={addNewFileKey} onClick={() => dispatch(addNewFile())} kind="tertiary">
            <Plus />
          </Button>
        </span>
        <span>
          <StatefulPopover
            placement={'bottom'}
            content={() => <StatefulMenu onItemSelect={onActionItemSelect} items={actionItems}></StatefulMenu>}
          >
            <Button kind="secondary" shape="pill" endEnhancer={() => <ChevronDown />}>
              Actions
            </Button>
          </StatefulPopover>
        </span>
      </div>
      <TabContent />
      <RenameFileModal />
      <AnonymousLoginModal />
    </div>
  );
}

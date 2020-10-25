import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { ChevronDown, Plus } from 'baseui/icon';
import { ItemT, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { useSnackbar } from 'baseui/snackbar';
import { addNewFile, destroyRoom, fileRenamingActions, initRoom, saveBackToGist } from 'Client/slices/room/types';
import { rootState } from 'Client/store';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { AnonymousLoginModal } from './AnonymousLoginModal';
import { RenameFileModal } from './RenameFileModal';
import { GlobalSettingsDropdown } from './SettingsDropdown';
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

  // obfuscate key for addNewFile with the room hash to avoid potential duplicate keys
  const addNewFileKey = `${roomHashId}-add-new-file`;
  let actionItems: ItemT[] = [
    {
      label: 'Rename File',
      key: 'renameFile',
    },
  ];

  if (currentRoom?.gistDetails) {
    actionItems = [...actionItems, { label: 'save back to gist', key: 'saveBackToGist' }];
  }

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
          alignContent: 'center',
          paddingLeft: '1em',
          paddingRight: '1em',
          paddingTop: '.25em',
          paddingBottom: '.25em',
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
        <span
          className={css({
            display: 'flex',
          })}
        >
          <StatefulPopover
            placement={'bottom'}
            content={() => <StatefulMenu onItemSelect={onActionItemSelect} items={actionItems}></StatefulMenu>}
            overrides={RoomPopoverZIndexOverride}
          >
            <Button
              overrides={{ Root: { style: { marginRight: '4px' } } }}
              kind="secondary"
              shape="pill"
              endEnhancer={() => <ChevronDown />}
            >
              Actions
            </Button>
          </StatefulPopover>
          <GlobalSettingsDropdown />
        </span>
      </div>
      <TabContent />
      <RenameFileModal />
      <AnonymousLoginModal />
    </div>
  );
}

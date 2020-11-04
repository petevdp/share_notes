import { useStyletron } from 'baseui';
import { Button, ButtonOverrides } from 'baseui/button';
import { Checkbox, StyledCheckmark } from 'baseui/checkbox';
import { ChevronDown, Plus } from 'baseui/icon';
import { ItemT, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { useSnackbar } from 'baseui/snackbar';
import {
  addNewFile,
  currentFileRenameWithComputedSelector,
  currentRoomStateWithComputedSelector,
  destroyRoom,
  fileRenamingActions,
  initRoom,
  saveBackToGist,
} from 'Client/slices/room/types';
import { roomUpdateActions } from 'Client/slices/roomUpdating/types';
import {
  individualEditorSetting,
  settingsActions,
  settingsForCurrentEditorSelector,
} from 'Client/slices/settings/types';
import { rootState } from 'Client/store';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import __merge from 'lodash/merge';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { AnonymousLoginModal } from './AnonymousLoginModal';
import { EditRoomModal } from './EditRoomModal';
import { RenameFileModal } from './RenameFileModal';
import { GlobalSettingsDropdown } from './SettingsDropdown';
import { TabContent } from './TabContent';
import { getTabButtonOverrides, TabList } from './Tabs';

export function Room() {
  const [css] = useStyletron();
  const { roomHashId } = useParams<{ roomHashId: string }>();
  const dispatch = useDispatch();
  const currentRoom = useSelector(currentRoomStateWithComputedSelector);
  const settingsForCurrentEditor = useSelector(settingsForCurrentEditorSelector);
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

  if (currentRoom?.roomDetails) {
    actionItems = [...actionItems, { label: 'Edit Room Details', key: 'editRoom' }];
  }

  if (currentRoom?.gistDetails) {
    actionItems = [...actionItems, { label: 'save back to gist', key: 'saveBackToGist' }];
  }

  const onActionItemSelect = ({ item: { key } }: { item: { label: string; key: string } }) => {
    switch (key) {
      case 'saveBackToGist':
        dispatch(saveBackToGist());
        break;
      case 'editRoom':
        if (currentRoom?.roomDetails && !currentRoom.roomDetails.gistName) {
          dispatch(roomUpdateActions.initialize({ roomDetails: currentRoom.roomDetails }));
        } else if (currentRoom?.roomDetails && currentRoom.gistDetails) {
          dispatch(
            roomUpdateActions.initialize({
              roomDetails: currentRoom.roomDetails,
              gistDetails: currentRoom.gistDetails,
            }),
          );
        }
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
          <Button
            key={addNewFileKey}
            onClick={() => dispatch(addNewFile())}
            kind="tertiary"
            overrides={__merge<ButtonOverrides, ButtonOverrides>(
              {
                BaseButton: {
                  style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignContent: 'center' },
                },
              },
              getTabButtonOverrides(),
            )}
          >
            <Plus />
          </Button>
        </span>
        <span
          className={css({
            display: 'flex',
          })}
        >
          {currentRoom?.isCurrentFileMarkdown && (
            <Checkbox
              onChange={(event) => {
                const checked = (event?.target as any).checked as boolean;
                if (currentRoom?.hashId && currentRoom.currentTabId) {
                  dispatch(
                    settingsActions.setGlobalEditorSetting({
                      key: 'showMarkdownPreview',
                      value: checked,
                    } as individualEditorSetting),
                  );
                }
              }}
              checkmarkType="toggle_round"
              checked={settingsForCurrentEditor?.showMarkdownPreview}
            />
          )}
          <StatefulPopover
            placement={'bottom'}
            content={() => <StatefulMenu onItemSelect={onActionItemSelect} items={actionItems}></StatefulMenu>}
            overrides={RoomPopoverZIndexOverride}
          >
            <Button
              overrides={__merge({ Root: { style: { marginRight: '4px' } } }, getTabButtonOverrides())}
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
      <EditRoomModal />
    </div>
  );
}

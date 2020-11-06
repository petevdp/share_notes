import { useStyletron } from 'baseui';
import { Button, ButtonOverrides, ButtonProps, StyledBaseButton } from 'baseui/button';
import { ButtonGroup } from 'baseui/button-group';
import { Checkbox, StyledCheckmark } from 'baseui/checkbox';
import { ChevronDown, Plus } from 'baseui/icon';
import { ItemT, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { useSnackbar } from 'baseui/snackbar';
import { Label3 } from 'baseui/typography';
import {
  addNewFile,
  currentFileRenameWithComputedSelector,
  currentRoomStateWithComputedSelector,
  destroyRoom,
  fileRenamingActions,
  initRoom,
  isLoggedInForRoomSelector,
  saveBackToGist,
} from 'Client/slices/room/types';
import { roomUpdateActions } from 'Client/slices/roomUpdating/types';
import {
  individualEditorSetting,
  settingsActions,
  settingsForCurrentEditorSelector,
  settingsResolvedForEditor,
} from 'Client/slices/settings/types';
import { rootState } from 'Client/store';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import __merge from 'lodash/merge';
import React, { ReactElement, ReactNode, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { withStyle } from 'styletron-react';

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
    actionItems = [...actionItems, { label: 'Save Back to Gist', key: 'saveBackToGist' }];
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

  const selectDisplayMode = (mode: settingsResolvedForEditor['displayMode']) => {
    dispatch(settingsActions.setGlobalEditorSetting({ key: 'displayMode', value: mode }));
  };

  const selectionOptions: settingsResolvedForEditor['displayMode'][] = ['regular', 'diffViewer', 'markdownPreview'];

  return (
    <div
      className={css({
        width: '100%',
        height: '100%',
      })}
    >
      <div
        className={css({
          display: 'grid',
          gridTemplateAreas: `'emptytitle displaymodetitle empty empty' 'tabs displaymode actions settings'`,
          width: '100%',
          gridTemplateColumns: 'auto min-content min-content min-content',
          gridTemplateRows: '16 40',
          gridGap: '2px',
          // justifyContent: 'space-between',
          // alignContent: 'center',
          // paddingLeft: '1em',
          // paddingRight: '1em',
          paddingTop: '.25em',
          paddingBottom: '.25em',
        })}
      >
        <span
          className={css({
            gridArea: 'tabs',
            display: 'flex',
            width: '100%',
          })}
        >
          <TabList />
          <Button
            key={addNewFileKey}
            onClick={() => dispatch(fileRenamingActions.promptNameForNewFile())}
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
        <Label3 className={css({ gridArea: 'displaymodetitle', width: '100%', textAlign: 'center' })}>
          Display Mode
        </Label3>
        {currentRoom && (
          <ButtonGroup
            overrides={{ Root: { style: { gridArea: 'displaymode' } } }}
            selected={settingsForCurrentEditor && selectionOptions.indexOf(settingsForCurrentEditor.displayMode)}
          >
            <DiffSelectionButton
              isSelected={settingsForCurrentEditor?.displayMode === 'regular'}
              key="regular"
              onClick={() => selectDisplayMode('regular')}
            >
              Regular
            </DiffSelectionButton>
            <DiffSelectionButton
              isSelected={settingsForCurrentEditor?.displayMode === 'diffViewer'}
              key="diff"
              onClick={() => selectDisplayMode('diffViewer')}
            >
              Diff
            </DiffSelectionButton>
            {currentRoom.isCurrentFileMarkdown && (
              <DiffSelectionButton
                isSelected={settingsForCurrentEditor?.displayMode === 'markdownPreview'}
                key="markdownPreview"
                onClick={() => selectDisplayMode('markdownPreview')}
              >
                Preview
              </DiffSelectionButton>
            )}
          </ButtonGroup>
        )}
        <span className={css({ gridArea: 'actions' })}>
          <StatefulPopover
            placement={'bottom'}
            content={() => <StatefulMenu onItemSelect={onActionItemSelect} items={actionItems}></StatefulMenu>}
            overrides={RoomPopoverZIndexOverride}
          >
            <Button
              overrides={__merge<ButtonOverrides, ButtonOverrides>(
                { Root: { style: { marginRight: '4px' } }, EndEnhancer: { style: { marginLeft: '2px' } } },
                getTabButtonOverrides(),
              )}
              kind="secondary"
              shape="pill"
              endEnhancer={() => <ChevronDown />}
            >
              Actions
            </Button>
          </StatefulPopover>
        </span>
        <span className={css({ gridArea: 'settings' })}>
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

function DiffSelectionButton({
  onClick,
  isSelected,
  children,
}: {
  children: ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => any;
  isSelected: boolean;
}) {
  const diffSelectionSpecificOverrides: ButtonOverrides = { Root: { style: { fontSize: '10px' } } };
  return (
    <Button
      isSelected={isSelected}
      onClick={onClick}
      kind={'secondary'}
      overrides={__merge(diffSelectionSpecificOverrides, getTabButtonOverrides())}
    >
      {children}
    </Button>
  );
}

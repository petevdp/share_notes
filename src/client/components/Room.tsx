import { styled, useStyletron } from 'baseui';
import { Button, ButtonOverrides, ButtonProps } from 'baseui/button';
import { ButtonGroup } from 'baseui/button-group';
import { Plus } from 'baseui/icon';
import { useSnackbar } from 'baseui/snackbar';
import { StatefulTooltip } from 'baseui/tooltip';
import { Label3 } from 'baseui/typography';
import SvgPencil from 'Client/generatedSvgComponents/Pencil';
import SvgSave from 'Client/generatedSvgComponents/Save';
import {
  currentRoomStateWithComputedSelector,
  destroyRoom,
  fileRenamingActions,
  initRoom,
  isCurrentUserRoomOwnerSelector,
  roomInitialized,
  saveBackToGist,
} from 'Client/slices/room/types';
import { roomUpdateActions } from 'Client/slices/roomUpdating/types';
import {
  settingsActions,
  settingsForCurrentEditorSelector,
  settingsResolvedForEditor,
} from 'Client/slices/settings/types';
import __merge from 'lodash/merge';
import React, { ReactNode, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { AnonymousLoginModal } from './AnonymousLoginModal';
import { EditRoomModal } from './EditRoomModal';
import { RenameFileModal } from './RenameFileModal';
import { GlobalSettingsDropdown } from './SettingsDropdown';
import { TabContent } from './TabContent';
import { getTabButtonOverrides, TabList } from './Tabs';

const RoomContainer = styled('div', {
  width: '100%',
  height: '100%',
});

const CONTROL_PANEL_GRID_AREA = [
  ['.', 'display-mode-title', '.', '.', '.'],
  ['tabs', 'display-mode', 'edit-details', 'save-to-gist', 'settings'],
]
  .map((s) => `"${s.join(' ')}"`)
  .join(' ');

const ControlPanel = styled('div', {
  display: 'grid',
  gridTemplateAreas: CONTROL_PANEL_GRID_AREA,
  gridTemplateColumns: 'auto repeat(4, min-content)',
  gridTemplateRows: '16 40',
  columnGap: '8px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '.25em',
  paddingBottom: '.25em',
});

const TabControls = styled('span', {
  gridArea: 'tabs',
  display: 'flex',
  width: '100%',
  overflowX: 'auto',
  justifyContent: 'flex-start',
});

export function Room() {
  const [css] = useStyletron();
  const { roomHashId } = useParams<{ roomHashId: string }>();
  const dispatch = useDispatch();
  const currentRoom = useSelector(currentRoomStateWithComputedSelector);
  const settingsForCurrentEditor = useSelector(settingsForCurrentEditorSelector);
  const isCurrentUserRoomOwner = useSelector(isCurrentUserRoomOwnerSelector);
  const { enqueue: enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (currentRoom?.forkedGistDetails) {
      enqueueSnackbar({ message: 'Created new Fork for Gist.' });
    }
  }, []);
  useEffect(() => {
    if (roomHashId) {
      dispatch(initRoom(roomHashId, enqueueSnackbar));
      return () => {
        dispatch(destroyRoom());
      };
    }
  }, [roomHashId]);

  // namespace key for addNewFile with the room hash to avoid potential duplicate keys
  const addNewFileKey = `${roomHashId}/add-new-file`;
  const selectDisplayMode = (mode: settingsResolvedForEditor['displayMode']) => {
    dispatch(settingsActions.setGlobalEditorSetting({ key: 'displayMode', value: mode }));
  };

  const selectionOptions: settingsResolvedForEditor['displayMode'][] = ['regular', 'diffViewer', 'markdownPreview'];

  return (
    <RoomContainer className={css({})}>
      <ControlPanel>
        <TabControls>
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
        </TabControls>
        <Label3 as="label" className={css({ gridArea: 'display-mode-title', width: '100%', textAlign: 'center' })}>
          Display
        </Label3>
        {currentRoom && (
          <ButtonGroup
            overrides={{ Root: { style: { gridArea: 'display-mode', borderRadius: '38px', overflow: 'hidden' } } }}
            selected={settingsForCurrentEditor && selectionOptions.indexOf(settingsForCurrentEditor.displayMode)}
          >
            <DiffSelectionButton
              isSelected={settingsForCurrentEditor?.displayMode === 'regular'}
              key="regular"
              onClick={() => selectDisplayMode('regular')}
            >
              Regular
            </DiffSelectionButton>
            {currentRoom.gistDetails && (
              <DiffSelectionButton
                isSelected={settingsForCurrentEditor?.displayMode === 'diffViewer'}
                key="diff"
                onClick={() => selectDisplayMode('diffViewer')}
              >
                Diff
              </DiffSelectionButton>
            )}
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
        {isCurrentUserRoomOwner && (
          <>
            <ControlPanelButtonWithTooltip
              onClick={() => {
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
              }}
              Icon={SvgPencil}
              tooltip="Edit Room Details"
              gridArea="edit-details"
            />
            {currentRoom?.gistDetails && (
              <ControlPanelButtonWithTooltip
                gridArea="save-to-gist"
                Icon={SvgSave}
                tooltip={'Save changes to Gist'}
                onClick={() => dispatch(saveBackToGist(roomHashId, enqueueSnackbar))}
              />
            )}
          </>
        )}
        <span className={css({ gridArea: 'settings' })}>
          <GlobalSettingsDropdown />
        </span>
      </ControlPanel>
      <TabContent />
      <RenameFileModal />
      <AnonymousLoginModal />
      <EditRoomModal />
    </RoomContainer>
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

interface controlPanelButtonProps {
  Icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  onClick?: () => void;
  gridArea?: string;
  buttonProps?: ButtonProps & React.RefAttributes<HTMLButtonElement>;
  iconProps?: React.SVGProps<SVGSVGElement>;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export function ControlPanelButton({
  Icon,
  onClick,
  gridArea,
  buttonRef,
  buttonProps = {},
  iconProps = {},
}: controlPanelButtonProps) {
  const [, theme] = useStyletron();
  return (
    <Button
      ref={buttonRef}
      shape="pill"
      kind="tertiary"
      onClick={() => onClick && onClick()}
      overrides={getTabIconActionButtonOverrides(gridArea)}
      {...buttonProps}
    >
      <Icon fill={theme.colors.contentPrimary} {...iconProps} />
    </Button>
  );
}

export function ControlPanelButtonWithTooltip({
  tooltip,
  Icon,
  onClick,
  gridArea,
  buttonRef,
  buttonProps = {},
  iconProps = {},
}: controlPanelButtonProps & { tooltip: ReactNode }) {
  const [, theme] = useStyletron();
  return (
    <StatefulTooltip content={tooltip} placement="bottom">
      <Button
        ref={buttonRef}
        shape="pill"
        kind="tertiary"
        onClick={() => onClick && onClick()}
        overrides={getTabIconActionButtonOverrides(gridArea)}
        {...buttonProps}
      >
        <Icon fill={theme.colors.contentPrimary} {...iconProps} />
      </Button>
    </StatefulTooltip>
  );
}

const getTabIconActionButtonOverrides = (gridArea?: string): ButtonOverrides =>
  __merge<ButtonOverrides, ButtonOverrides>(getTabButtonOverrides(), {
    BaseButton: { style: { gridArea }, props: { kind: 'tertiary', shape: 'pill' } },
  });

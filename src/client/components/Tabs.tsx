import { useStyletron } from 'baseui';
import { Button, ButtonOverrides } from 'baseui/button';
import { Delete } from 'baseui/icon';
import { StatefulMenu } from 'baseui/menu';
import { Popover } from 'baseui/popover';
import {
  currentRoomStateWithComputedSelector,
  fileRenamingActions,
  removeFile,
  switchCurrentFile,
} from 'Client/slices/room/types';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import __merge from 'lodash/merge';
import __uniqBy from 'lodash/uniqBy';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function TabList() {
  const dispatch = useDispatch();
  const currentRoom = useSelector(currentRoomStateWithComputedSelector);
  const [openTabContextMenus, setOpenTabContextMenu] = useState(new Set<string>());

  const [css] = useStyletron();

  const openTabContextMenu = (tabId: string) =>
    setOpenTabContextMenu((s) => {
      const newOpen = new Set(s.values());
      newOpen.add(tabId);
      return newOpen;
    });

  const closeTabContextMenu = (tabId: string) =>
    setOpenTabContextMenu((s) => {
      const newOpen = new Set(s.values());
      newOpen.delete(tabId);
      return newOpen;
    });

  const navStyles = css({
    display: 'flex',
    overflowX: 'auto',
    gridArea: 'tabs',
  });

  if (!currentRoom || !currentRoom.roomSharedState.fileDetailsStates) {
    return null;
  }

  return (
    <nav className={navStyles}>
      {Object.values(currentRoom.roomSharedState.fileDetailsStates).map((tabState) => {
        const contextMenuItems = [{ label: 'rename file', key: 'renameFile' }];
        const onContextMenuSelect = ({ item: { key } }: { item: { label: string; key: string } }) => {
          switch (key) {
            case 'renameFile':
              dispatch(fileRenamingActions.startFileRename(tabState.tabId));
              break;
          }
          closeTabContextMenu(tabState.tabId);
        };
        return (
          <Popover
            key={tabState.tabId}
            onClick={() => dispatch(switchCurrentFile(tabState.tabId))}
            isOpen={openTabContextMenus.has(tabState.tabId)}
            content={
              <StatefulMenu
                overrides={{ List: { style: { paddingTop: '0px', paddingBottom: '0px' } } }}
                onItemSelect={onContextMenuSelect}
                items={contextMenuItems}
              ></StatefulMenu>
            }
            onClickOutside={() => closeTabContextMenu(tabState.tabId)}
            overrides={{
              ...RoomPopoverZIndexOverride,
              Body: {
                ...RoomPopoverZIndexOverride.Body,
                style: {
                  ...RoomPopoverZIndexOverride.Body.style,
                  top: '35px',
                },
              },
            }}
          >
            <Button
              kind="secondary"
              onClick={() => dispatch(switchCurrentFile(tabState.tabId))}
              isSelected={currentRoom.currentTabId == tabState.tabId}
              overrides={__merge(getTabButtonOverrides(), {
                BaseButton: {
                  props: {
                    onContextMenu: (e: any) => {
                      e.preventDefault();
                      openTabContextMenu(tabState.tabId);
                    },
                  },
                  style: {
                    display: 'flex',
                    alignItems: 'flex-start',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                  },
                },
              })}
            >
              <span
                className={css({
                  whiteSpace: 'nowrap',
                  width: 'min-content',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start',
                  marginTop: '3px',
                  marginLeft: '3px',
                  marginRight: '3px',
                  marginBottom: '3px',
                  flexWrap: 'nowrap',
                })}
              >
                <span className={css({ display: 'flex', justifyContent: 'flex-start', height: '6px' })}>
                  {currentRoom.awarenessWithComputed &&
                    __uniqBy(
                      [...currentRoom.awarenessWithComputed.entries()].filter(
                        ([, a]) => a.currentTab && a.roomMemberDetails && a.currentTab === tabState.tabId,
                      ),
                      ([, a]) => a.roomMemberDetails.userIdOrAnonID,
                    ).map(([, a]) => (
                      <svg
                        key={a.roomMemberDetails.userIdOrAnonID}
                        className={css({ width: '4px', height: '4px', marginRight: '2px' })}
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle fill={a.color} cx="50" cy="50" r="50" />
                      </svg>
                    ))}
                </span>
                <span className={css({ display: 'inline-block' })} key="filename">
                  {tabState.filename}
                </span>
              </span>
              <span
                key={'delete button'}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(removeFile(tabState.tabId));
                }}
                className={css({
                  ':hover': {
                    backgroundColor: '#c4c4c4',
                    color: '#000000',
                  },
                  backgroundColor: 'transparent',
                  color: '#c4c4c4',
                  display: 'flex',
                  alignSelf: 'start',
                  justifySelf: 'flex-end',
                  padding: '.2px',
                  borderRadius: '50%',
                })}
              >
                <Delete />
              </span>
            </Button>
          </Popover>
        );
      })}
    </nav>
  );
}

export const getTabButtonOverrides = (): ButtonOverrides => ({
  BaseButton: {
    style: {
      height: '40px',
      paddingTop: '7px',
      paddingBottom: '7px',
      paddingLeft: '7px',
      paddingRight: '7px',
    },
  },
});

export const getTabIconActionButtonOverrides = (gridArea?: string): ButtonOverrides =>
  __merge<ButtonOverrides, ButtonOverrides>(getTabButtonOverrides(), {
    BaseButton: { style: { gridArea }, props: { kind: 'tertiary', shape: 'pill' } },
  });

console.log({ overrides: getTabIconActionButtonOverrides('the-grid-area') });

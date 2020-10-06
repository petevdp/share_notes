import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Delete } from 'baseui/icon';
import { StatefulMenu } from 'baseui/menu';
import { Popover } from 'baseui/popover';
import { fileRenamingActions, removeFile, switchCurrentFile } from 'Client/room/types';
import { rootState } from 'Client/store';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function TabList() {
  const dispatch = useDispatch();
  const currentRoom = useSelector((s: rootState) => s.room.currentRoom);
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

  if (!currentRoom || !currentRoom.fileDetailsStates) {
    return <span>{'..loading'}</span>;
  }

  return (
    <nav
      className={css({
        display: 'flex',
      })}
    >
      {Object.values(currentRoom.fileDetailsStates).map((tabState) => {
        const contextMenuItems = [{ label: 'rename file', key: 'renameFile' }];
        const onContextMenuSelect = ({ item: { key } }: { item: { label: string; key: string } }) => {
          switch (key) {
            case 'renameFile':
              dispatch(fileRenamingActions.startRenameCurrentFile());
              break;
          }
          closeTabContextMenu(tabState.tabId);
        };
        return (
          <Popover
            popoverMargin={0}
            placement={'auto'}
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
            overrides={RoomPopoverZIndexOverride}
          >
            <Button
              kind="secondary"
              onClick={() => dispatch(switchCurrentFile(tabState.tabId))}
              isSelected={currentRoom.currentTabId == tabState.tabId}
              overrides={{
                BaseButton: {
                  props: {
                    onContextMenu: (e: any) => {
                      e.preventDefault();
                      openTabContextMenu(tabState.tabId);
                    },
                  },
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    paddingTop: '0px',
                    paddingBottom: '5px',
                    paddingLeft: '5px',
                    paddingRight: '5px',
                  },
                },
              }}
            >
              <span className={css({ display: 'flex', justifyContent: 'space-between', height: '5px' })}>
                {currentRoom.awareness &&
                  Object.values(currentRoom.awareness)
                    .filter((a) => a.currentTab && a.user && a.currentTab === tabState.tabId)
                    .map((a) => (
                      <svg
                        key={a.user?.clientID}
                        className={css({ width: '4px', height: '4px', marginRight: '2px' })}
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle fill={a.user?.color} cx="50" cy="50" r="50" />
                      </svg>
                    ))}
              </span>
              <span
                className={css({ whiteSpace: 'nowrap', width: 'min-content', display: 'flex', alignItems: 'center' })}
              >
                <span className={css({ display: 'inline-block' })} key="filename">
                  {tabState.filename}
                </span>
                <span
                  key={'delete button'}
                  onClick={(e) => dispatch(removeFile(tabState.tabId)) && e.stopPropagation()}
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
              </span>
            </Button>
          </Popover>
        );
      })}
    </nav>
  );
}

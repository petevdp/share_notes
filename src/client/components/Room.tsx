import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { ChevronDown, Delete, Plus } from 'baseui/icon';
import { ItemT, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { Skeleton } from 'baseui/skeleton';
import { useSnackbar } from 'baseui/snackbar';
import { Tab, Tabs } from 'baseui/tabs-motion';
import {
  addNewFile,
  destroyRoom,
  fileRenamingActions,
  initRoom,
  removeFile,
  saveBackToGist,
  switchCurrentFile,
} from 'Client/room/types';
import { rootState } from 'Client/store';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { StyleObject } from 'styletron-react';

import { AnonymousLoginModal } from './AnonymousLoginModal';
import { RenameFileModal } from './RenameFileModal';
import { TabContent } from './TabContent';

const tabsRootStyle: StyleObject = {};

export function Room() {
  const [css] = useStyletron();
  const { roomHashId } = useParams<{ roomHashId: string }>();
  const dispatch = useDispatch();
  const currentRoom = useSelector((s: rootState) => s.room.currentRoom);
  const awareness = useSelector((s: rootState) => s.room.currentRoom?.awareness);
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

  let tabArr: JSX.Element[];

  if (currentRoom?.fileDetailsStates) {
    tabArr = Object.values(currentRoom.fileDetailsStates).map((tabState) => {
      return (
        <Tab
          overrides={{
            TabPanel: {
              style: {
                display: 'none',
              },
            },
            Tab: {
              props: {
                onContextMenu: () => alert('context menu'),
              },
              style: {
                paddingTop: '3px',
                paddingBottom: '5px',
                paddingLeft: '3px',
                paddingRight: '3px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexDirection: 'column',
              },
            },
          }}
          key={tabState.tabId}
          title={
            <>
              <span className={css({ display: 'flex', justifyContent: 'space-between' })}>
                {awareness &&
                  Object.values(awareness)
                    .filter((a) => a.currentTab && a.user && a.currentTab === tabState.tabId)
                    .map((a) => (
                      <span
                        key={a.user?.clientID}
                        className={css({
                          marginRight: '2px',
                          width: '4px',
                          height: '4px',
                          lineHeight: '4px',
                          marginBottom: '2px',
                        })}
                      >
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <circle fill={a.user?.color} cx="50" cy="50" r="50" />
                        </svg>
                      </span>
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
            </>
          }
        />
      );
    });
  } else {
    tabArr = [];
  }

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
    console.log('item: ', key);
  };

  const tabsElement = (
    <>
      <Tabs
        activeKey={currentRoom?.currentTabId}
        overrides={{
          Root: {
            style: tabsRootStyle,
          },
        }}
        onChange={(e) => {
          if (!currentRoom) {
            throw 'room data not set yet';
          }
          if (e.activeKey !== currentRoom.currentTabId) {
            dispatch(switchCurrentFile(e.activeKey.toString()));
          }
        }}
      >
        {tabArr}
      </Tabs>
    </>
  );

  const tabs = currentRoom?.fileDetailsStates ? (
    tabsElement
  ) : (
    <Tabs overrides={{ Root: { style: tabsRootStyle } }}>
      <Tab title="...">
        <Skeleton />
      </Tab>
    </Tabs>
  );

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
          })}
        >
          {tabs}
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

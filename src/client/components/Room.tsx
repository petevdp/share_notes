import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState, MutableRefObject } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { rootState } from 'Client/store';
import { useStyletron, styled } from 'baseui';
import { Skeleton } from 'baseui/skeleton';
import { Tabs, Tab, StatefulTabs } from 'baseui/tabs-motion';
import { initRoom, destroyRoom, switchCurrentFile, addNewFile, removeFile } from 'Client/room/types';
import { Plus, Delete } from 'baseui/icon';
import { TabContent } from './TabContent';
import { StyleObject } from 'styletron-react';
import { ItemT } from 'baseui/menu';
import { Button } from 'baseui/button';

const ControlPanel = styled('div', { display: 'flex', justifyContent: 'space-between', padding: '.5em' });
const RightButtonGroup = styled('span', { display: 'flex', justifyContent: 'flex-end', alignItems: 'center' });

const circle = (
  <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
  </svg>
);

const tabsRootStyle: StyleObject = {};

class Test {
  testMethod() {}
}

export function Room() {
  const [css, theme] = useStyletron();
  const { roomHashId } = useParams<{ roomHashId: string }>();
  const dispatch = useDispatch();
  const currentRoom = useSelector((s: rootState) => s.room.currentRoom);

  useEffect(() => {
    if (roomHashId) {
      dispatch(initRoom(roomHashId));
      return () => {
        dispatch(destroyRoom());
      };
    }
  }, [roomHashId]);

  let tabArr: JSX.Element[];
  let tabMenuItems: ItemT[];

  if (currentRoom?.fileDetailsStates) {
    tabArr = Object.values(currentRoom.fileDetailsStates).map((state) => {
      const triggerPopover = () => {};
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
                width: 'min-content',
                whiteSpace: 'nowrap',
                display: 'flex',
                // padding: '5px',
                paddingTop: '5px',
                paddingBottom: '5px',
                paddingLeft: '3px',
                paddingRight: '3px',
                justifyContent: 'space-between',
                alignItems: 'center',
                alignContent: 'center',
              },
            },
          }}
          key={state.tabId}
          title={
            <>
              <span key="filename">{state.filename}</span>
              <span
                key={'delete button'}
                onClick={(e) => dispatch(removeFile(state.tabId)) && e.stopPropagation()}
                className={css({
                  ':hover': {
                    backgroundColor: '#c4c4c4',
                    color: '#000000',
                  },
                  backgroundColor: 'transparent',
                  color: '#c4c4c4',
                  display: 'flex',
                  alignContent: 'center',
                  justifyContent: 'center',
                  alignSelf: 'start',
                  justifySelf: 'flex-end',
                  padding: '.2px',
                  borderRadius: '50%',
                })}
              >
                <Delete />
              </span>
            </>
          }
        />
      );
    });

    tabMenuItems = Object.values(currentRoom.fileDetailsStates).map((f) => ({
      label: f.filename,
      key: f.tabId,
    }));
  } else {
    tabArr = [];
    tabMenuItems = [];
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
        })}
      >
        <span
          className={css({
            display: 'flex',
          })}
        >
          {tabs}
          <Button key={addNewFileKey} onClick={() => dispatch(addNewFile())} kind="minimal">
            <Plus />
          </Button>
        </span>
      </div>
      <TabContent />
    </div>
  );
}

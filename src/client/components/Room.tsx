import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState, MutableRefObject } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { rootState } from 'Client/store';
import { useStyletron, styled } from 'styletron-react';
import { Button } from 'baseui/button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'baseui/modal';
import { Override } from 'baseui/overrides';
import { Tabs, Tab } from 'baseui/tabs-motion';
import {
  initRoom,
  destroyRoom,
  switchCurrentFile,
  addNewFile,
  saveBackToGist,
  removeFile,
  renameFile,
} from 'Client/room/types';
import { Plus, TriangleDown, Delete } from 'baseui/icon';
import { Popover, StatefulPopover } from 'baseui/popover';
import { StatefulMenu, ItemT } from 'baseui/menu';
import { Input } from 'baseui/input';
import { RenameFileModal } from './RenameFileModal';

const ControlPanel = styled('div', { display: 'flex', justifyContent: 'space-between', padding: '.5em' });
const RightButtonGroup = styled('span', { display: 'flex', justifyContent: 'flex-end', alignItems: 'center' });

const circle = (
  <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
  </svg>
);

class Test {
  testMethod() {}
}

export function Room() {
  const [css] = useStyletron();
  const { roomHashId } = useParams<{ roomHashId: string }>();
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const currentRoom = useSelector((s: rootState) => s.room.currentRoom);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [isRenameFileModalOpen, setisRenameFileModalOpen] = useState(false);

  useEffect(() => {
    if (roomHashId) {
      dispatch(initRoom(roomHashId, editorContainerRef as MutableRefObject<HTMLElement>, new Test()));
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
    <Tabs
      overrides={{
        Root: {
          style: {
            display: 'inline-block',
            width: 'max-content',
          },
        },
      }}
      onChange={(e) => {
        if (!currentRoom) {
          throw 'room data not set yet';
        }
        if (e.activeKey === addNewFileKey) {
          dispatch(addNewFile());
        } else if (e.activeKey !== currentRoom.currentTabId) {
          dispatch(switchCurrentFile(e.activeKey.toString()));
        }
      }}
      activeKey={currentRoom?.currentTabId}
    >
      {tabArr}
      <Tab key={addNewFileKey} title={<Plus />} />
    </Tabs>
  );

  return (
    <span
      className={css({
        display: 'grid',
        gridTemplateRows: '4em',
        height: '100%',
      })}
    >
      <ControlPanel>
        <span>
          <StatefulPopover
            placement={'bottomRight'}
            content={
              <StatefulMenu
                items={tabMenuItems}
                onItemSelect={(i) => {
                  console.log('selcted item: ', i);

                  dispatch(switchCurrentFile(i.item.key));
                }}
              />
            }
          >
            <Button kind="minimal">
              <TriangleDown />
            </Button>
          </StatefulPopover>
          {currentRoom?.fileDetailsStates ? tabsElement : 'loading...'}
        </span>
        <RightButtonGroup>
          <StatefulPopover
            placement={'bottomLeft'}
            content={
              <StatefulMenu
                onItemSelect={(i) => {
                  switch (i.item.key) {
                    case 'saveBackToGist':
                      dispatch(saveBackToGist());
                    case 'renameFile':
                      setisRenameFileModalOpen(true);
                  }
                }}
                items={actionItems}
              />
            }
          >
            <Button
              overrides={{
                Root: { style: { height: '30px', paddingLeft: '2px' } },
                StartEnhancer: { style: { marginRight: '0' } },
              }}
              kind={'secondary'}
              size={'mini'}
              shape={'pill'}
              startEnhancer={() => <TriangleDown size={24} />}
            >
              Actions
            </Button>
          </StatefulPopover>
        </RightButtonGroup>
      </ControlPanel>
      <div
        className={css({
          height: 'calc(100vh - (4em + 72px + 33px))',
          width: '100vw',
          display: currentRoom ? 'block' : 'hidden',
        })}
        id="monaco-editor-container"
        ref={editorContainerRef}
      />
      <RenameFileModal
        tabId={currentRoom?.currentTabId}
        isOpen={isRenameFileModalOpen}
        closeModal={() => setisRenameFileModalOpen(false)}
      />
    </span>
  );
}

export function getOverrideProps<T>(override: Override<T>) {
  if (override && typeof override === 'object') {
    if (typeof override.props === 'object') {
      return {
        ...override.props,
        $style: override.style,
      };
    } else {
      return {
        $style: override.style,
      };
    }
  }
  return {};
}

export function getOverride(override: Override<any>): any {
  // if (isValidElementType(override)) {
  //   return override;
  // }

  if (override && typeof override === 'object') {
    return override.component;
  }

  // null/undefined
  return override;
}

export function getOverrides(
  override: any,
  defaultComponent: React.ComponentType<any>,
): [React.ComponentType<any>, {}] {
  const Component = getOverride(override) || defaultComponent;

  if (override && typeof override === 'object' && typeof override.props === 'function') {
    const DynamicOverride = React.forwardRef((props, ref) => {
      const mappedProps = override.props(props);
      const nextProps = getOverrideProps({ ...override, props: mappedProps });
      return <Component ref={ref} {...nextProps} />;
    });
    DynamicOverride.displayName = Component.displayName;
    return [DynamicOverride, {}];
  }

  const props = getOverrideProps(override);
  return [Component, props];
}

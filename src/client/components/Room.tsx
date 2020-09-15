import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState, MutableRefObject } from 'react';
// import { CodemirrorBinding } from 'y-codemirror';
import { useSelector, useDispatch } from 'react-redux';
import { rootState } from 'Client/store';
import { useStyletron, styled } from 'styletron-react';
import { Button } from 'baseui/button';
import { Override } from 'baseui/overrides';
import { Tabs, Tab, FILL, TabsOverrides, StyledRoot } from 'baseui/tabs-motion';
import { initRoom, destroyRoom, switchCurrentFile, addNewFile, saveBackToGist } from 'Client/room/types';
import { Plus, TriangleDown, Delete } from 'baseui/icon';
import { Popover, StatefulPopover } from 'baseui/popover';
import { StatefulMenu, ItemT } from 'baseui/menu';

const ControlPanel = styled('div', { display: 'flex', justifyContent: 'space-between' });
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
  const { roomHashId } = useParams();
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const roomData = useSelector((s: rootState) => s.room.room);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const isLoading = !roomData;

  useEffect(() => {
    dispatch(initRoom(roomHashId, editorContainerRef as MutableRefObject<HTMLElement>, new Test()));
    return () => {
      dispatch(destroyRoom());
    };
  }, []);

  const tabs = roomData?.filenames.map((n) => (
    <Tab
      overrides={{
        Tab: {
          style: {
            width: '110px',
            display: 'flex',
            // padding: '5px',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignContent: 'center',
          },
        },
      }}
      key={n}
      title={
        <>
          {circle}
          {n}
          <Delete
            overrides={{
              Svg: {
                style: {
                  ':hover': {
                    backgroundColor: '#c4c4c4',
                    color: '#000000',
                  },
                  backgroundColor: 'transparent',
                  color: '#c4c4c4',
                  alignSelf: 'start',
                  justifySelf: 'flex-end',
                  padding: '.2px',
                  borderRadius: '50%',
                },
              },
            }}
          />
        </>
      }
    />
  ));

  // obfuscate key for addNewFile with the room hash to avoid potential duplicate keys
  const addNewFileKey = `${roomHashId}-add-new-file`;
  const actionItems: ItemT[] = [
    { label: 'save back to gist', onClick: () => alert('save'), key: 'saveBackToGist' },
    { label: 'action2' },
  ];

  // if (!roomData) {
  //   return <span>loading...</span>;
  // }

  return (
    <span>
      <ControlPanel>
        <Tabs
          overrides={{
            Root: {
              style: {
                display: 'inline-block',
              },
            },
          }}
          onChange={(e) => {
            if (!roomData) {
              throw 'room data not set yet';
            }
            if (e.activeKey === addNewFileKey) {
              dispatch(addNewFile());
            } else if (e.activeKey !== roomData.currentFilename) {
              dispatch(switchCurrentFile(e.activeKey.toString()));
            }
          }}
          activeKey={roomData?.currentFilename}
        >
          {tabs}
          <Tab key={addNewFileKey} title={<Plus />} />
        </Tabs>
        <RightButtonGroup>
          <StatefulPopover
            placement={'bottomLeft'}
            content={
              <StatefulMenu
                onItemSelect={(i) => {
                  switch (i.item.key) {
                    case 'saveBackToGist':
                      dispatch(saveBackToGist());
                  }
                }}
                items={actionItems}
              />
            }
          >
            <Button
              overrides={{ Root: { style: { height: '40px' } } }}
              kind={'secondary'}
              shape={'pill'}
              startEnhancer={() => <TriangleDown size={24} />}
            >
              Actions
            </Button>
          </StatefulPopover>
        </RightButtonGroup>
      </ControlPanel>
      <div className={css({ height: '500px' })} id="monaco-editor-container" ref={editorContainerRef} />;
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

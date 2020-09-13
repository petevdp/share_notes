import { useParams } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
// import { CodemirrorBinding } from 'y-codemirror';
import { useSelector, useDispatch } from 'react-redux';
import { rootState } from 'Client/store';
import { useStyletron } from 'styletron-react';
import { Button } from 'baseui/button';
import { Override } from 'baseui/overrides';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { initRoom, destroyRoom, switchCurrentFile, addNewFile, saveBackToGist } from 'Client/room/types';

export function Room() {
  const [css] = useStyletron();
  const { roomHashId } = useParams();
  const dispatch = useDispatch();
  const roomData = useSelector((s: rootState) => s.room.room);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(initRoom(roomHashId, editorContainerRef));
    return () => dispatch(destroyRoom());
  }, []);

  return (
    <span>
      <div>
        <Tabs
          onChange={(e) =>
            e.activeKey !== roomData.currentFilename && dispatch(switchCurrentFile(e.activeKey.toString()))
          }
          activeKey={roomData?.currentFilename}
        >
          {roomData?.filenames.map((n) => (
            <Tab key={n} title={n} />
          ))}
        </Tabs>
        <Button kind={'secondary'} onClick={() => dispatch(addNewFile())}>
          Add
        </Button>
        <Button onClick={() => saveBackToGist()}>Save back to Gist</Button>
      </div>
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

import { useStyletron } from 'baseui';
import { provisionTab, unprovisionTab } from 'Client/room/types';
import { rootState } from 'Client/store';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function TabContent() {
  const currentRoom = useSelector((s: rootState) => s.room.currentRoom);

  if (!currentRoom?.roomSharedState.fileDetailsStates) {
    return <div>empty</div>;
  }

  const contentArr = currentRoom.loadedTabs.map((tabId) => (
    <EditorTab key={tabId} tabId={tabId} visible={currentRoom.currentTabId === tabId} />
  ));

  return <div>{contentArr}</div>;
}

function EditorTab({ tabId, visible }: { tabId: string; visible: boolean }) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const vimStatusBarRef = useRef<HTMLDivElement | null>(null);
  const [css] = useStyletron();
  const dispatch = useDispatch();
  const fileDetailsPresent = useSelector(
    (state: rootState) => !!state.room.currentRoom?.roomSharedState.fileDetailsStates,
  );
  useEffect(() => {
    if (editorContainerRef.current && vimStatusBarRef.current) {
      dispatch(provisionTab(tabId, editorContainerRef.current, vimStatusBarRef.current));
    }
    return () => {
      console.log('unprovisioning');
      dispatch(unprovisionTab(tabId));
    };
  }, [tabId, editorContainerRef, fileDetailsPresent]);
  return (
    <div className={css({ display: visible ? 'block' : 'none' })}>
      <div
        ref={editorContainerRef}
        className={css({
          margin: '2px',
          height: 'calc(100vh - (160px)) !important',
          width: '100%',
          display: visible ? 'block' : 'none',
        })}
      />
      <div ref={vimStatusBarRef}></div>
    </div>
  );
}

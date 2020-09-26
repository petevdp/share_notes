import { useStyletron } from 'baseui';
import { provisionTab, unprovisionTab } from 'Client/room/types';
import { rootState } from 'Client/store';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function TabContent() {
  const currentRoom = useSelector((s: rootState) => s.room.currentRoom);

  if (!currentRoom?.fileDetailsStates) {
    return <div>empty</div>;
  }

  const contentArr = currentRoom.loadedTabs.map((tabId) => (
    <EditorTab key={tabId} tabId={tabId} visible={currentRoom.currentTabId === tabId} />
  ));

  return <div>{contentArr}</div>;
}

function EditorTab({ tabId, visible }: { tabId: string; visible: boolean }) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [css] = useStyletron();
  const dispatch = useDispatch();
  const fileDetailsPresent = useSelector((state: rootState) => !!state.room.currentRoom?.fileDetailsStates);
  useEffect(() => {
    if (editorContainerRef.current) {
      dispatch(provisionTab(tabId, editorContainerRef.current));
    }
    return () => {
      unprovisionTab(tabId);
    };
  }, [tabId, editorContainerRef, fileDetailsPresent]);
  return (
    <div
      ref={editorContainerRef}
      className={css({
        height: '100%',
        width: '100%',
        display: visible ? 'block' : 'none',
      })}
    />
  );
}

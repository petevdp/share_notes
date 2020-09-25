import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { provisionTab, unprovisionTab } from 'Client/room/types';
import { useStyletron } from 'baseui';
import { rootState } from 'Client/store';

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
  useEffect(() => {
    if (editorContainerRef.current) {
      dispatch(provisionTab(tabId, editorContainerRef.current));
    }
    return () => {
      unprovisionTab(tabId);
    };
  }, [tabId, editorContainerRef]);
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

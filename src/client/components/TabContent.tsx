import { useStyletron } from 'baseui';
import { StyledIconsContainer } from 'baseui/select';
import { provisionTab, unprovisionTab } from 'Client/slices/room/types';
import { settingsForCurrentEditorSelector, settingsSelector } from 'Client/slices/settings/types';
import { rootState } from 'Client/store';
import { some } from 'lodash';
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

const EDITOR_HEIGHT = 'calc(100vh - (165px))';

function EditorTab({ tabId, visible }: { tabId: string; visible: boolean }) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const vimStatusBarRef = useRef<HTMLDivElement | null>(null);
  const markdownPreviewRef = useRef<HTMLDivElement | null>(null);
  const diffViewerRef = useRef<HTMLDivElement | null>(null);
  const editorSettings = useSelector(settingsForCurrentEditorSelector);
  const settings = useSelector(settingsSelector);
  const [css, theme] = useStyletron();
  const dispatch = useDispatch();
  const fileDetailsPresent = useSelector(
    (state: rootState) => !!state.room.currentRoom?.roomSharedState.fileDetailsStates,
  );
  useEffect(() => {
    if (![editorContainerRef, vimStatusBarRef, markdownPreviewRef].some((ref) => !ref.current)) {
      dispatch(
        provisionTab({
          tabId,
          elements: {
            editor: editorContainerRef.current as HTMLElement,
            vimStatusBar: vimStatusBarRef.current as HTMLElement,
            markdownPreview: markdownPreviewRef.current as HTMLElement,
            diffViewer: diffViewerRef.current as HTMLElement,
          },
        }),
      );
    }
    return () => {
      dispatch(unprovisionTab(tabId));
    };
  }, [tabId, editorContainerRef, fileDetailsPresent]);
  return (
    <div className={css({ display: visible ? 'block' : 'none' })}>
      <span className={css({ width: '100%', display: 'flex', flexWrap: 'nowrap' })}>
        <div
          ref={editorContainerRef}
          className={css({
            margin: '2px',
            height: `${EDITOR_HEIGHT} !important`,
            width: editorSettings?.displayMode === 'markdownPreview' ? '50%' : '100%',
            display: editorSettings?.displayMode !== 'diffViewer' ? 'block' : 'none',
          })}
        />
        <div
          ref={markdownPreviewRef}
          className={
            css({
              width: '50%',
              height: EDITOR_HEIGHT,
              display: editorSettings?.displayMode === 'markdownPreview' ? 'block' : 'none',
              overflowY: 'scroll',
              whiteSpace: 'normal',
            }) +
            ' markdown-preview ' +
            settings.theme // we manually add styles to the html generated from the markup using this class
          }
        />
        <div
          ref={diffViewerRef}
          className={css({
            width: '100%',
            height: `${EDITOR_HEIGHT} !important`,
            display: editorSettings?.displayMode === 'diffViewer' ? 'block' : 'none',
          })}
        ></div>
      </span>
      <div ref={vimStatusBarRef}></div>
    </div>
  );
}

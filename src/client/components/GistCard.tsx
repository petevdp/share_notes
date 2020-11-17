import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { StatefulPopover } from 'baseui/popover';
import GithubIcon from 'Client/generatedSvgComponents/Github';
import { rootState } from 'Client/store';
import React, { ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { fileDetails, gistDetails } from 'Shared/githubTypes';
import { StyleObject } from 'styletron-react';

export function GistCard({ details, title }: { title?: ReactNode; details: gistDetails }) {
  const [css, theme] = useStyletron();
  return (
    <Card title={title}>
      <FormControl>
        <a href={details.html_url} target="_blank" rel="noreferrer">
          <GithubIcon height="20px" />
        </a>
      </FormControl>
      <FormControl label={() => 'Description'}>
        <div className={css({ backgroundColor: theme.colors.backgroundTertiary, padding: '5px' })}>
          {details.description || '(empty)'}
        </div>
      </FormControl>
      <FormControl label={() => 'Files'} caption="(hover to view file contents)">
        <span>
          {Object.entries(details.files).map(([filename, file]) => (
            <FileContentPreview key={filename} file={{ ...file, filename }} buttonStyle={{ marginRight: '4px' }} />
          ))}
        </span>
      </FormControl>
    </Card>
  );
}

function FileContentPreview({ file, buttonStyle }: { file: fileDetails; buttonStyle: StyleObject }) {
  const [retreivedContent, setRetreivedContent] = useState<undefined | string>();
  useEffect(() => {
    if (file.raw_url && !file.content) {
      fetch(file.raw_url)
        .then((res) => res.text())
        .then((content) => setRetreivedContent(content));
    }
  }, [file.raw_url, file.content]);
  const [css] = useStyletron();
  const themeSetting = useSelector((state: rootState) => state.settings.theme);
  return (
    <StatefulPopover
      triggerType="hover"
      placement="top"
      overrides={{ Body: { style: { zIndex: 4 } } }}
      key={file.filename as string}
      content={() => (
        <div className={css({ maxHeight: '60vh', overflowY: 'scroll' })}>
          <SyntaxHighlighter language={file.language?.toLowerCase()} style={themeSetting === 'dark' ? vscDarkPlus : vs}>
            {file.content || retreivedContent}
          </SyntaxHighlighter>
        </div>
      )}
    >
      <Button overrides={{ Root: { style: buttonStyle } }} kind="secondary" shape="pill" size="mini">
        {file.filename}
      </Button>
    </StatefulPopover>
  );
}

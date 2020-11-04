import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Card } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { StyledLink } from 'baseui/link';
import { StatefulPopover } from 'baseui/popover';
import { StyledSpinnerNext as Spinner } from 'baseui/spinner';
import { Tag } from 'baseui/tag';
import { StatefulTooltip, Tooltip } from 'baseui/tooltip';
import { Label3 } from 'baseui/typography';
import { rootState } from 'Client/store';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vsDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { fileDetails, gistDetails } from 'Shared/githubTypes';

import GithubIcon from './generatedSvgComponents/Github';

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
      <FormControl label={() => 'Files'}>
        <span>
          {Object.entries(details.files).map(([filename, file]) => (
            <FileContentPreview key={filename} file={{ ...file, filename }} />
          ))}
        </span>
      </FormControl>
    </Card>
  );
}

function FileContentPreview({ file }: { file: fileDetails }) {
  const [retreivedContent, setRetreivedContent] = useState<undefined | string>();
  useEffect(() => {
    if (file.raw_url && !file.content) {
      fetch(file.raw_url)
        .then((res) => res.text())
        .then((content) => setRetreivedContent(content));
    }
  }, [file.raw_url, file.content]);
  const [css] = useStyletron();
  const theme = useSelector((state: rootState) => state.settings.theme);
  console.log('file: ', file);
  return (
    <StatefulPopover
      triggerType="hover"
      placement="top"
      key={file.filename as string}
      content={() => (
        <SyntaxHighlighter language={file.language?.toLowerCase()} style={theme === 'dark' ? vscDarkPlus : vs}>
          {file.content || retreivedContent}
        </SyntaxHighlighter>
      )}
    >
      <Button kind="secondary" shape="pill" size="mini">
        {file.filename}
      </Button>
    </StatefulPopover>
  );
}

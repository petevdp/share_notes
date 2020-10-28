import { useStyletron } from 'baseui';
import { Card } from 'baseui/card';
import { FormControl } from 'baseui/form-control';
import { StyledLink } from 'baseui/link';
import { Tag } from 'baseui/tag';
import { Label3 } from 'baseui/typography';
import React, { ReactNode } from 'react';
import { gistDetails } from 'Shared/githubTypes';

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
          {Object.values(details.files).map((f) => (
            <Tag
              closeable={false}
              key={f.filename}
              overrides={{ Text: { style: { maxWidth: 'unset' } }, Root: { style: { marginTop: '0px' } } }}
            >
              {f.filename}
            </Tag>
          ))}
        </span>
      </FormControl>
    </Card>
  );
}

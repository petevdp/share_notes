import { useStyletron } from 'baseui';
import { Card } from 'baseui/card';
import { Tag } from 'baseui/tag';
import { Label1 } from 'baseui/typography';
import React, { ReactNode } from 'react';
import { gistDetails } from 'Shared/githubTypes';

export function GistCard({ details, title }: { title?: ReactNode; details: gistDetails }) {
  const [css, theme] = useStyletron();
  return (
    <Card title={title}>
      <div>
        <Label1>Description</Label1>
        <div className={css({ backgroundColor: theme.colors.backgroundTertiary, padding: '5px' })}>
          {details.description || '(empty)'}
        </div>
      </div>
      <div>
        <Label1>Files</Label1>
        {/* <ul> */}
        {Object.values(details.files).map((f) => (
          <Tag closeable={false} key={f.filename} overrides={{ Text: { style: { maxWidth: 'unset' } } }}>
            {f.filename}
          </Tag>
        ))}
        {/* </ul> */}
      </div>
    </Card>
  );
}

import { Checkbox } from 'baseui/checkbox';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import {
  createGistCreationFieldsActions,
  gistCreationFieldsWithComputed,
} from 'Client/slices/partials/gistCreationFields';
import React from 'react';
import { useDispatch } from 'react-redux';

export function GistCreationFields({
  fields: form,
  actionNamespace,
}: {
  fields: gistCreationFieldsWithComputed;
  actionNamespace: string;
}) {
  const dispatch = useDispatch();
  const { setGistName, setGistDescription, setIsGistPrivate } = createGistCreationFieldsActions(actionNamespace);
  return (
    <>
      <FormControl label="Starting Filename">
        <Input value={form.name} onChange={(e) => dispatch(setGistName(e.currentTarget.value))} />
      </FormControl>
      <FormControl label="Gist Description">
        <Input value={form.description} onChange={(e) => dispatch(setGistDescription(e.currentTarget.value))} />
      </FormControl>
      <Checkbox
        overrides={{
          Root: {
            style: {
              width: 'max-content',
            },
          },
        }}
        checked={form.isPrivate}
        onChange={(e) => {
          const checked = (event?.target as any).checked as boolean;
          dispatch(setIsGistPrivate(checked));
        }}
      >
        Private Gist
      </Checkbox>
    </>
  );
}

import { useStyletron } from 'baseui';
import { Card } from 'baseui/card';
import { Checkbox } from 'baseui/checkbox';
import { FormControl } from 'baseui/form-control';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Input } from 'baseui/input';
import { Option, Select } from 'baseui/select';
import { Tag } from 'baseui/tag';
import { Label1 } from 'baseui/typography';
import {
  createGistImportFieldsActions,
  gistImportFieldsWithComputed,
  GistImportStatus,
} from 'Client/slices/partials/gistImportFields';
import React from 'react';
import { useDispatch } from 'react-redux';

import { GistCard } from './GistCard';

export function GistImportFields({
  fields,
  actionNamespace: sliceNamespace,
  gistSelectionOptions,
}: {
  fields: gistImportFieldsWithComputed;
  gistSelectionOptions: Option[];
  actionNamespace: string;
}) {
  const dispatch = useDispatch();
  const [css, theme] = useStyletron();

  const { setGistSelectionValue, setGistUrl, setIsForkCheckboxChecked } = createGistImportFieldsActions(sliceNamespace);

  return (
    <>
      <FormControl label={() => 'Your Gists'}>
        <Select
          options={gistSelectionOptions}
          value={fields.selectedGistValue}
          onChange={({ value }) => dispatch(setGistSelectionValue(value))}
          labelKey="label"
          valueKey="id"
          placeholder="Choose from owned Gists"
          maxDropdownHeight="300px"
          type={'search'}
        />
      </FormControl>
      <FormControl error={fields.errorMessage} label={'Gist Url'}>
        <Input
          value={fields.gistUrl}
          error={fields.status === GistImportStatus.Invalid}
          onChange={(e) => {
            dispatch(setGistUrl(e.currentTarget.value));
          }}
        />
      </FormControl>
      {fields.detailsForUrlAtGist && <GistCard details={fields.detailsForUrlAtGist} title="Selected Gist Details" />}
      {fields.status === GistImportStatus.UnownedGist && (
        <Checkbox
          overrides={{
            Root: {
              style: {
                width: 'max-content',
              },
            },
          }}
          checked={fields.shouldForkCheckboxChecked}
          onChange={() => {
            const checked = (event?.target as any).checked as boolean;
            dispatch(setIsForkCheckboxChecked(checked));
          }}
        >
          {"You don't own the currently selected gist. Fork Instead?"}
        </Checkbox>
      )}
    </>
  );
}

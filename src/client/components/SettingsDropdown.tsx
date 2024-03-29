import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { ButtonGroup } from 'baseui/button-group';
import { Checkbox } from 'baseui/checkbox';
import { ListItem } from 'baseui/list';
import { ItemT, Menu, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { Select, StatefulSelect } from 'baseui/select';
import SvgSettings from 'Client/generatedSvgComponents/Settings';
import {
  globalEditorSetting,
  globalEditorSettings,
  settingsActions,
  settingsSelector,
} from 'Client/slices/settings/types';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React, { forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ControlPanelButton } from './Room';
import { getTabButtonOverrides } from './Tabs';

interface globalSettingsItem<K extends keyof globalEditorSettings> extends ItemT {
  label: string;
  key: K;
  type:
    | {
        typeName: 'select';
        options: { key: globalEditorSettings[K]; label?: string }[];
      }
    | {
        typeName: 'numericSelect';
        options: number[];
      }
    | {
        typeName: 'toggle';
      };
}

export function GlobalSettingsDropdown() {
  const [_, theme] = useStyletron();

  const globalSettingItems = (() => {
    // const keymap: globalSettingsItem<'keyMap'> = {
    //   label: 'Keybindings',
    //   key: 'keyMap',
    //   type: {
    //     typeName: 'select',
    //     options: [{ key: 'regular' }],
    //   },
    // };
    const smartIndent: globalSettingsItem<'autoIndent'> = {
      label: 'Auto Indent',
      key: 'autoIndent',
      type: {
        typeName: 'toggle',
      },
    };

    const lineWrapping: globalSettingsItem<'lineWrapping'> = {
      label: 'Line Wrap',
      key: 'lineWrapping',
      type: {
        typeName: 'toggle',
      },
    };

    const tabSize: globalSettingsItem<'tabSize'> = {
      label: 'Tab Size',
      key: 'tabSize',
      type: {
        typeName: 'numericSelect',
        options: [2, 3, 4, 5],
      },
    };

    const minimap: globalSettingsItem<'minimap'> = {
      label: 'Minimap',
      key: 'minimap',
      type: {
        typeName: 'toggle',
      },
    };

    const intellisense: globalSettingsItem<'intellisense'> = {
      label: 'Auto Suggestions',
      key: 'intellisense',
      type: {
        typeName: 'toggle',
      },
    };

    const lineNumbers: globalSettingsItem<'lineNumbers'> = {
      label: 'Line Numbers',
      key: 'lineNumbers',
      type: {
        typeName: 'select',
        options: [{ key: 'on' }, { key: 'off' }, { key: 'relative' }],
      },
    };

    return [tabSize, /* keymap, */ lineWrapping, smartIndent, minimap, intellisense, lineNumbers];
  })();

  return (
    <StatefulPopover
      overrides={RoomPopoverZIndexOverride}
      placement="bottom"
      content={() => (
        <Menu
          items={globalSettingItems}
          overrides={{
            List: {
              style: {
                backgroundColor: theme.colors.backgroundPrimary,
              },
            },
            Option: {
              props: {
                overrides: {
                  ListItem: SettingsListItem,
                },
              },
            },
          }}
        />
      )}
    >
      <Button overrides={getTabButtonOverrides()} kind="tertiary" shape="round" size="compact">
        <SvgSettings fill={theme.colors.contentPrimary} />
      </Button>
    </StatefulPopover>
  );
}

const SettingsListItem = (props: any) => {
  const dispatch = useDispatch();
  const settings = useSelector(settingsSelector);
  const [css, theme] = useStyletron();
  const item: globalSettingsItem<keyof globalEditorSettings> = props.item;
  const itemState = settings.globalEditor[item.key];
  let itemContent: React.ReactElement;
  switch (item.type.typeName) {
    case 'select': {
      itemContent = (
        <>
          <label className={css({ marginRight: '5px' })}>{item.label}</label>
          <ButtonGroup
            shape="pill"
            size="compact"
            selected={item.type.options.map((option) => option.key).indexOf(itemState)}
          >
            {item.type.options.map((option) => (
              <Button
                onClick={() => {
                  dispatch(
                    settingsActions.setGlobalEditorSetting({
                      key: item.key,
                      value: option.key,
                    }),
                  );
                }}
                key={option.key as string}
              >
                {option.label || option.key}
              </Button>
            ))}
          </ButtonGroup>
        </>
      );
      break;
    }
    case 'toggle': {
      itemContent = (
        <>
          <label>{item.label}</label>
          <Checkbox
            checked={itemState as boolean}
            onChange={(event) => {
              const checked = (event?.target as any).checked as boolean;
              dispatch(
                settingsActions.setGlobalEditorSetting({
                  key: item.key,
                  value: checked,
                } as globalEditorSetting),
              );
            }}
            checkmarkType="toggle_round"
          ></Checkbox>
        </>
      );
      break;
    }
    case 'numericSelect': {
      let options = item.type.options.map((option) => ({ id: option, label: option }));
      itemContent = (
        <>
          <label>{item.label}</label>
          <Select
            options={options}
            value={[{ id: itemState as string, label: itemState }]}
            valueKey="id"
            searchable={false}
            openOnClick={true}
            type="select"
            clearable={false}
            onChange={({ value }) =>
              dispatch(
                settingsActions.setGlobalEditorSetting({
                  key: item.key,
                  value: Number(value[0].id),
                }),
              )
            }
            overrides={{
              Root: {
                style: {
                  width: '75px',
                },
              },
              Popover: {
                props: {
                  overrides: {
                    Body: {
                      style: {
                        zIndex: 25,
                      },
                    },
                  },
                },
              },
            }}
          />
        </>
      );
      break;
    }
    default: {
      throw 'idk';
    }
  }
  return <ListItem overrides={{ Root: { style: { zIndex: 15 } } }}>{itemContent}</ListItem>;
};

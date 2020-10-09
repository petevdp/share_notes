import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { ButtonGroup } from 'baseui/button-group';
import { Checkbox } from 'baseui/checkbox';
import { ListItem } from 'baseui/list';
import { ItemT, Menu, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { Select, StatefulSelect } from 'baseui/select';
import { globalEditorSettings, settingsActions, settingsSelector } from 'Client/settings/types';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface globalSettingsItem<K extends keyof globalEditorSettings> extends ItemT {
  label: string;
  key: K;
  type:
    | {
        typeName: 'select';
        options: globalEditorSettings[K][];
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
  const dispatch = useDispatch();
  const settings = useSelector(settingsSelector);
  const [css, theme] = useStyletron();

  const globalSettingItems = (() => {
    const keymap: globalSettingsItem<'keyMap'> = {
      label: 'Keybindings',
      key: 'keyMap',
      type: {
        typeName: 'select',
        options: ['sublime', 'vim', 'emacs'],
      },
    };
    const indentWithTabs: globalSettingsItem<'indentWithTabs'> = {
      label: 'Indent With Tabs',
      key: 'indentWithTabs',
      type: {
        typeName: 'toggle',
      },
    };

    const smartIndent: globalSettingsItem<'smartIndent'> = {
      label: 'Smart Indent',
      key: 'smartIndent',
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

    const indentUnit: globalSettingsItem<'indentUnit'> = {
      label: 'Spaces Per Tab',
      key: 'indentUnit',
      type: {
        typeName: 'numericSelect',
        options: [2, 3, 4, 5],
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

    return [keymap, lineWrapping, indentWithTabs, smartIndent, tabSize];
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
                  ListItem: {
                    component: (props: any) => {
                      const item: globalSettingsItem<keyof globalEditorSettings> = props.item;
                      const itemState = settings.globalEditor[item.key];
                      let itemContent: React.ReactElement;
                      switch (item.type.typeName) {
                        case 'select': {
                          if (item.type.typeName !== 'select') {
                            throw 'incorrect item type for setting';
                          }

                          itemContent = (
                            <>
                              <label className={css({ marginRight: '5px' })}>{item.label}</label>
                              <ButtonGroup shape="pill" size="compact" selected={item.type.options.indexOf(itemState)}>
                                {item.type.options.map((option) => (
                                  <Button
                                    onClick={() => {
                                      dispatch(
                                        settingsActions.setGlobalEditorSetting({ key: item.key, value: option }),
                                      );
                                    }}
                                    key={option as string}
                                  >
                                    {option}
                                  </Button>
                                ))}
                              </ButtonGroup>
                            </>
                          );
                          break;
                        }
                        case 'toggle': {
                          if (item.type.typeName !== 'toggle') {
                            throw 'incorrect item type for setting';
                          }
                          itemContent = (
                            <>
                              <label>{item.label}</label>
                              <Checkbox
                                checked={itemState as boolean}
                                onChange={() => {
                                  const checked = (event?.target as any).checked as boolean;
                                  dispatch(settingsActions.setGlobalEditorSetting({ key: item.key, value: checked }));
                                }}
                                checkmarkType="toggle_round"
                              ></Checkbox>
                            </>
                          );
                          break;
                        }
                        case 'numericSelect': {
                          console.log('item state: ', itemState);
                          if (item.type.typeName !== 'numericSelect') {
                            throw 'incorrect item type for setting';
                          }

                          itemContent = (
                            <>
                              <label>{item.label}</label>
                              <Select
                                options={item.type.options.map((option) => ({ id: option, label: option }))}
                                value={[{ id: itemState as string, label: itemState }]}
                                valueKey="id"
                                searchable={false}
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
                                            zIndex: 4,
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
                    },
                  },
                },
              },
            },
          }}
        />
      )}
    >
      <Button>Settings</Button>
    </StatefulPopover>
  );
}

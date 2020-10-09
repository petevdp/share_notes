import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { ButtonGroup } from 'baseui/button-group';
import { Checkbox } from 'baseui/checkbox';
import { ListItem } from 'baseui/list';
import { ItemT, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
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
        typeName: 'toggle';
      };
}

export function GlobalSettingsDropdown() {
  const dispatch = useDispatch();
  const settings = useSelector(settingsSelector);

  const keymapSettingsItem: globalSettingsItem<'keyMap'> = {
    label: 'Keybindings',
    key: 'keyMap',
    type: {
      typeName: 'select',
      options: ['sublime', 'vim', 'emacs'],
    },
  };

  const smartIndentSettingsItem: globalSettingsItem<'smartIndent'> = {
    label: 'Smart Indent',
    key: 'smartIndent',
    type: {
      typeName: 'toggle',
    },
  };

  const [css, theme] = useStyletron();

  const items = [keymapSettingsItem, smartIndentSettingsItem];

  return (
    <StatefulPopover
      overrides={RoomPopoverZIndexOverride}
      placement="bottom"
      content={() => (
        <StatefulMenu
          items={items}
          overrides={{
            List: {
              style: {
                backgroundColor: theme.colors.backgroundPrimary,
              },
            },
            Option: {
              // component: React.forwardRef((props: any, ref) => {
              //   return
              // })
              props: {
                // getChildMenu(item: globalSettingsItem<keyof globalEditorSettings>) {
                //   switch (item.type.typeName) {
                //     case 'select':
                //       const childItems = item.type.options.map((option) => ({ label: option }));
                //       return <StatefulMenu size="compact" items={childItems}/>
                //     default:
                //       return null;
                //   }
                overrides: {
                  ListItem: {
                    component: React.forwardRef((props: any, ref) => {
                      let itemContent: React.ReactElement;
                      switch ((props.item as globalSettingsItem<keyof globalEditorSettings>).key) {
                        case 'keyMap': {
                          const itemState = settings.globalEditor.keyMap;
                          const item: globalSettingsItem<'keyMap'> = props.item;
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
                                    key={option}
                                  >
                                    {option}
                                  </Button>
                                ))}
                              </ButtonGroup>
                            </>
                          );
                          break;
                        }
                        case 'smartIndent': {
                          const itemState = settings.globalEditor.smartIndent;
                          const item: globalSettingsItem<'smartIndent'> = props.item;
                          if (item.type.typeName !== 'toggle') {
                            throw 'incorrect item type for setting';
                          }
                          itemContent = (
                            <Checkbox
                              checked={itemState}
                              onChange={() => {
                                const checked = (event?.target as any).checked as boolean;
                                dispatch(settingsActions.setGlobalEditorSetting({ key: item.key, value: checked }));
                              }}
                              checkmarkType="toggle_round"
                            >
                              {item.label}
                            </Checkbox>
                          );
                          break;
                        }
                        default: {
                          throw 'idk';
                        }
                      }

                      return (
                        <ListItem ref={ref} overrides={{ Root: { style: {} } }}>
                          {itemContent}
                        </ListItem>
                      );
                    }),
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

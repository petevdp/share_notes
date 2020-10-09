import { Button } from 'baseui/button';
import { ButtonGroup } from 'baseui/button-group';
import { ChevronLeft } from 'baseui/icon';
import { ListItem, ListItemLabel, MenuAdapter } from 'baseui/list';
import { ItemT, Menu, StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import {
  getSettingsForEditor,
  globalEditorSetting,
  globalEditorSettings,
  settingsActions,
  settingsSelector,
} from 'Client/settings/types';
import { rootState } from 'Client/store';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface globalSettingsItem<K extends keyof globalEditorSettings> extends ItemT {
  label: string;
  key: K;
  type: {
    typeName: 'select';
    options: globalEditorSettings[K][];
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

  const items = [keymapSettingsItem];

  return (
    <StatefulPopover
      overrides={RoomPopoverZIndexOverride}
      placement="bottom"
      content={() => (
        <StatefulMenu
          items={items}
          overrides={{
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
                      const item: globalSettingsItem<'keyMap'> = props.item;
                      if (item.key === 'keyMap') {
                        return (
                          <ListItem overrides={{ Root: {} }}>
                            <ListItemLabel>{item.label}</ListItemLabel>
                            <ButtonGroup
                              shape="pill"
                              size="compact"
                              selected={item.type.options.indexOf(settings.globalEditor.keyMap)}
                            >
                              {item.type.options.map((option) => (
                                <Button
                                  onClick={() => {
                                    dispatch(settingsActions.setGlobalEditorSetting({ key: 'keyMap', value: option }));
                                  }}
                                  key={option}
                                >
                                  {option}
                                </Button>
                              ))}
                            </ButtonGroup>
                          </ListItem>
                        );
                      } else {
                        throw 'implement me';
                      }
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

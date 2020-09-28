import { useStyletron } from 'baseui';
import { Avatar } from 'baseui/avatar';
import { Button, ButtonProps } from 'baseui/button';
import { ChevronDown } from 'baseui/icon';
import { OptionProfile, StatefulMenu } from 'baseui/menu';
import { Popover, StatefulPopover } from 'baseui/popover';
import { StatefulTooltip, StatefulTooltipProps, Tooltip } from 'baseui/tooltip';
import { roomUsersAwarenessSelector } from 'Client/room/types';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React from 'react';
import { useSelector } from 'react-redux';

interface profileItem {
  title: string;
  subtitle?: string;
  body?: string;
  imgUrl?: string;
}

export function RoomMemberDisplay() {
  const [css, theme] = useStyletron();
  const usersAwareness = useSelector(roomUsersAwarenessSelector);

  if (!usersAwareness) {
    return null;
  }
  const items = usersAwareness.map((u) => ({
    title: u.name,
    key: u.clientID,
    color: u.color,
    imgUrl: u.avatarUrl,
    name: u.name,
  }));
  return (
    <StatefulPopover
      placement="bottom"
      overrides={RoomPopoverZIndexOverride}
      content={() => (
        <StatefulMenu
          items={items}
          overrides={{
            List: {
              style: {
                width: '250px',
              },
            },
            Option: {
              component: React.forwardRef(function RoomMembmerDisplayMenuOptionProfile(props, ref) {
                return <OptionProfile {...props} />;
              }),
              props: {
                getProfileItemLabels: ({ title, subtitle, body }: profileItem) => ({
                  title,
                  subtitle,
                  body,
                }),
                getProfileItemImg: (item: profileItem) => item.imgUrl,
                getProfileItemImgText: (item: profileItem) => item.title,
              },
            },
          }}
        />
      )}
    >
      <Button
        kind="secondary"
        shape="pill"
        endEnhancer={ChevronDown}
        overrides={{
          Root: {
            style: {
              paddingTop: '.25em',
              paddingBottom: '.25em',
              paddingLeft: '.3em',
              paddingRight: '.3em',
            },
          },
          EndEnhancer: {
            style: {
              marginLeft: '.25em',
            },
          },
        }}
      >
        {usersAwareness.map((u) => {
          return (
            <Avatar
              size={theme.sizing.scale800}
              key={u.clientID}
              name={u.name}
              src={u.avatarUrl}
              overrides={{ Root: { style: { backgroundColor: u.color } } }}
            />
          );
        })}
      </Button>
    </StatefulPopover>
  );
}

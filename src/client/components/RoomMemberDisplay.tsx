import { styled, useStyletron } from 'baseui';
import { Avatar } from 'baseui/avatar';
import { Button } from 'baseui/button';
import { ChevronDown } from 'baseui/icon';
import { ListItem, ListItemLabel } from 'baseui/list';
import { StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { expandBorderStyles } from 'baseui/styles';
import { roomUsersAwarenessDetailsSelector } from 'Client/room/types';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React from 'react';
import { useSelector } from 'react-redux';

interface profileItem {
  title: string;
  subtitle?: string;
  body?: string;
  imgUrl?: string;
  profileUrl?: string;
  color: string;
}

const ColorSwatch = styled('div', (props: any) => {
  return {
    width: props.$theme.sizing.scale300,
    height: props.$theme.sizing.scale300,
    marginRight: props.$theme.sizing.scale200,
    display: 'inline-block',
    backgroundColor: props.$color,
    verticalAlign: 'baseline',
    ...expandBorderStyles(props.$theme.borders.border400),
  };
});

export function RoomMemberDisplay() {
  const [, theme] = useStyletron();
  const usersAwareness = useSelector(roomUsersAwarenessDetailsSelector);

  if (!usersAwareness) {
    return null;
  }
  const items = usersAwareness.map((u) => ({
    title: u.name,
    key: u.userIdOrAnonID,
    color: u.color,
    profileUrl: u.profileUrl,
    imgUrl: u.avatarUrl,
    name: u.name,
    body: "hi I'm the body",
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
              component: React.forwardRef(function RoomMembmerDisplayMenuOptionProfile(props) {
                const item: profileItem = props.item;
                return (
                  <ListItem endEnhancer={() => <ColorSwatch $color={item.color} />}>
                    {item.profileUrl ? (
                      <a href={item.profileUrl} target="_blank" rel="noreferrer">
                        <Avatar src={item.imgUrl} name={item.title} />
                      </a>
                    ) : (
                      <Avatar src={item.imgUrl} name={item.title} />
                    )}
                    <ListItemLabel>{item.title}</ListItemLabel>
                  </ListItem>
                );
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
              key={u.userIdOrAnonID}
              name={u.name}
              src={u.avatarUrl}
              overrides={{ Root: { style: { padding: '1px' } } }}
            />
          );
        })}
      </Button>
    </StatefulPopover>
  );
}

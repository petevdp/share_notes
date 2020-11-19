import { styled, useStyletron } from 'baseui';
import { Avatar } from 'baseui/avatar';
import { Button } from 'baseui/button';
import { ChevronDown } from 'baseui/icon';
import { ListItem, ListItemLabel } from 'baseui/list';
import { StatefulMenu } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { expandBorderStyles } from 'baseui/styles';
import { currentRoomStateWithComputedSelector } from 'Client/slices/room/types';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React, { Ref } from 'react';
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
    backgroundColor: props.color,
    verticalAlign: 'baseline',
    ...expandBorderStyles(props.$theme.borders.border400),
  };
});

export function RoomMemberDisplay() {
  const [, theme] = useStyletron();
  const currentRoom = useSelector(currentRoomStateWithComputedSelector);

  if (!currentRoom || !currentRoom.awarenessWithComputed) {
    return null;
  }
  const items = [...currentRoom.awarenessWithComputed.entries()].map(([userId, u]) => ({
    title: u.roomMemberDetails.name,
    key: userId,
    color: u.color,
    profileUrl: u.roomMemberDetails.type === 'github' && u.roomMemberDetails.profileUrl,
    imgUrl: u.roomMemberDetails.type === 'github' && u.roomMemberDetails.avatarUrl,
    name: u.roomMemberDetails.name,
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
              component: React.forwardRef(function RoomMemberDisplayMenuOptionProfile(props, ref) {
                const item: profileItem = props.item;
                return (
                  <ListItem ref={ref as Ref<any>} endEnhancer={() => <ColorSwatch $color={item.color} />}>
                    {item.profileUrl ? (
                      <a href={item.profileUrl} target="_blank" rel="noreferrer">
                        <Avatar src={item.imgUrl} name={item.title} />
                      </a>
                    ) : (
                      <Avatar
                        src={item.imgUrl}
                        name={item.title}
                        overrides={{ Root: { style: { backgroundColor: item.color } } }}
                      />
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
        {[...currentRoom.awarenessWithComputed.entries()].map(([userId, u]) => {
          const overrides =
            u.roomMemberDetails.type === 'github'
              ? {
                  Root: {
                    style: {
                      padding: '4px',
                    },
                  },
                }
              : {
                  Root: {
                    style: {
                      padding: '4px',
                      backgroundColor: u.color,
                    },
                  },
                };

          return (
            <Avatar
              size={theme.sizing.scale800}
              key={u.roomMemberDetails.userIdOrAnonID}
              name={u.roomMemberDetails.name}
              src={u.roomMemberDetails.type === 'github' ? u.roomMemberDetails.avatarUrl : undefined}
              overrides={overrides}
            />
          );
        })}
      </Button>
    </StatefulPopover>
  );
}

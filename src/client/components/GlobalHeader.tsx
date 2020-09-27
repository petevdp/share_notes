import { styled, useStyletron, withStyle } from 'baseui';
import { UserNavItemT } from 'baseui/app-nav-bar';
import { Avatar } from 'baseui/avatar';
import { Button } from 'baseui/button';
import { ALIGN, HeaderNavigation, StyledNavigationItem, StyledNavigationList } from 'baseui/header-navigation';
import { ChevronDown } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { ItemT, StatefulMenu, StyledList, StyledListItem } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { LabelMedium } from 'baseui/typography';
import { roomCreationActions } from 'Client/roomCreation/types';
import { logOut } from 'Client/session/types';
import { settingsActions } from 'Client/settings/types';
import { rootState } from 'Client/store';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export const StyledUserMenuListItem = withStyle(StyledListItem, {
  paddingTop: '0',
  paddingBottom: '0',
  paddingRight: '0',
});

export const StyledUserProfileTileContainer = styled('div', ({ $theme }) => {
  return {
    boxSizing: 'border-box',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    paddingTop: $theme.sizing.scale600,
    paddingBottom: $theme.sizing.scale600,
  };
});

export const StyledUserProfilePictureContainer = styled('div', ({ $theme }) => {
  return {
    marginRight: $theme.sizing.scale600,
  };
});

export const StyledUserProfileInfoContainer = styled('div', () => {
  return {
    boxSizing: 'border-box',
    alignSelf: 'center',
  };
});

export function GlobalHeader() {
  const [css, theme] = useStyletron();
  const session = useSelector((state: rootState) => state.session);
  const currentRoomDetails = useSelector((state: rootState) => state.room.currentRoom?.roomDetails);
  const roomAwareness = useSelector((state: rootState) => state.room.currentRoom?.awareness);
  // const =
  const isLoggedIn = !!session.user;
  const dispatch = useDispatch();
  const [] = useState(false);
  const [] = useState(undefined as undefined | UserNavItemT);

  const githubLogin = session.user?.githubLogin;
  const avatarUrl = session.githubUserDetails?.avatarUrl;

  let userNav: ItemT[] = [
    { label: 'Log Out', key: 'logOut' },
    { label: `Toggle Night Mode`, key: 'toggleTheme' },
  ];

  const onUserNavItemSelect = (item: ItemT) => {
    console.log('item: ', item);

    switch (item.item.key) {
      case 'logOut':
        dispatch(logOut());
        break;
      case 'toggleTheme':
        dispatch(settingsActions.toggleTheme());
        break;
      case 'createNewRoom':
        dispatch(roomCreationActions.open());
        break;
    }
  };

  if (githubLogin) {
    const userProfileItem: ItemT = { key: 'userProfile', label: githubLogin };
    userNav = [...userNav, userProfileItem];
  }

  const containerStyles = css({
    boxSizing: 'border-box',
    width: '100vw',
    height: '72px',
  });

  return (
    <div className={containerStyles}>
      <HeaderNavigation
        overrides={{
          Root: {
            style: {
              paddingTop: '0px',
              paddingBottom: '0px',
              paddingLeft: '8px',
              paddingRight: '8px',
            },
          },
        }}
      >
        <StyledNavigationList $align={ALIGN.left}>
          <StyledLink $as={Link} to="/" overrides={{ Root: { style: { textDecoration: 'none' } } }}>
            <h1>Share Notes</h1>
          </StyledLink>
        </StyledNavigationList>
        <StyledNavigationList $align={ALIGN.center}>
          {roomAwareness && (
            <StyledNavigationItem>
              <Button kind="tertiary" shape="pill">
                {Object.entries(roomAwareness).map(([key, u]) => {
                  console.log('key: ', key);
                  console.log('value: ', u);
                  return (
                    <Avatar
                      size={theme.sizing.scale800}
                      key={key}
                      name={u.name}
                      overrides={{ Root: { style: { backgroundColor: u.color } } }}
                    />
                  );
                })}
              </Button>
            </StyledNavigationItem>
          )}
        </StyledNavigationList>
        <StyledNavigationList $align={ALIGN.right}>
          {isLoggedIn ? (
            <>
              <StyledNavigationItem>
                <Button kind="tertiary" onClick={() => dispatch(roomCreationActions.open())}>
                  Create New Room
                </Button>
              </StyledNavigationItem>
              <StyledNavigationItem>
                <StatefulPopover
                  placement={'bottom'}
                  content={() => (
                    <StatefulMenu
                      overrides={{
                        List: {
                          component: React.forwardRef(function UserMenu({ children, ...restProps }, ref) {
                            return (
                              <StyledList {...restProps} ref={ref}>
                                <StyledUserMenuListItem>
                                  <StyledUserProfileTileContainer>
                                    <StyledUserProfilePictureContainer>
                                      <Avatar name={githubLogin || ''} src={avatarUrl} size={'48px'} />
                                    </StyledUserProfilePictureContainer>
                                    <StyledUserProfileInfoContainer>
                                      <LabelMedium>{githubLogin}</LabelMedium>
                                    </StyledUserProfileInfoContainer>
                                  </StyledUserProfileTileContainer>
                                </StyledUserMenuListItem>
                                {children}
                              </StyledList>
                            );
                          }),
                        },
                      }}
                      onItemSelect={onUserNavItemSelect}
                      items={userNav}
                    />
                  )}
                >
                  <Button
                    kind="tertiary"
                    shape="pill"
                    endEnhancer={ChevronDown}
                    overrides={{
                      Root: {
                        style: {
                          paddingLeft: '7px',
                          paddingRight: '7px',
                          paddingTop: '5px',
                          paddingBottom: '5px',
                        },
                      },
                    }}
                  >
                    <Avatar name={'Current User Github Profile'} src={avatarUrl} />
                  </Button>
                </StatefulPopover>
              </StyledNavigationItem>
            </>
          ) : (
            <StyledNavigationItem>
              <Button shape="pill">Log In</Button>
            </StyledNavigationItem>
          )}
        </StyledNavigationList>
      </HeaderNavigation>
    </div>
  );
}

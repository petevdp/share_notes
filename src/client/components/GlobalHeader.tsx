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
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AUTH_REDIRECT_URL, GITHUB_0AUTH_URL, GITHUB_CLIENT_ID } from 'Shared/environment';

import { RoomMemberDisplay } from './RoomMemberDisplay';

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

function loginWithGithub() {
  const url = new URL(GITHUB_0AUTH_URL);
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_url', AUTH_REDIRECT_URL);
  url.searchParams.set('scope', 'gist,read:user');
  window.location.href = url.toString();
  return;
}

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
    switch (item.item.key) {
      case 'logOut':
        dispatch(logOut());
        break;
      case 'toggleTheme':
        dispatch(settingsActions.toggleTheme());
        break;
    }
  };

  if (githubLogin) {
    const userProfileItem: ItemT = { key: 'userProfile', label: githubLogin };
    userNav = [...userNav, userProfileItem];
  }

  const containerStyles = css({
    boxSizing: 'border-box',
    width: '100%',
    height: '72px',
  });

  return (
    <div className={containerStyles}>
      <HeaderNavigation
        overrides={{
          Root: {
            style: {
              backgroundColor: theme.colors.backgroundPrimary,
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
              <RoomMemberDisplay />
            </StyledNavigationItem>
          )}
        </StyledNavigationList>
        <StyledNavigationList $align={ALIGN.right}>
          {isLoggedIn ? (
            <>
              <StyledNavigationItem>
                <StyledLink $as={Link} to="/rooms/create">
                  Create New Room
                </StyledLink>
              </StyledNavigationItem>
              <StyledNavigationItem>
                <StatefulPopover
                  placement={'bottom'}
                  overrides={RoomPopoverZIndexOverride}
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
              <Button shape="pill" onClick={() => loginWithGithub()}>
                Log In
              </Button>
            </StyledNavigationItem>
          )}
        </StyledNavigationList>
      </HeaderNavigation>
    </div>
  );
}

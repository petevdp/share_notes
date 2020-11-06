import { styled, useStyletron, withStyle } from 'baseui';
import { UserNavItemT } from 'baseui/app-nav-bar';
import { Avatar } from 'baseui/avatar';
import { Breadcrumbs } from 'baseui/breadcrumbs';
import { Button } from 'baseui/button';
import { ALIGN, HeaderNavigation, StyledNavigationItem, StyledNavigationList } from 'baseui/header-navigation';
import { ChevronDown } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { ItemT, StatefulMenu, StyledList, StyledListItem } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { LabelMedium } from 'baseui/typography';
import SvgGithub from 'Client/components/generatedSvgComponents/Github';
import { loginWithGithub } from 'Client/slices/session/epics';
import { loggedInStatusSelector, LoginStatus, logOut } from 'Client/slices/session/types';
import { settingsActions } from 'Client/slices/settings/types';
import { rootState } from 'Client/store';
import { RoomPopoverZIndexOverride } from 'Client/utils/basewebUtils';
import { log } from 'console';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { AUTH_REDIRECT_URL, GITHUB_0AUTH_URL, GITHUB_CLIENT_ID } from 'Shared/environment';

import { RoomMemberDisplay } from './RoomMemberDisplay';

export const StyledUserMenuListItem = withStyle(StyledListItem, {
  paddingTop: '0',
  paddingBottom: '0',
  paddingRight: '0',
});

export const BrandLink = withStyle(StyledLink, {
  fontWeight: 'bold',
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
  const location = useLocation();
  const currentRoomDetails = useSelector((state: rootState) => state.room.currentRoom?.roomDetails);
  const roomAwareness = useSelector((state: rootState) => state.room.currentRoom?.awareness);
  const currentUser = useSelector((state: rootState) => state.currentUserDetails);
  const themeSetting = useSelector((state: rootState) => state.settings.theme);
  const loginStatus = useSelector(loggedInStatusSelector);
  const dispatch = useDispatch();
  const [] = useState(false);
  const [] = useState(undefined as undefined | UserNavItemT);

  const githubLogin = currentUser.userDetails?.githubLogin;
  const avatarUrl = currentUser.githubUserDetails?.avatarUrl;

  let userNav: ItemT[] = [
    { label: 'Log Out', key: 'logOut' },
    { label: themeSetting === 'dark' ? `Toggle Light Mode` : 'Toggle Dark Mode', key: 'toggleTheme' },
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

  const containerStyles = css({
    boxSizing: 'border-box',
    width: '100%',
    height: 'min-content',
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
        <Breadcrumbs
          overrides={{
            Root: {
              style: {
                display: 'flex',
                alignItems: 'center',
              },
            },
            List: {
              style: {
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
              },
            },
            ListItem: {
              style: {
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
              },
            },
          }}
        >
          <BrandLink $as={Link} to="/">
            Share Notes
          </BrandLink>
          {currentRoomDetails && <span>{currentRoomDetails.name}</span>}
          {location.pathname === '/rooms/new' && <span>New Room</span>}
        </Breadcrumbs>
        <StyledNavigationList $align={ALIGN.center}>
          {roomAwareness && (
            <StyledNavigationItem>
              <RoomMemberDisplay />
            </StyledNavigationItem>
          )}
        </StyledNavigationList>
        <StyledNavigationList $align={ALIGN.right}>
          {loginStatus === LoginStatus.LoggedIn && currentUser.userDetails ? (
            <>
              <StyledNavigationItem>
                <StyledLink $as={Link} to="/rooms/new">
                  Create Room
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
                                      <Avatar
                                        name={githubLogin || ''}
                                        src={avatarUrl}
                                        size={'48px'}
                                        overrides={{ Root: { style: { backgroundColor: 'blue' } } }}
                                      />
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
                    <Avatar name={githubLogin || ''} src={avatarUrl} />
                  </Button>
                </StatefulPopover>
              </StyledNavigationItem>
            </>
          ) : (
            <StyledNavigationItem>
              <Button
                shape="pill"
                kind="tertiary"
                onClick={() => loginWithGithub()}
                startEnhancer={<SvgGithub height="20" />}
              >
                Log In
              </Button>
            </StyledNavigationItem>
          )}
        </StyledNavigationList>
      </HeaderNavigation>
    </div>
  );
}

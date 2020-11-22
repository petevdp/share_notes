import { Dispatch } from '@reduxjs/toolkit';
import { styled, useStyletron, withStyle } from 'baseui';
import { Avatar } from 'baseui/avatar';
import { Breadcrumbs } from 'baseui/breadcrumbs';
import { Button, ButtonProps } from 'baseui/button';
import { ALIGN, HeaderNavigation, StyledNavigationItem, StyledNavigationList } from 'baseui/header-navigation';
import { ChevronDown } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { ItemT, StatefulMenu, StyledList, StyledListItem } from 'baseui/menu';
import { StatefulPopover } from 'baseui/popover';
import { useSnackbar } from 'baseui/snackbar';
import { Theme } from 'baseui/theme';
import { StatefulTooltip } from 'baseui/tooltip';
import { LabelMedium } from 'baseui/typography';
import { ContentCopy } from 'Client/generatedSvgComponents';
import SvgGithub from 'Client/generatedSvgComponents/Github';
import { currentUser, githubUserDetails } from 'Client/slices/currentUserDetails/types';
import {
  copyToClipboard,
  currentRoomStateWithComputedSelector,
  doesCurrentRoomHaveAssociatedGistSelector,
} from 'Client/slices/room/types';
import { getLoginWithGithubHref, loginWithGithub } from 'Client/slices/session/epics';
import { loggedInStatusSelector, LoginStatus, logOut } from 'Client/slices/session/types';
import { settingsActions, theme } from 'Client/slices/settings/types';
import { rootState } from 'Client/store';
import { REGULAR_PAGE_FLOW_MAX_WIDTH } from 'Client/styleConstants';
import { BrandRouterLink, RoomPopoverZIndexOverride, StyledRouterLink } from 'Client/utils/basewebUtils';
import __merge from 'lodash/merge';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

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

const getGithubUrlIconNavButtonProps = (): ButtonProps => ({
  shape: 'round',
  kind: 'tertiary',
  overrides: {
    BaseButton: {
      style: {
        paddingTop: '7px',
        paddingBottom: '7px',
        paddingLeft: '7px',
        paddingRight: '7px',
      },
    },
  },
});

const getGithubUrlIconNavIconProps = (theme: Theme): React.SVGProps<SVGSVGElement> => ({
  fill: theme.colors.contentPrimary,
  height: theme.sizing.scale800,
});

export function GlobalHeader() {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentRoomDetails = useSelector((state: rootState) => state.room.currentRoom?.roomDetails);
  const currentRoom = useSelector(currentRoomStateWithComputedSelector);
  const roomAwareness = useSelector((state: rootState) => state.room.currentRoom?.awareness);
  const currentUser = useSelector((state: rootState) => state.currentUserDetails);
  const loginStatus = useSelector(loggedInStatusSelector);
  const doesCurrentRoomHaveAssociatedGist = useSelector(doesCurrentRoomHaveAssociatedGistSelector);
  const { enqueue: enqueueSnackbar } = useSnackbar();
  const [css, theme] = useStyletron();

  const containerStyles = css({
    boxSizing: 'border-box',
    width: '100vw',
    height: 'min-content',
    borderBottomColor: 'rgb(203, 203, 203)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
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
              borderBottomWidth: '0px',
              margin: 'auto',
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
          <BrandRouterLink to="/">Share Notes</BrandRouterLink>
          {location.pathname.startsWith('/rooms') && <StyledRouterLink to="/rooms">Rooms</StyledRouterLink>}
          {currentRoomDetails && <span>{currentRoomDetails.name}</span>}
          {location.pathname === '/rooms/new' && <span>New Room</span>}
        </Breadcrumbs>
        <StyledNavigationList $align={ALIGN.center}>
          {currentRoom && (
            <StyledNavigationItem>
              {doesCurrentRoomHaveAssociatedGist && (
                <StatefulTooltip
                  content={
                    "Open this room's gist" + currentRoom.gistDetails
                      ? ''
                      : " (disabled: this room doesn't have an associated gist)"
                  }
                >
                  <Button
                    {...getGithubUrlIconNavButtonProps()}
                    $as={'a'}
                    href={currentRoom?.gistDetails?.html_url}
                    target="_blank"
                    overrides={__merge(getGithubUrlIconNavButtonProps().overrides, {
                      BaseButton: { props: { rel: 'noopener noreferrer' } },
                    })}
                    disabled={!currentRoom?.gistDetails?.html_url}
                  >
                    <SvgGithub {...getGithubUrlIconNavIconProps(theme)} />
                  </Button>
                </StatefulTooltip>
              )}
              <StatefulTooltip content="Copy room url to clipboard">
                <Button
                  {...getGithubUrlIconNavButtonProps()}
                  onClick={() => currentRoom && dispatch(copyToClipboard(currentRoom.roomUrl, enqueueSnackbar))}
                >
                  <ContentCopy {...getGithubUrlIconNavIconProps(theme)} />
                </Button>
              </StatefulTooltip>
            </StyledNavigationItem>
          )}
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
                <StyledRouterLink to="/rooms/new">Create Room</StyledRouterLink>
              </StyledNavigationItem>
              <StyledNavigationItem>
                <RightSideDropdown />
              </StyledNavigationItem>
            </>
          ) : (
            <>
              <StyledNavigationItem>
                <Button
                  $as="a"
                  href={getLoginWithGithubHref()}
                  shape="pill"
                  kind="tertiary"
                  onClick={() => loginWithGithub()}
                  startEnhancer={<SvgGithub height="20" />}
                >
                  Log In
                </Button>
              </StyledNavigationItem>
              <StyledNavigationItem>
                <RightSideDropdown />
              </StyledNavigationItem>
            </>
          )}
        </StyledNavigationList>
      </HeaderNavigation>
    </div>
  );
}

function RightSideDropdown() {
  const currentUser = useSelector((state: rootState) => state.currentUserDetails);
  const themeSetting = useSelector((state: rootState) => state.settings.theme);

  return (
    <StatefulPopover
      placement={'bottom'}
      overrides={RoomPopoverZIndexOverride}
      content={() =>
        currentUser && currentUser.userDetails && currentUser.githubUserDetails ? (
          <LoggedInRightDropdownMenu
            currentUserDetails={currentUser.userDetails}
            githubUserDetails={currentUser.githubUserDetails}
            theme={themeSetting}
          />
        ) : (
          <LoggedOutRightDropdownMenu theme={themeSetting} />
        )
      }
    >
      {currentUser && currentUser.userDetails && currentUser.githubUserDetails ? (
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
          <Avatar name={currentUser.userDetails.githubLogin} src={currentUser.githubUserDetails.avatarUrl} />
        </Button>
      ) : (
        <Button kind="tertiary" shape="round">
          <ChevronDown />
        </Button>
      )}
    </StatefulPopover>
  );
}

const getToggleThemeMenuItem = (themeSetting: theme) => ({
  label: themeSetting === 'dark' ? `Toggle Light Mode` : 'Toggle Dark Mode',
  key: 'toggleTheme',
});

const getOnNavItemSelect = (dispatch: Dispatch<any>) => (item: ItemT) => {
  switch (item.item.key) {
    case 'logOut':
      dispatch(logOut());
      break;
    case 'toggleTheme':
      dispatch(settingsActions.toggleTheme());
      break;
  }
};

function LoggedInRightDropdownMenu({
  currentUserDetails: currentUserDetails,
  githubUserDetails: githubDetails,
  theme,
}: {
  currentUserDetails: currentUser;
  githubUserDetails: githubUserDetails;
  theme: theme;
}) {
  const dispatch = useDispatch();
  const loggedInNav: ItemT[] = [{ label: 'Log Out', key: 'logOut' }, getToggleThemeMenuItem(theme)];
  return (
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
                        name={currentUserDetails.githubLogin || ''}
                        src={githubDetails.avatarUrl}
                        size={'48px'}
                        overrides={{ Root: { style: { backgroundColor: 'blue' } } }}
                      />
                    </StyledUserProfilePictureContainer>
                    <StyledUserProfileInfoContainer>
                      <LabelMedium>{currentUserDetails.githubLogin}</LabelMedium>
                    </StyledUserProfileInfoContainer>
                  </StyledUserProfileTileContainer>
                </StyledUserMenuListItem>
                {children}
              </StyledList>
            );
          }),
        },
      }}
      onItemSelect={getOnNavItemSelect(dispatch)}
      items={loggedInNav}
    />
  );
}

function LoggedOutRightDropdownMenu({ theme }: { theme: theme }) {
  const dispatch = useDispatch();
  return <StatefulMenu items={[getToggleThemeMenuItem(theme)]} onItemSelect={getOnNavItemSelect(dispatch)} />;
}

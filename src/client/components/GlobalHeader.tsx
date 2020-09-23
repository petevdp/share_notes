import React, { useState, useMemo } from 'react';
import { useStyletron, styled, withStyle } from 'baseui';
import { StyledLink } from 'baseui/link';
import { rootState } from 'Client/store';
import { Layer } from 'baseui/layer';
import { Delete, Plus, ArrowRight } from 'baseui/icon';
import { Unstable_AppNavBar as AppNavBar, UserNavItemT, MainNavItemT, AppNavBarPropsT } from 'baseui/app-nav-bar';
import { StyledNavItem } from 'baseui/side-navigation';
import { MenuAdapter, MenuAdapterPropsT } from 'baseui/list';
import {} from 'baseui/header-navigation';
import { Button as span, Button } from 'baseui/button';
import { Heading } from 'baseui/heading';
import { useSelector, useDispatch } from 'react-redux';
import { GITHUB_0AUTH_URL, GITHUB_CLIENT_ID, AUTH_REDIRECT_URL } from 'Shared/environment';
import { sessionSliceState, logOut, fetchCurrentUserData } from 'Client/session/types';
import { settingsSelector } from 'Client/settings/slice';
import { settingsActions } from 'Client/settings/types';
import { roomCreationActions } from 'Client/roomCreation/types';
import { Link } from 'react-router-dom';

function renderItem(item: any) {
  return item.label;
}
function isActive(arr: Array<any>, item: any, activeItem: any): boolean {
  let active = false;
  for (let i = 0; i < arr.length; i++) {
    const elm = arr[i];
    if (elm === item) {
      if (item === activeItem) return true;
      return isActive((item && item.nav) || [], activeItem, activeItem);
    } else if (elm.nav) {
      active = isActive(elm.nav || [], item, activeItem);
    }
  }
  return active;
}

interface avatarNavProps {
  userNav?: UserNavItemT[];
  username?: string;
  usernameSubtitle?: string;
  userImgUrl?: string;
}

export function GlobalHeader() {
  const [css, theme] = useStyletron();
  const session = useSelector((state: rootState) => state.session);
  const currentRoomDetails = useSelector((state: rootState) => state.room.currentRoom?.roomDetails);
  // const =
  const isLoggedIn = !!session.user;
  const dispatch = useDispatch();
  const [isNavBarVisible, setIsNavBarVisible] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState(undefined as undefined | UserNavItemT);

  const USER_NAV: UserNavItemT[] = [
    {
      item: { label: 'Log Out', key: 'logOut' },
      mapItemToNode: renderItem,
      mapItemToString: renderItem,
    },
    {
      item: { label: `Toggle Night Mode`, key: 'toggleTheme' },
      mapItemToNode: renderItem,
      mapItemToString: renderItem,
    },
  ];

  const githubLogin = session.user?.githubLogin;
  const avatarUrl = session.githubUserDetails?.avatarUrl;

  const { data: navProps } = React.useMemo(() => {
    let data: null | avatarNavProps;
    let loading = false;
    if (githubLogin && avatarUrl) {
      data = {
        userImgUrl: avatarUrl,
        username: githubLogin,
        userNav: USER_NAV,
      };
    } else {
      loading = true;
      data = null;
    }
    // const navProps = {
    //   userNav: USER_NAV,
    //   username: session.user?.githubLogin,
    //   usernameSubtitle: '5.0',
    //   userImgUrl: '',
    // };
    return { loading, data };
  }, [githubLogin, avatarUrl]);

  const loginWithGithub = () => {
    const url = new URL(GITHUB_0AUTH_URL);
    url.searchParams.set('client_id', GITHUB_CLIENT_ID);
    url.searchParams.set('redirect_url', AUTH_REDIRECT_URL);
    url.searchParams.set('scope', 'gist,read:user');
    window.location.href = url.toString();
    return;
  };

  const containerStyles = css({
    boxSizing: 'border-box',
    width: '100vw',
    height: '72px',
    // position: 'sticky',
    // top: '0',
    // left: '0',
  });
  const appDisplayName = (
    <>
      <Link
        to={'/'}
        className={css({
          textDecoration: 'none',
          color: 'inherit',
          ':hover': { color: 'inherit' },
          ':visited': { color: 'inherit' },
        })}
      >
        Share Notes
      </Link>
    </>
  );
  const renderLoginButton = () => <span onClick={() => loginWithGithub()}>Log In</span>;

  let mainNav: MainNavItemT[] = [];
  if (!isLoggedIn) {
    mainNav = [
      ...mainNav,
      {
        // 'Log In' is used as key to identify the item, please fix
        item: { label: 'Log In' },
        mapItemToNode: renderLoginButton,
        mapItemToString: (item: any) => item.label,
      },
    ];
  } else {
    mainNav = [
      ...mainNav,
      {
        icon: Plus,
        item: { label: 'Create New Room', key: 'createNewRoom' },
        mapItemToString: renderItem,
        mapItemToNode: renderItem,
      },
    ];
  }

  return (
    <div className={containerStyles}>
      <AppNavBar
        username={githubLogin}
        appDisplayName={appDisplayName}
        mainNav={mainNav}
        isNavItemActive={({ item }) => {
          return item === activeNavItem || isActive(mainNav, item, activeNavItem);
        }}
        onNavItemSelect={({ item }) => {
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
          console.log('nav item selected: ', item);
          // if (item === activeNavItem) return;
          // setActiveNavItem(item);
        }}
        {...(navProps || {})}
      />
    </div>
  );
}

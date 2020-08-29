import * as React from 'react';
import { useStyletron } from 'baseui';
import { StyledLink } from 'baseui/link';
import { rootState } from 'Client/store';
import { Layer } from 'baseui/layer';
import { ChevronDown, Delete, Overflow as UserIcon, Upload as Icon } from 'baseui/icon';
import { Unstable_AppNavBar as AppNavBar, POSITION, UserNavItemT, MainNavItemT } from 'baseui/app-nav-bar';
import {} from 'baseui/header-navigation';
import { Button } from 'baseui/button';
import { useSelector, useDispatch } from 'react-redux';
import { GITHUB_0AUTH_URL, GITHUB_CLIENT_ID, AUTH_REDIRECT_URL } from 'Shared/environment';

function renderItem(item: any) {
  return item.label;
}
const MAIN_NAV: MainNavItemT[] = [];
const USER_NAV = [
  {
    icon: UserIcon,
    item: { label: 'Account item1' },
    mapItemToNode: renderItem,
    mapItemToString: renderItem,
  },
  {
    icon: UserIcon,
    item: { label: 'Account item2' },
    mapItemToNode: renderItem,
    mapItemToString: renderItem,
  },
  {
    icon: UserIcon,
    item: { label: 'Account item3' },
    mapItemToNode: renderItem,
    mapItemToString: renderItem,
  },
  {
    icon: UserIcon,
    item: { label: 'Account item4' },
    mapItemToNode: renderItem,
    mapItemToString: renderItem,
  },
];
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
export function GlobalHeader() {
  const [css] = useStyletron();
  const isLoggedIn = useSelector((state: rootState) => !!state.session.token);
  const dispatch = useDispatch();
  const [isNavBarVisible, setIsNavBarVisible] = React.useState(false);
  const [activeNavItem, setActiveNavItem] = React.useState(undefined as undefined | UserNavItemT);

  const loginWithGithub = () => {
    const url = new URL(GITHUB_0AUTH_URL);
    console.log(AUTH_REDIRECT_URL);
    url.searchParams.set('client_id', GITHUB_CLIENT_ID);
    url.searchParams.set('redirect_url', AUTH_REDIRECT_URL);
    url.searchParams.set('scope', 'gist,read:user');
    console.log(url);
    window.location.href = url.toString();
    return;
  };
  const containerStyles = css({
    boxSizing: 'border-box',
    width: '100vw',
    position: 'fixed',
    top: '0',
    left: '0',
  });
  const appDisplayName = (
    <StyledLink
      $style={{
        textDecoration: 'none',
        color: 'inherit',
        ':hover': { color: 'inherit' },
        ':visited': { color: 'inherit' },
      }}
      href={'#'}
    >
      App Something
    </StyledLink>
  );

  const navProps = {
    userNav: USER_NAV,
    username: 'Umka Marshmallow',
    usernameSubtitle: '5.0',
    userImgUrl: '',
  };

  const renderLoginButton = () => <Button onClick={() => loginWithGithub()}>Log In</Button>;

  let mainNav = MAIN_NAV;
  if (!isLoggedIn) {
    mainNav = [
      ...mainNav,
      {
        icon: Icon,
        item: { label: '' },
        mapItemToNode: renderLoginButton,
        mapItemToString: () => 'idk',
      },
    ];
  }

  return (
    <Layer>
      <div className={containerStyles}>
        <AppNavBar
          appDisplayName={appDisplayName}
          mainNav={mainNav}
          isNavItemActive={({ item }) => {
            return item === activeNavItem || isActive(mainNav, item, activeNavItem);
          }}
          onNavItemSelect={({ item }) => {
            if (item === activeNavItem) return;
            setActiveNavItem(item);
          }}
          {...(isLoggedIn ? navProps : {})}
        >
          Does This Work
        </AppNavBar>
      </div>
    </Layer>
  );
}

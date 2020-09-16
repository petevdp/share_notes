import * as React from 'react';
import { useStyletron } from 'baseui';
import { StyledLink } from 'baseui/link';
import { rootState } from 'Client/store';
import { Layer } from 'baseui/layer';
import { Delete, Overflow as UserIcon, Upload as Icon } from 'baseui/icon';
import { Unstable_AppNavBar as AppNavBar, UserNavItemT, MainNavItemT, AppNavBarPropsT } from 'baseui/app-nav-bar';
import { MenuAdapter, MenuAdapterPropsT } from 'baseui/list';
import {} from 'baseui/header-navigation';
import { Button as span } from 'baseui/button';
import { useSelector, useDispatch } from 'react-redux';
import { GITHUB_0AUTH_URL, GITHUB_CLIENT_ID, AUTH_REDIRECT_URL } from 'Shared/environment';
import { sessionSliceState, logOut } from 'Client/session/types';

function renderItem(item: any) {
  return item.label;
}
const MAIN_NAV: MainNavItemT[] = [];
const USER_NAV: UserNavItemT[] = [
  {
    icon: UserIcon,
    item: { label: 'Log Out', onClick: () => alert('wow') },
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

interface avatarNavProps {
  userNav?: UserNavItemT[];
  username?: string;
  usernameSubtitle?: string;
  userImgUrl?: string;
}

export function GlobalHeader() {
  const [css] = useStyletron();
  const session = useSelector<rootState, sessionSliceState>((state: rootState) => state.session);
  const isLoggedIn = !!session.user;
  const dispatch = useDispatch();
  const [isNavBarVisible, setIsNavBarVisible] = React.useState(false);
  const [activeNavItem, setActiveNavItem] = React.useState(undefined as undefined | UserNavItemT);

  const githubLogin = session.user?.githubLogin;
  const avatarUrl = session.githubUserDetails?.avatarUrl;

  const { user, githubUserDetails } = session;

  const { loading: navPropsLoading, data: navProps } = React.useMemo(() => {
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
      Share Notes
    </StyledLink>
  );
  const renderLoginButton = () => <span onClick={() => loginWithGithub()}>Log In</span>;

  let mainNav = MAIN_NAV;
  if (!isLoggedIn) {
    mainNav = [
      ...mainNav,
      {
        icon: Icon,
        // 'Log In' is used as key to identify the item, please fix
        item: { label: 'Log In' },
        mapItemToNode: renderLoginButton,
        mapItemToString: (item) => item.label,
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
            if (item.item.label === 'Log Out') {
              dispatch(logOut());
            }
            console.log('nav item selected: ', item);
            // if (item === activeNavItem) return;
            // setActiveNavItem(item);
          }}
          {...(navProps || {})}
        >
          Does This Work
        </AppNavBar>
      </div>
    </Layer>
  );
}

import { useStyletron, withStyle } from 'baseui';
import { Button, ButtonProps } from 'baseui/button';
import { StyledLink } from 'baseui/link';
import { ModalOverrides } from 'baseui/modal';
import { Override } from 'baseui/overrides';
import { SnackbarElementPropsT } from 'baseui/snackbar';
import { StyledSpinnerNext as Spinner } from 'baseui/spinner';
import { BrandLink } from 'Client/components/GlobalHeader';
import React, { Props, ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
export type enqueueSnackbar = (elementProps: SnackbarElementPropsT, duration?: any) => any;
export function RouterLinkButton({
  to,
  children,
  buttonProps,
}: {
  to: string;
  children: ReactNode;
  buttonProps?: ButtonProps;
}) {
  const history = useHistory();
  const onClick = (e: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>): any => {
    e.preventDefault();
    history.push(to);
  };
  return (
    <Button $as="a" {...buttonProps} href={to} onClick={onClick}>
      {children}
    </Button>
  );
}

export function StyledRouterLink({ to, children }: { to: string; children: ReactNode }) {
  const history = useHistory();
  const [css, theme] = useStyletron();
  const onClick = (e: React.MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>): any => {
    e.preventDefault();
    history.push(to);
  };
  return (
    <StyledLink
      $as="a"
      href={to}
      onClick={onClick}
      className={css({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' })}
    >
      {children}
    </StyledLink>
  );
}

export function BrandRouterLink({ to, children }: { to: string; children: ReactNode }) {
  const history = useHistory();
  const onClick = (e: React.MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>): any => {
    e.preventDefault();
    history.push(to);
  };
  return (
    <BrandLink $as="a" href={to} onClick={onClick}>
      {children}
    </BrandLink>
  );
}

export function getOverrideProps<T>(override: Override<T>) {
  if (override && typeof override === 'object') {
    if (typeof override.props === 'object') {
      return {
        ...override.props,
        $style: override.style,
      };
    } else {
      return {
        $style: override.style,
      };
    }
  }
  return {};
}

export function getOverride(override: Override<any>): any {
  // if (isValidElementType(override)) {
  //   return override;
  // }

  if (override && typeof override === 'object') {
    return override.component;
  }

  // null/undefined
  return override;
}

export function getOverrides(
  override: any,
  defaultComponent: React.ComponentType<any>,
): [React.ComponentType<any>, any] {
  const Component = getOverride(override) || defaultComponent;

  if (override && typeof override === 'object' && typeof override.props === 'function') {
    const DynamicOverride = React.forwardRef((props, ref) => {
      const mappedProps = override.props(props);
      const nextProps = getOverrideProps({ ...override, props: mappedProps });
      return <Component ref={ref} {...nextProps} />;
    });
    DynamicOverride.displayName = Component.displayName;
    return [DynamicOverride, {}];
  }

  const props = getOverrideProps(override);
  return [Component, props];
}

export const RoomPopoverZIndexOverride = {
  Body: {
    style: {
      zIndex: 3,
    },
  },
};

export const RoomModalZIndexOverride: ModalOverrides = {
  Root: {
    style: {
      zIndex: 3,
    },
  },
};

const RestyledSpinner = withStyle(Spinner, { marginRight: '5px', height: '20px', width: '20px' });

export function SubmitButtonWithSpinner({
  children,
  disabled,
  loading,
}: {
  disabled: boolean;
  loading: boolean;
} & Props<unknown>) {
  return (
    <>
      {loading && <RestyledSpinner />}
      <Button disabled={disabled} type="submit">
        {children}
      </Button>
    </>
  );
}

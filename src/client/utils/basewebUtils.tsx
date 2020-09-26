import { Override } from 'baseui/overrides';
import React from 'react';

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

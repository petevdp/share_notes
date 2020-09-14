import * as React from 'react';
import { Button, ButtonProps } from 'baseui/button';
import { TriangleDown } from 'baseui/icon';
import { Popover } from 'baseui/popover';
import { StatefulMenu, ItemsT } from 'baseui/menu';

// This component is required because of the way that button-group works.
// The button group parent will decorate its children with additional props.
// In Dropdown, we ensure that those props get shuttled to the Button component
// rather than the wrapping StatefulPopover
const Dropdown = (props: { children: React.ReactNode; items: ItemsT; buttonProps: ButtonProps }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Popover
      isOpen={isOpen}
      onClick={() => setIsOpen((s) => !s)}
      content={<StatefulMenu items={props.items} onItemSelect={() => setIsOpen(false)} />}
    >
      <Button {...props.buttonProps} endEnhancer={() => <TriangleDown size={24} />}>
        {props.children}
      </Button>
    </Popover>
  );
};

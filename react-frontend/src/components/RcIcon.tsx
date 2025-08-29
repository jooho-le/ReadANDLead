import React from 'react';
import type { IconBaseProps, IconType } from 'react-icons';

// react-icons 아이콘을 JSX로 안전하게 감싸 주는 래퍼
export default function RcIcon(
  { icon, ...props }: { icon: IconType } & IconBaseProps
) {
  const Comp = icon as unknown as React.ComponentType<IconBaseProps>;
  return <Comp {...props} />;
}

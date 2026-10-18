import type { ElementType, ReactNode } from 'react';

export function Container({
  children,
  as: Tag = 'div',
  narrow = false,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  narrow?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={['container', narrow ? 'container--narrow' : '', className].filter(Boolean).join(' ')}
      style={narrow ? { maxWidth: 'var(--content-narrow)' } : undefined}
    >
      {children}
    </Tag>
  );
}

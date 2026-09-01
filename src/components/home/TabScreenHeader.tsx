import type { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
};

export function TabScreenHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-pixel text-xl leading-snug tracking-tighter text-[var(--foreground)]">
        {title}
      </h1>
      {action}
    </div>
  );
}

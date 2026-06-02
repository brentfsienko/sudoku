import type { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
};

export function TabScreenHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-serif-title text-[2.75rem] leading-none text-[var(--foreground)]">
        {title}
      </h1>
      {action}
    </div>
  );
}

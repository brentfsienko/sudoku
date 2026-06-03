import { AppDogIcon } from "@/components/AppDogIcon";
import { DogAvatar } from "@/components/DogAvatar";
import { APP_NAME } from "@/lib/brand";
import type { DogId } from "@/lib/theme/dogs";

type Props = {
  dogId?: DogId;
  /** App icon.svg golden dog (e.g. main tab header) instead of profile avatar */
  appIcon?: boolean;
  /** White text for accent header backgrounds */
  light?: boolean;
  size?: "md" | "lg" | "xl";
};

export function AppBrandTitle({
  dogId = "golden",
  appIcon,
  light,
  size = "lg",
}: Props) {
  const avatarSize = size === "xl" ? 42 : size === "lg" ? 36 : 28;
  const titleClass =
    size === "xl"
      ? "font-serif-title text-[2.75rem] leading-none"
      : size === "lg"
        ? "font-serif-title text-[2.25rem] leading-none"
        : "font-serif-title text-xl leading-none";

  return (
    <div className="flex items-center gap-2.5">
      {appIcon ? (
        <AppDogIcon size={avatarSize} />
      ) : (
        <DogAvatar dogId={dogId} size={avatarSize} />
      )}
      <span
        className={`${titleClass} ${light ? "text-white" : "text-[var(--foreground)]"}`}
      >
        {APP_NAME}
      </span>
    </div>
  );
}

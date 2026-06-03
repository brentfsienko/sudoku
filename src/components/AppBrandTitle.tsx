import { AppDogIcon } from "@/components/AppDogIcon";
import { DogAvatar } from "@/components/DogAvatar";
import { APP_NAME } from "@/lib/brand";
import type { DogId } from "@/lib/theme/dogs";

type Props = {
  dogId?: DogId;
  /** Pixel golden brand dog (default header mark for most players) */
  appIcon?: boolean;
  /** Equipped profile pup in header (e.g. bee for honey) instead of golden brand */
  profileIcon?: boolean;
  light?: boolean;
  size?: "md" | "lg" | "xl";
  /** Title + icon alignment in the header */
  align?: "start" | "center";
};

export function AppBrandTitle({
  dogId = "golden",
  appIcon,
  profileIcon,
  light,
  size = "lg",
  align = "center",
}: Props) {
  const avatarSize =
    size === "xl" ? (appIcon || profileIcon ? 96 : 42) : size === "lg" ? 36 : 28;
  const titleClass =
    size === "xl"
      ? "font-serif-title text-[2.75rem] leading-none"
      : size === "lg"
        ? "font-serif-title text-[2.25rem] leading-none"
        : "font-serif-title text-xl leading-none";

  const icon =
    profileIcon ? (
      <DogAvatar dogId={dogId} size={avatarSize} bare literal />
    ) : appIcon ? (
      <AppDogIcon size={avatarSize} />
    ) : (
      <DogAvatar dogId={dogId} size={avatarSize} />
    );

  return (
    <div
      className={`flex items-center gap-3.5 ${
        align === "start" ? "justify-start" : "justify-center"
      } ${size === "xl" ? "min-w-0" : ""}`}
    >
      {icon}
      <span
        className={`${titleClass} ${light ? "text-white" : "text-[var(--foreground)]"}`}
      >
        {APP_NAME}
      </span>
    </div>
  );
}

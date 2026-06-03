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
  className?: string;
};

export function AppBrandTitle({
  dogId = "golden",
  appIcon,
  profileIcon,
  light,
  size = "lg",
  align = "center",
  className,
}: Props) {
  const avatarSize =
    size === "xl"
      ? appIcon || profileIcon
        ? 128
        : 48
      : size === "lg"
        ? 36
        : 28;
  const titleClass =
    size === "xl"
      ? "font-serif-title text-[2.75rem] leading-none"
      : size === "lg"
        ? "font-serif-title text-[2.25rem] leading-none"
        : "font-serif-title text-xl leading-none";
  const headerRow = size === "xl" && align === "start";

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
      className={`flex gap-4 ${
        headerRow ? "items-end pb-0.5" : "items-center gap-3.5"
      } ${align === "start" ? "justify-start" : "justify-center"} ${
        size === "xl" ? "min-w-0" : ""
      } ${className ?? ""}`}
    >
      {icon}
      <span
        className={`${titleClass} ${light ? "text-white" : "text-[var(--foreground)]"} ${
          headerRow ? "pb-1" : ""
        }`}
      >
        {APP_NAME}
      </span>
    </div>
  );
}

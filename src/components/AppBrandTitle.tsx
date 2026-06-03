import { DogAvatar } from "@/components/DogAvatar";
import { APP_NAME } from "@/lib/brand";
import type { DogId } from "@/lib/theme/dogs";

type Props = {
  dogId?: DogId;
  /** White text for accent header backgrounds */
  light?: boolean;
  size?: "md" | "lg";
};

export function AppBrandTitle({ dogId = "golden", light, size = "lg" }: Props) {
  const avatarSize = size === "lg" ? 36 : 28;
  const titleClass =
    size === "lg"
      ? "font-serif-title text-[2.25rem] leading-none"
      : "font-serif-title text-xl leading-none";

  return (
    <div className="flex items-center gap-2.5">
      <DogAvatar dogId={dogId} size={avatarSize} />
      <span
        className={`${titleClass} ${light ? "text-white" : "text-[var(--foreground)]"}`}
      >
        {APP_NAME}
      </span>
    </div>
  );
}

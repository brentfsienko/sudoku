import { AppDogIcon } from "@/components/AppDogIcon";
import { DogAvatar } from "@/components/DogAvatar";
import { APP_NAME } from "@/lib/brand";
import type { DogId } from "@/lib/theme/dogs";

const ICON_SIZE = 128;
/** Extra space below the status bar before the brand row. */
const HEADER_TOP_OFFSET = "2.5dvh";

type Props = {
  dogId: DogId;
  appIcon?: boolean;
  profileIcon?: boolean;
};

/** Play tab brand: dog on the left, title to its right (no overlap), vertically centered. */
export function PlayTabHeader({ dogId, appIcon, profileIcon }: Props) {
  const icon = profileIcon ? (
    <DogAvatar dogId={dogId} size={ICON_SIZE} bare literal />
  ) : appIcon ? (
    <AppDogIcon size={ICON_SIZE} />
  ) : (
    <DogAvatar dogId={dogId} size={ICON_SIZE} />
  );

  return (
    <div
      className="relative flex w-full items-center gap-3 pr-28 pl-3 pb-1.5"
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + ${HEADER_TOP_OFFSET})`,
        minHeight: ICON_SIZE,
      }}
    >
      <div className="shrink-0">{icon}</div>
      <h1 className="font-serif-title min-w-0 text-[2.75rem] leading-none text-white">
        {APP_NAME}
      </h1>
    </div>
  );
}

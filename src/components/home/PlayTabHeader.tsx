import { AppDogIcon } from "@/components/AppDogIcon";
import { DogAvatar } from "@/components/DogAvatar";
import { APP_NAME } from "@/lib/brand";
import type { DogId } from "@/lib/theme/dogs";

const ICON_SIZE = 128;
/** Extra space below the status bar before the brand row. */
const HEADER_TOP_OFFSET = "5dvh";

type Props = {
  dogId: DogId;
  appIcon?: boolean;
  profileIcon?: boolean;
};

/** Play tab brand: dog on the left, title starting ~30% from screen left, vertically centered. */
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
      className="relative w-full pr-28 pb-3"
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + ${HEADER_TOP_OFFSET})`,
      }}
    >
      <div className="relative w-full" style={{ minHeight: ICON_SIZE }}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
        <h1
          className="font-serif-title absolute top-1/2 -translate-y-1/2 text-[2.75rem] leading-none text-white"
          style={{ left: "30%" }}
        >
          {APP_NAME}
        </h1>
      </div>
    </div>
  );
}

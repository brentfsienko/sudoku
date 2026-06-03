import { AppDogIcon } from "@/components/AppDogIcon";
import { APP_NAME } from "@/lib/brand";

const ICON_SIZE = 128;
/** Viewport for the 128px sprite — wide enough that the left ear stays in frame. */
const CROP_WIDTH = "6rem";
/** Pull face left within the PNG; keep mild so the ear is not clipped by the crop edge. */
const SPRITE_SHIFT = "-translate-x-8";

/**
 * Same outer row as TabScreenHeader; dog + title grouped on the left.
 */
export function PlayTabHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div
          className="h-32 shrink-0 overflow-hidden"
          style={{ width: CROP_WIDTH }}
          aria-hidden
        >
          <AppDogIcon
            size={ICON_SIZE}
            className={`max-w-none ${SPRITE_SHIFT}`}
          />
        </div>
        <h1 className="font-serif-title -ml-1 shrink-0 text-[2.75rem] leading-none text-white">
          {APP_NAME}
        </h1>
      </div>
    </div>
  );
}

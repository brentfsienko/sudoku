import { AppDogIcon } from "@/components/AppDogIcon";
import { APP_NAME } from "@/lib/brand";

const ICON_SIZE = 128;

/**
 * Same outer row as TabScreenHeader; dog + title grouped on the left.
 * Full sprite (no crop) so the ears are never clipped.
 */
export function PlayTabHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <AppDogIcon size={ICON_SIZE} />
        <h1 className="font-serif-title shrink-0 text-[2.75rem] leading-none text-white">
          {APP_NAME}
        </h1>
      </div>
    </div>
  );
}

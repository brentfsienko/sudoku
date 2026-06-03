import { AppDogIcon } from "@/components/AppDogIcon";
import { APP_NAME } from "@/lib/brand";

const ICON_SIZE = 128;

/**
 * Same title typography and vertical origin as TabScreenHeader (Friends / Me),
 * with the golden brand dog to the left of the title.
 */
export function PlayTabHeader() {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0">
        <AppDogIcon size={ICON_SIZE} />
      </div>
      <h1 className="font-serif-title min-w-0 text-[2.75rem] leading-none text-white">
        {APP_NAME}
      </h1>
    </div>
  );
}

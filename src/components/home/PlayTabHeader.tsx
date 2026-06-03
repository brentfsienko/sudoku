import { AppDogIcon } from "@/components/AppDogIcon";
import { APP_NAME } from "@/lib/brand";

/** Matches TabScreenHeader title size (2.75rem). */
const TITLE_PX = 44;

/**
 * Same layout slot as TabScreenHeader (Friends / Me): left-aligned row,
 * golden brand dog then title, vertically centered.
 */
export function PlayTabHeader() {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <AppDogIcon size={TITLE_PX} />
        <h1 className="font-serif-title shrink-0 text-[2.75rem] leading-none text-white">
          {APP_NAME}
        </h1>
      </div>
    </div>
  );
}

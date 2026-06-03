import { AppDogIcon } from "@/components/AppDogIcon";
import { APP_NAME } from "@/lib/brand";

const ICON_SIZE = 128;

/**
 * Left-aligned like TabScreenHeader (Friends / Me), with large brand dog
 * then title — gap keeps the wordmark clear of the pup.
 */
export function PlayTabHeader() {
  return (
    <div className="flex w-full items-start justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="-ml-1.5 shrink-0">
          <AppDogIcon size={ICON_SIZE} />
        </div>
        <h1 className="font-serif-title shrink-0 text-[2.75rem] leading-none text-white">
          {APP_NAME}
        </h1>
      </div>
    </div>
  );
}

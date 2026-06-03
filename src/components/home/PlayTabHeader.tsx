import { APP_NAME } from "@/lib/brand";

/** Matches TabScreenHeader (Friends / Me) — title only; dog sits on the sheet edge below. */
export function PlayTabHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-serif-title text-[2.75rem] leading-none text-white">
        {APP_NAME}
      </h1>
    </div>
  );
}

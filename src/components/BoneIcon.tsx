import { BONE_IMAGE } from "@/lib/bones/config";

export function BoneIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BONE_IMAGE}
      alt=""
      width={size}
      height={size}
      className={`block shrink-0 object-contain ${className ?? ""}`}
      aria-hidden
    />
  );
}

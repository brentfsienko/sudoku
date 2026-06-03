import { BONE_IMAGE } from "@/lib/bones/config";

type Props = {
  size?: number;
  className?: string;
};

export function BoneIcon({ size = 18, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BONE_IMAGE}
      alt=""
      width={size}
      height={size}
      className={`block shrink-0 object-contain ${className ?? ""}`}
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}

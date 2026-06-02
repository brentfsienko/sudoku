"use client";

type Props = {
  username: string;
  onClose: () => void;
};

export function FriendCodeModal({ username, onClose }: Props) {
  const handle = `@${username}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(handle);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif-title mb-2 text-2xl text-[var(--foreground)]">
          Friend code
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Share this so friends can find you in search.
        </p>
        <div className="font-display mb-4 text-2xl font-extrabold text-[var(--foreground)]">
          {handle}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="font-display rounded-full bg-[var(--primary)] py-3 text-sm font-extrabold text-white"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 text-sm font-semibold text-[var(--muted)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

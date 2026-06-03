"use client";

type Props = {
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  onCreateRoom: () => void;
  onJoin: () => void;
};

export function CreateRoomPanel({
  joinCode,
  onJoinCodeChange,
  onCreateRoom,
  onJoin,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-center text-sm text-[var(--muted)]">
        Create a room and share the code, invite from the Friends tab, or join a
        friend&apos;s game.
      </p>
      <button
        type="button"
        onClick={onCreateRoom}
        className="font-display rounded-full bg-[var(--primary)] py-3.5 text-lg font-extrabold text-white shadow-md transition active:scale-[0.98]"
      >
        Create Room
      </button>
      <div className="flex items-center gap-2">
        <input
          value={joinCode}
          onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
          placeholder="CODE"
          maxLength={4}
          className="font-display w-full rounded-full border-2 border-[var(--border)] bg-[var(--background)] px-4 py-3 text-center text-lg font-bold tracking-[0.3em] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={onJoin}
          className="font-display shrink-0 rounded-full bg-[var(--accent)] px-6 py-3 text-lg font-extrabold text-white transition active:scale-95"
        >
          Join
        </button>
      </div>
    </div>
  );
}

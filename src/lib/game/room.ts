/** Room codes are always this many letters (no ambiguous I/O). */
export const ROOM_CODE_LENGTH = 6;

/** Six-letter room code (no ambiguous chars) — ~191M space. */
export function newRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

/** True when a room path segment is a valid floof room code. */
export function isValidRoomCode(code: string): boolean {
  return new RegExp(`^[A-Z]{${ROOM_CODE_LENGTH}}$`).test(code.toUpperCase());
}

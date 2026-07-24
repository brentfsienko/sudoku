/** Six-letter room code (no ambiguous chars) — ~191M space. */
export function newRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

/** True when a room path segment is a valid floof room code. */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z]{4,8}$/.test(code.toUpperCase());
}

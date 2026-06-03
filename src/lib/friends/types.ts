export type PublicProfile = {
  userId: string;
  username: string;
  dogId: string;
};

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  profile: PublicProfile;
};

export type Friend = PublicProfile;

export type GameInvite = {
  id: string;
  roomCode: string;
  hostId: string;
  guestId: string;
  mode: "coop" | "competitive";
  difficulty: string;
  status: "pending" | "joined" | "expired";
  createdAt: string;
  host: PublicProfile;
};

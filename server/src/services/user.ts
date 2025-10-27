import crypto from "node:crypto";

export interface User {
  id: string;
  google_sub: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: number;
  updatedAt: number;
}

const usersById = new Map<string, User>();
const usersByGoogleSub = new Map<string, User>();

export const upsertUserByGoogle = (profile: {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}): User => {
  let user = usersByGoogleSub.get(profile.sub);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      google_sub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    usersById.set(user.id, user);
    usersByGoogleSub.set(user.google_sub, user);
    return user;
  }
  // update mutable fields
  user.email = profile.email;
  user.name = profile.name;
  user.picture = profile.picture;
  user.updatedAt = Date.now();
  return user;
};

export const getUserById = (id: string) => usersById.get(id) ?? null;

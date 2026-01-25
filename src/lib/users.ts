import type { User } from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserRole = "vet" | "user";
export type VetStatus = "open" | "closed";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
  country?: string;
  province?: string;
  city?: string;
  /** Full address of vet clinic (only for vets) */
  clinicAddress?: string;
  vetStatus?: VetStatus;
  profileComplete?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function ensureUserDoc(firebaseUser: User): Promise<void> {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? null,
      displayName: firebaseUser.displayName ?? null,
      photoURL: firebaseUser.photoURL ?? null,
      profileComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } satisfies UserProfile);
    return;
  }

  await setDoc(
    ref,
    {
      email: firebaseUser.email ?? null,
      displayName: firebaseUser.displayName ?? null,
      photoURL: firebaseUser.photoURL ?? null,
      updatedAt: serverTimestamp(),
    } satisfies Partial<UserProfile>,
    { merge: true },
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export function subscribeToUserProfile(
  uid: string,
  onValue: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    onValue(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<UserProfile>,
): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    {
      ...patch,
      updatedAt: serverTimestamp(),
    } satisfies Partial<UserProfile>,
    { merge: true },
  );
}

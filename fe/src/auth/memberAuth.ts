const MEMBER_SESSION_KEY = "city_archive_member_session";

export interface MemberSession {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export function getMemberSession(): MemberSession | null {
  try {
    const raw = localStorage.getItem(MEMBER_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as MemberSession;
    return data && typeof data.id === "number" ? data : null;
  } catch {
    return null;
  }
}

export function setMemberSession(member: MemberSession): void {
  localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(member));
}

export function clearMemberSession(): void {
  localStorage.removeItem(MEMBER_SESSION_KEY);
}

export function isMemberLoggedIn(): boolean {
  return getMemberSession() !== null;
}

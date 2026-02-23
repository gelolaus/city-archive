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
    const data = JSON.parse(raw) as { id?: number | string; email?: string; [key: string]: unknown };
    if (!data) return null;
    const id = data.id;
    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    if (typeof numId === "number" && !Number.isNaN(numId)) {
      return { ...data, id: numId } as MemberSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function setMemberSession(member: { id?: number | string; email?: string; [key: string]: unknown }): void {
  const id = member.id;
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  const normalized = typeof numId === "number" && !Number.isNaN(numId)
    ? { ...member, id: numId }
    : member;
  localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(normalized));
}

export function clearMemberSession(): void {
  localStorage.removeItem(MEMBER_SESSION_KEY);
}

export function isMemberLoggedIn(): boolean {
  return getMemberSession() !== null;
}

const SK = "sts-estimates-v2";

export function loadAll(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SK);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAll(data: any[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(SK, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearAll(): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(SK);
    return true;
  } catch {
    return false;
  }
}

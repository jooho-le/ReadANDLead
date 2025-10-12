// Simple localStorage-backed draft for trip stops selected from the map
export type DraftStop = {
  name: string;
  addr?: string;
  lat?: number;
  lng?: number;
  addedAt?: number;
};

const KEY = 'trip_draft_stops_v1';

export function readDraft(): DraftStop[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function notify() {
  try { window.dispatchEvent(new CustomEvent('trip-draft-changed')); } catch {}
}

export function writeDraft(list: DraftStop[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  notify();
}

export function addToDraft(stop: DraftStop) {
  const list = readDraft();
  list.push({ ...stop, addedAt: Date.now() });
  writeDraft(list);
}

export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch {}
  notify();
}

export function removeDraftIndex(idx: number) {
  const list = readDraft();
  if (idx>=0 && idx<list.length) {
    list.splice(idx, 1);
    writeDraft(list);
  }
}

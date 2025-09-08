export function safeJSONParse<T = any>(input: unknown): T | null {
if (typeof input !== "string") return (input as T) ?? null;
try { return JSON.parse(input) as T; } catch { return null; }
}
import { randomUUID } from 'crypto';

export function startTrace(name: string) {
  const traceId = randomUUID();
  const startedAt = Date.now();
  return {
    traceId,
    name,
    end() {
      return {
        traceId,
        name,
        durationMs: Date.now() - startedAt
      };
    }
  };
}

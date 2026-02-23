import { apiFetch } from './client';

/**
 * Sends a telemetry event to the backend. Fire-and-forget; does not throw.
 */
export function trackEvent(action: string, metadata: Record<string, unknown> = {}): void {
  apiFetch('/api/logs/telemetry', {
    method: 'POST',
    body: JSON.stringify({ action, metadata }),
  }).catch(() => {});
}

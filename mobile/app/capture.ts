export function selectCaptureFileSize(reported?: number, actual?: number): number | undefined {
  if (typeof actual === 'number' && Number.isFinite(actual) && actual > 0) return actual;
  return typeof reported === 'number' && Number.isFinite(reported) && reported > 0 ? reported : undefined;
}

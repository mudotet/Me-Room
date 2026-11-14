import Constants from 'expo-constants';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { parseRoomScene, SceneValidationError } from './scene';
import type { Capture, RoomScene, SceneResult } from './types';

export type ApiErrorCode = 'CONFIG' | 'NETWORK' | 'TIMEOUT' | 'HTTP' | 'RESPONSE' | 'CAPTURE';
export class ApiError extends Error {
  constructor(message: string, public readonly code: ApiErrorCode, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiConfigHelp = 'Trên iPhone, đặt EXPO_PUBLIC_API_BASE_URL trong mobile/.env thành http://<IP-Wi-Fi-của-Mac>:8001. Không dùng localhost hay cổng Expo 8081/8082. Khởi động lại Expo rồi tải lại app.';

export function getApiBaseUrl(): string | undefined {
  const configured: unknown = process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof configured !== 'string' || configured.trim() === '') return undefined;
  try {
    const url = new URL(configured.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    return url.toString().replace(/\/+$/, '');
  } catch {
    throw new ApiError(`Địa chỉ backend chưa hợp lệ. ${apiConfigHelp}`, 'CONFIG');
  }
}

function abortError(): Error {
  const error = new Error('Yêu cầu đã được hủy.');
  error.name = 'AbortError';
  return error;
}

function httpError(status: number): ApiError {
  const messages: Record<number, string> = {
    401: 'Máy chủ yêu cầu xác thực. Vui lòng kiểm tra cấu hình backend.',
    403: 'Máy chủ chưa cho phép yêu cầu này. Vui lòng kiểm tra cấu hình backend.',
    404: 'Máy chủ chưa hỗ trợ tính năng này. Vui lòng kiểm tra địa chỉ API.',
    413: 'Video quá lớn. Hãy thử một video ngắn hơn.',
    422: 'Máy chủ không nhận được dữ liệu phù hợp. Hãy thử video khác.',
    429: 'Máy chủ đang nhận quá nhiều yêu cầu. Hãy thử lại sau ít phút.',
  };
  return new ApiError(messages[status] ?? 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.', 'HTTP', status);
}

async function request(
  path: string,
  createInit: (signal: AbortSignal) => Promise<RequestInit> | RequestInit,
  signal?: AbortSignal,
  timeoutMs = 60_000,
): Promise<unknown> {
  if (signal?.aborted) throw abortError();
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError(`Chưa cấu hình địa chỉ backend. ${apiConfigHelp}`, 'CONFIG');
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const init = await createInit(controller.signal);
    if (controller.signal.aborted) throw abortError();
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) throw httpError(response.status);
    if (Number(response.headers.get('content-length')) > 2_000_000) {
      throw new ApiError('Dữ liệu trả về quá lớn. Vui lòng thử lại.', 'RESPONSE');
    }
    const body = await response.text();
    if (controller.signal.aborted) throw abortError();
    if (body.length > 2_000_000) throw new ApiError('Dữ liệu trả về quá lớn. Vui lòng thử lại.', 'RESPONSE');
    try { return JSON.parse(body) as unknown; }
    catch { throw new ApiError('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.', 'RESPONSE'); }
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut) throw new ApiError('Máy chủ phản hồi quá lâu. Hãy kiểm tra kết nối rồi thử lại.', 'TIMEOUT');
    if (error instanceof ApiError) throw error;
    throw new ApiError('Không thể kết nối máy chủ. Hãy kiểm tra mạng và thử lại.', 'NETWORK');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}

/** Backend contract: GET /health returns JSON {status: "ok" | "healthy"}. */
export async function checkHealth(signal?: AbortSignal): Promise<void> {
  const result = await request('/health', () => ({ method: 'GET', headers: { Accept: 'application/json' } }), signal, 10_000);
  if (typeof result !== 'object' || result === null || !('status' in result) || !['ok', 'healthy'].includes(String(result.status).toLowerCase())) {
    throw new ApiError('Máy chủ chưa xác nhận trạng thái sẵn sàng.', 'RESPONSE');
  }
}

function sceneResult(value: unknown): SceneResult {
  try {
    if (typeof value === 'object' && value !== null && 'scene' in value) {
      const message = 'message' in value && typeof value.message === 'string' ? value.message.trim().slice(0, 2000) : undefined;
      return Object.freeze({ scene: parseRoomScene(value.scene), ...(message ? { message } : {}) });
    }
    return Object.freeze({ scene: parseRoomScene(value) });
  } catch (error) {
    if (error instanceof SceneValidationError) throw new ApiError(error.message, 'RESPONSE');
    throw error;
  }
}

/** Live OpenAPI: multipart field "video"; RoomScene response, no client AI credentials. */
export async function scanRoom(capture: Capture, signal?: AbortSignal): Promise<SceneResult> {
  const result = await request('/scan', async (requestSignal) => {
    if (!capture.uri || !/^video\/(mp4|quicktime|webm)$/i.test(capture.mimeType)) {
      throw new ApiError('Video chưa hợp lệ. Hãy quay lại hoặc chọn video MP4, MOV hay WebM.', 'CAPTURE');
    }
    const maxBytes = 250 * 1024 * 1024;
    if (capture.fileSize !== undefined) {
      if (!Number.isFinite(capture.fileSize) || capture.fileSize < 0) {
        throw new ApiError('Không thể xác định kích thước video hợp lệ.', 'CAPTURE');
      }
      if (capture.fileSize === 0) throw new ApiError('Video không được để trống.', 'CAPTURE');
      if (capture.fileSize > maxBytes) throw new ApiError('Video vượt quá giới hạn 250 MiB.', 'CAPTURE');
    }
    const form = new FormData();
    const name = capture.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'room.mp4';
    if (Platform.OS === 'web' || capture.webFile) {
      const blob = capture.webFile ?? await fetch(capture.uri, { signal: requestSignal }).then((response) => {
        if (!response.ok) throw new ApiError('Không thể đọc video đã chọn. Hãy thử video khác.', 'CAPTURE');
        return response.blob();
      });
      if (!blob || !Number.isFinite(blob.size) || blob.size < 0) throw new ApiError('Không thể xác định kích thước video hợp lệ.', 'CAPTURE');
      if (blob.size === 0) throw new ApiError('Video không được để trống.', 'CAPTURE');
      if (blob.size > maxBytes) throw new ApiError('Video vượt quá giới hạn 250 MiB.', 'CAPTURE');
      form.append('video', blob, name);
    } else {
      form.append('video', new File(capture.uri));
    }
    return { method: 'POST', headers: { Accept: 'application/json' }, body: form };
  }, signal, 180_000);
  return sceneResult(result);
}

/** Live OpenAPI: POST /design {scene,prompt}, max 2,000 characters; RoomScene response. */
export async function designRoom(scene: RoomScene, prompt: string, signal?: AbortSignal): Promise<SceneResult> {
  const trimmed = prompt.trim();
  if (!trimmed || trimmed.length > 2000) throw new ApiError('Hãy nhập yêu cầu từ 1 đến 2.000 ký tự.', 'CAPTURE');
  const validatedScene = parseRoomScene(scene);
  const result = await request('/design', () => ({
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene: validatedScene, prompt: trimmed }),
  }), signal);
  return sceneResult(result);
}

import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { ApiError, checkHealth, designRoom, getApiBaseUrl, scanRoom } from '../app/api.ts';
import { bedroomScene, livingScene } from '../app/fixtures.ts';

let previousAddress;
beforeEach(() => {
  previousAddress = process.env.EXPO_PUBLIC_API_BASE_URL;
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.test';
});
afterEach(() => {
  if (previousAddress === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
  else process.env.EXPO_PUBLIC_API_BASE_URL = previousAddress;
  mock.restoreAll();
  mock.timers.reset();
});
const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const apiCode = (code) => (error) => error instanceof ApiError && error.code === code;

test('public API configuration strips trailing slash and rejects embedded credentials', () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.test/v1/';
  assert.equal(getApiBaseUrl(), 'https://api.example.test/v1');
  for (const address of ['ftp://invalid.test', 'https://user:secret@invalid.test', 'https://invalid.test?key=secret', 'not a url']) {
    process.env.EXPO_PUBLIC_API_BASE_URL = address;
    assert.throws(() => getApiBaseUrl(), apiCode('CONFIG'));
  }
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  assert.equal(getApiBaseUrl(), undefined);
});

test('health accepts confirmed readiness and rejects HTML or unexpected JSON', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => jsonResponse({ status: 'healthy' }));
  await checkHealth();
  assert.equal(fetch.mock.calls[0].arguments[0], 'https://api.example.test/health');
  fetch.mock.mockImplementation(async () => new Response('<html>proxy error</html>'));
  await assert.rejects(checkHealth(), apiCode('RESPONSE'));
  fetch.mock.mockImplementation(async () => jsonResponse({ status: 'starting' }));
  await assert.rejects(checkHealth(), apiCode('RESPONSE'));
});

test('network failures remain retryable and raw transport details are not exposed', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => { throw new Error('secret transport detail'); });
  await assert.rejects(checkHealth(), (error) => apiCode('NETWORK')(error) && !error.message.includes('secret'));
  fetch.mock.mockImplementation(async () => jsonResponse({ status: 'ok' }));
  await checkHealth();
  assert.equal(fetch.mock.callCount(), 2);
});

test('backend error statuses use a safe actionable error without response text', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('sensitive backend details', { status: 422 }));
  await assert.rejects(designRoom(bedroomScene, 'Đổi màu tường'), (error) => apiCode('HTTP')(error) && error.status === 422 && !error.message.includes('sensitive'));
});

test('already-cancelled requests never start uploading', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => jsonResponse({ status: 'ok' }));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(checkHealth(controller.signal), { name: 'AbortError' });
  assert.equal(fetch.mock.callCount(), 0);
});

test('cancellation while waiting aborts fetch and is not reported as server failure', async () => {
  mock.method(globalThis, 'fetch', async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  }));
  const controller = new AbortController();
  const pending = checkHealth(controller.signal);
  await Promise.resolve();
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('health deadline aborts the network and returns a timeout error', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  mock.method(globalThis, 'fetch', async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  }));
  const pending = checkHealth();
  await Promise.resolve();
  mock.timers.tick(10_001);
  await assert.rejects(pending, apiCode('TIMEOUT'));
});

test('video upload uses multipart video without forcing a boundary or sending credentials', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => jsonResponse({ scene: livingScene }));
  const result = await scanRoom({ uri: 'blob:test-video', mimeType: 'video/mp4', fileName: 'test room.mp4', webFile: new Blob(['synthetic fixture'], { type: 'video/mp4' }) });
  const [url, init] = fetch.mock.calls[0].arguments;
  assert.equal(url, 'https://api.example.test/scan');
  assert.equal(init.method, 'POST');
  assert.deepEqual(init.headers, { Accept: 'application/json' });
  assert.equal(init.body.get('video').name, 'test_room.mp4');
  assert.equal(init.body.has('image'), false);
  assert.deepEqual(result.scene, livingScene);
});

test('invalid, still-image, or empty video is rejected before transport', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => jsonResponse(livingScene));
  await assert.rejects(scanRoom({ uri: 'blob:video', mimeType: 'text/plain', fileName: 'room.txt' }), apiCode('CAPTURE'));
  await assert.rejects(scanRoom({ uri: 'blob:image', mimeType: 'image/jpeg', fileName: 'room.jpg', webFile: new Blob(['image']) }), apiCode('CAPTURE'));
  await assert.rejects(scanRoom({ uri: 'blob:video', mimeType: 'video/mp4', fileName: 'room.mp4', webFile: new Blob([]) }), apiCode('CAPTURE'));
  assert.equal(fetch.mock.callCount(), 0);
});

test('native video size metadata rejects oversize and invalid recordings before transport', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => jsonResponse(livingScene));
  for (const fileSize of [0, -1, NaN, Infinity, 50 * 1024 * 1024 + 1]) {
    await assert.rejects(scanRoom({ uri: 'file:///synthetic-room.mp4', mimeType: 'video/mp4', fileName: 'room.mp4', fileSize }), apiCode('CAPTURE'));
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('chat sends current scene and trimmed instruction, accepts a replacement scene immutably', async () => {
  const before = structuredClone(bedroomScene);
  const fetch = mock.method(globalThis, 'fetch', async () => jsonResponse({ scene: livingScene, message: 'Đã cập nhật.' }));
  const result = await designRoom(bedroomScene, '  Đổi màu tường  ');
  const [, init] = fetch.mock.calls[0].arguments;
  assert.deepEqual(JSON.parse(init.body), { scene: bedroomScene, prompt: 'Đổi màu tường' });
  assert.deepEqual(result.scene, livingScene);
  assert.equal(result.message, 'Đã cập nhật.');
  assert.deepEqual(bedroomScene, before);
});

test('bad scene responses cannot replace an accepted room', async () => {
  mock.method(globalThis, 'fetch', async () => jsonResponse({ scene: { sceneId: 'bad', objects: [] } }));
  await assert.rejects(designRoom(bedroomScene, 'Đổi màu tường'), apiCode('RESPONSE'));
});

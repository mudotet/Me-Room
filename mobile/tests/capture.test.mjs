import assert from 'node:assert/strict';
import test from 'node:test';
import { scanRoom } from '../app/api.ts';
import { selectCaptureFileSize } from '../app/capture.ts';

test('actual capture size takes precedence over picker metadata', () => {
  const fiveMegabytes = 5 * 1024 * 1024;
  assert.equal(selectCaptureFileSize(0, fiveMegabytes), fiveMegabytes);
  assert.equal(selectCaptureFileSize(undefined, fiveMegabytes), fiveMegabytes);
  assert.equal(selectCaptureFileSize(12, fiveMegabytes), fiveMegabytes);
});

test('invalid actual and reported sizes stay unknown', () => {
  assert.equal(selectCaptureFileSize(NaN, undefined), undefined);
  assert.equal(selectCaptureFileSize(-1, 0), undefined);
  assert.equal(selectCaptureFileSize(Infinity, -1), undefined);
  assert.equal(selectCaptureFileSize(12, undefined), 12);
});

test('oversize actual size reaches the API validation unchanged', async () => {
  const oversize = 250 * 1024 * 1024 + 1;
  const fileSize = selectCaptureFileSize(0, oversize);
  const previousAddress = process.env.EXPO_PUBLIC_API_BASE_URL;
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.test';
  try {
    assert.equal(fileSize, oversize);
    await assert.rejects(
      scanRoom({ uri: 'file:///room.mp4', mimeType: 'video/mp4', fileName: 'room.mp4', fileSize }),
      (error) => error.code === 'CAPTURE',
    );
  } finally {
    if (previousAddress === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
    else process.env.EXPO_PUBLIC_API_BASE_URL = previousAddress;
  }
});

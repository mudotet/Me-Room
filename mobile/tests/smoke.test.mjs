import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { bedroomScene } from '../app/fixtures.ts';

test('full smoke independently checks design with a synthetic scene when video is unavailable', async () => {
  const paths = [];
  const server = createServer(async (request, response) => {
    paths.push(`${request.method} ${request.url}`);
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/health') return response.end(JSON.stringify({ status: 'ok', internal: 'private-diagnostic' }));
    if (request.url === '/openapi.json') return response.end(JSON.stringify({ paths: {
      '/scan': { post: { requestBody: { content: { 'multipart/form-data': { schema: { properties: { video: { type: 'string', format: 'binary' } }, required: ['video'] } } } } } },
      '/design': { post: { requestBody: { content: { 'application/json': { schema: { properties: { scene: {}, prompt: {} }, required: ['scene', 'prompt'] } } } } } },
    } }));
    if (request.url === '/design') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      assert.deepEqual(input.scene, bedroomScene);
      assert.equal(typeof input.prompt, 'string');
      return response.end(JSON.stringify(bedroomScene));
    }
    response.statusCode = 404; response.end('{}');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/test-api.mjs', '--full'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: { ...process.env, EXPO_PUBLIC_API_BASE_URL: `http://127.0.0.1:${address.port}` },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '', stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
    assert.equal(stderr, '');
    assert.equal(code, 1); // Partial run must not falsely claim end-to-end success.
    const result = JSON.parse(stdout);
    assert.equal(result.result, 'partial');
    assert.equal(result.contract.scanAcceptsVideo, true);
    assert.equal(result.scanSkippedReason, 'synthetic_video_argument_required');
    assert.equal(result.checks.find((entry) => entry.path === '/design').validRoomScene, true);
    assert.equal(result.checks.find((entry) => entry.path === '/design').input, 'synthetic_scene_fixture');
    assert.deepEqual(paths, ['GET /health', 'GET /openapi.json', 'POST /design']);
    assert.equal(stdout.includes('127.0.0.1'), false);
    assert.equal(stdout.includes('private-diagnostic'), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

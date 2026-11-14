import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readApiAddress } from './env.mjs';

// All diagnostics are allowlisted. Never print the configured URL, request
// content, raw server response, or error message (which can contain secrets).
const report = [];
const full = process.argv.includes('--full');
const videoArgument = process.argv.indexOf('--video');
const videoPath = videoArgument >= 0 ? process.argv[videoArgument + 1] : undefined;
let baseUrl;
try {
  baseUrl = readApiAddress();
} catch (error) {
  console.log(JSON.stringify({ result: 'blocked', reason: error.message }, null, 2));
  process.exit(1);
}

async function request(path, options = {}, timeout = 15000) {
  const start = performance.now();
  const method = options.method || 'GET';
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: AbortSignal.timeout(timeout),
      redirect: 'manual',
      headers: { Accept: 'application/json', ...options.headers },
    });
    const entry = { method, path, status: response.status, milliseconds: Math.round(performance.now() - start) };
    report.push(entry);
    let body;
    // Limit server diagnostics retained in memory; none are logged.
    const reader = response.body?.getReader();
    const chunks = [];
    let total = 0;
    if (reader) {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        total += next.value.length;
        if (total > 2_000_000) { await reader.cancel(); break; }
        chunks.push(next.value);
      }
    }
    if (total <= 2_000_000) {
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* Non-JSON response is diagnosed below. */ }
    }
    if (!response.ok && Array.isArray(body?.detail)) {
      const fields = new Set(['body', 'video', 'scene', 'prompt', 'sceneId', 'room', 'objects', 'width', 'length', 'height', 'wallColor', 'id', 'type', 'modelId', 'position', 'size', 'rotationY', 'color', 'confidence', 'x', 'y', 'z']);
      const types = new Set(['missing', 'value_error', 'string_type', 'float_type', 'int_type', 'dict_type', 'list_type', 'json_invalid', 'greater_than', 'less_than', 'greater_than_equal', 'less_than_equal']);
      entry.validation = body.detail.slice(0, 10).map((error) => ({
        location: Array.isArray(error.loc) ? error.loc.slice(0, 8).map((field) => fields.has(field) ? field : Number.isInteger(field) && field >= 0 && field <= 256 ? field : 'other') : [],
        type: types.has(error.type) ? error.type : 'other',
      }));
    }
    return { response, body, entry };
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'timeout' : 'connection_failed';
    const entry = { method, path, reason, milliseconds: Math.round(performance.now() - start) };
    report.push(entry);
    return { entry };
  }
}

function resolveSchema(schema, spec) {
  if (schema?.$ref?.startsWith('#/')) {
    return schema.$ref.slice(2).split('/').reduce((node, key) => node?.[key], spec);
  }
  return schema;
}

function inspectContract(spec) {
  if (!spec || typeof spec !== 'object' || !spec.paths) return { available: false };
  const scan = spec.paths['/scan']?.post;
  const design = spec.paths['/design']?.post;
  const scanSchema = resolveSchema(scan?.requestBody?.content?.['multipart/form-data']?.schema, spec);
  const designSchema = resolveSchema(design?.requestBody?.content?.['application/json']?.schema, spec);
  // Only report known field names, never arbitrary server-provided strings.
  const scanAcceptsVideo = Boolean(scanSchema?.properties?.video);
  const designAcceptsSceneAndPrompt = Boolean(designSchema?.properties?.scene && designSchema?.properties?.prompt);
  const scanCompatible = scanAcceptsVideo && (scanSchema.required || []).every((key) => key === 'video');
  const designCompatible = designAcceptsSceneAndPrompt && (designSchema.required || []).every((key) => ['scene', 'prompt'].includes(key));
  return { available: true, scanEndpoint: Boolean(scan), designEndpoint: Boolean(design), scanAcceptsVideo, designAcceptsSceneAndPrompt, scanCompatible, designCompatible };
}

function syntheticRoomVideo() {
  if (!videoPath || videoPath.startsWith('--')) throw new Error('synthetic_video_argument_required');
  const expected = resolve(fileURLToPath(new URL('../test-results/synthetic-room.mp4', import.meta.url)));
  // Do not upload recordings or arbitrary paths. Lead generates this exact fixture.
  const supplied = resolve(videoPath);
  const normalize = (path) => process.platform === 'win32' ? path.toLowerCase() : path;
  if (normalize(supplied) !== normalize(expected)) throw new Error('synthetic_video_path_required');
  let data;
  try {
    if (normalize(realpathSync(supplied)) !== normalize(expected)) throw new Error();
    const size = statSync(supplied).size;
    if (size <= 0 || size > 20 * 1024 * 1024) throw new Error();
    data = readFileSync(supplied);
  } catch {
    throw new Error('synthetic_video_unavailable');
  }
  if (data.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('synthetic_video_not_mp4');
  return data;
}

const health = await request('/health');
const healthValid = Boolean(health.response?.ok && health.body && ['ok', 'healthy'].includes(String(health.body.status).toLowerCase()));
health.entry.validHealthResponse = healthValid;
// Do not spend a second connection timeout when the host is unreachable.
const schema = health.response ? await request('/openapi.json') : {};
const contract = inspectContract(schema.body);
let fullResult = full ? 'skipped' : 'not_requested';
let scanPassed = false, designPassed = false, videoUploaded = false;
let scene, scanSkippedReason;
if (full && healthValid) {
  if (contract.scanCompatible) {
    let video;
    try { video = syntheticRoomVideo(); }
    catch (error) { scanSkippedReason = error.message; }
    if (video) {
      const form = new FormData();
      form.append('video', new Blob([video], { type: 'video/mp4' }), 'synthetic-room.mp4');
      videoUploaded = true;
      const scan = await request('/scan', { method: 'POST', body: form }, 120000);
      try {
        const { parseRoomScene } = await import('../app/scene.ts');
        scene = parseRoomScene(scan.body?.scene ?? scan.body);
        scanPassed = Boolean(scan.response?.ok);
      } catch { /* The validation result is logged without raw body. */ }
      scan.entry.validRoomScene = scanPassed;
    }
  } else {
    scanSkippedReason = contract.available ? 'backend_contract_mismatch' : 'openapi_unavailable';
  }
  if (contract.designCompatible) {
    const designInput = scanPassed ? 'scan_response' : 'synthetic_scene_fixture';
    if (!scanPassed) scene = (await import('../app/fixtures.ts')).bedroomScene;
    const design = await request('/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, prompt: 'Giữ bố cục căn phòng và đổi màu tường thành tím nhạt.' }),
    }, 60000);
    try {
      const { parseRoomScene } = await import('../app/scene.ts');
      parseRoomScene(design.body?.scene ?? design.body);
      designPassed = Boolean(design.response?.ok);
    } catch { /* The validation result is logged without raw body. */ }
    design.entry.validRoomScene = designPassed;
    design.entry.input = designInput;
  }
  fullResult = scanPassed && designPassed ? 'passed' : scanPassed || designPassed ? 'partial' : videoUploaded || contract.designCompatible ? 'failed' : 'skipped';
}
const passed = healthValid && contract.scanCompatible && contract.designCompatible && (!full || fullResult === 'passed');
const fullSkippedReason = full && fullResult === 'skipped'
  ? !healthValid ? 'health_unavailable' : !contract.available ? 'openapi_unavailable' : 'backend_contract_mismatch'
  : undefined;
console.log(JSON.stringify({ result: passed ? 'passed' : healthValid ? 'partial' : 'failed', scope: full ? 'health_and_scan_design' : 'health_and_contract_discovery', checks: report, contract, fullResult, fullSkippedReason, scanSkippedReason, input: videoUploaded ? 'synthetic_room_video_only' : full && contract.designCompatible && healthValid ? 'synthetic_scene_fixture_only' : 'none' }, null, 2));
process.exitCode = passed ? 0 : 1;

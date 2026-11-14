import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRoomScene, SceneValidationError } from '../app/scene.ts';
import { bedroomScene, livingScene } from '../app/fixtures.ts';

const copy = (scene = bedroomScene) => structuredClone(scene);

test('both distinct synthetic room layouts satisfy the shared scene contract', () => {
  assert.notEqual(bedroomScene.sceneId, livingScene.sceneId);
  assert.notDeepEqual(bedroomScene.objects, livingScene.objects);
  assert.deepEqual(parseRoomScene(copy(bedroomScene)), bedroomScene);
  assert.deepEqual(parseRoomScene(copy(livingScene)), livingScene);
});

test('accepted scene is deeply copied and frozen without mutating the caller', () => {
  const input = copy();
  const output = parseRoomScene(input);
  input.objects[0].position.x += 0.1;
  input.room.wallColor = '#123456';
  assert.notEqual(output.objects[0].position.x, input.objects[0].position.x);
  assert.notEqual(output.room.wallColor, input.room.wallColor);
  assert.equal(Object.isFrozen(input), false);
  for (const value of [output, output.room, output.objects, output.objects[0], output.objects[0].position, output.objects[0].size]) {
    assert.equal(Object.isFrozen(value), true);
  }
});

test('rejects duplicate furniture identities instead of losing React objects', () => {
  const input = copy();
  input.objects[1].id = input.objects[0].id;
  assert.throws(() => parseRoomScene(input), SceneValidationError);
});

test('rejects zero, negative, non-finite and implausibly large room dimensions', () => {
  for (const value of [0, -1, NaN, Infinity, -Infinity, 101, '4']) {
    const input = copy();
    input.room.width = value;
    assert.throws(() => parseRoomScene(input), SceneValidationError);
  }
});

test('rejects unsafe geometry, invalid color strings, and out-of-range confidence', () => {
  const mutations = [
    (scene) => { scene.objects[0].position.x = 500; },
    (scene) => { scene.objects[0].position.y = -101; },
    (scene) => { scene.objects[0].size.y = 0; },
    (scene) => { scene.objects[0].rotationY = Infinity; },
    (scene) => { scene.objects[0].confidence = 1.1; },
    (scene) => { scene.objects[0].color = 'url(https://invalid.test)'; },
    (scene) => { scene.room.wallColor = 'red'; },
  ];
  for (const mutate of mutations) {
    const input = copy(); mutate(input);
    assert.throws(() => parseRoomScene(input), SceneValidationError);
  }
});

test('backend geometry estimates and radians are preserved without clipping at room bounds', () => {
  const input = copy();
  input.objects[0].position = { x: 1.3, y: 0.28, z: 0 };
  input.objects[0].rotationY = Math.PI / 2;
  assert.deepEqual(parseRoomScene(input).objects[0].position, input.objects[0].position);
  assert.equal(parseRoomScene(input).objects[0].rotationY, Math.PI / 2);
  input.objects[0].position = { x: 0, y: input.room.height, z: 0 };
  assert.deepEqual(parseRoomScene(input).objects[0].position, input.objects[0].position);
});

test('rejects malformed responses and excessive object counts while allowing an empty room', () => {
  for (const value of [null, undefined, [], {}, { room: {}, objects: [] }]) {
    assert.throws(() => parseRoomScene(value), SceneValidationError);
  }
  const empty = copy(); empty.objects = [];
  assert.equal(parseRoomScene(empty).objects.length, 0);
  const oversized = copy();
  oversized.objects = Array.from({ length: 101 }, (_, index) => ({ ...copy().objects[0], id: `object-${index}` }));
  assert.throws(() => parseRoomScene(oversized), SceneValidationError);
  oversized.objects.pop();
  assert.equal(parseRoomScene(oversized).objects.length, 100);
});

test('identifiers conform to the live backend character and length constraints', () => {
  for (const id of ['', 'room with spaces', '../room', 'room\n1', 'a'.repeat(101)]) {
    const input = copy(); input.objects[0].id = id;
    assert.throws(() => parseRoomScene(input), SceneValidationError);
  }
});

test('unknown model IDs remain data and cannot introduce URL fields into output', () => {
  const input = copy();
  input.objects[0].modelId = 'future-furniture-001';
  input.objects[0].modelUrl = 'https://invalid.test/private.glb';
  input.serverSecret = 'must-not-cross-boundary';
  const output = parseRoomScene(input);
  assert.equal(output.objects[0].modelId, 'future-furniture-001');
  assert.equal('modelUrl' in output.objects[0], false);
  assert.equal('serverSecret' in output, false);
});

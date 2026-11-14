import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const colors = { wall: '#eeeae2', floor: '#cbb99e', sofa: '#82917a', chair: '#c1835a', table: '#a77b57', bed: '#7f8d9b', wardrobe: '#b59a7c', default: '#a8a29b' };
const labels = { sofa: 'Sofa', chair: 'Ghế', table: 'Bàn', bed: 'Giường', wardrobe: 'Tủ quần áo', plant: 'Cây xanh', lamp: 'Đèn', desk: 'Bàn làm việc', cabinet: 'Tủ', tv: 'Kệ TV' };
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f5f4f0');
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.querySelector('#viewer').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#fffaf1', '#9c9b91', 2.1));
const sun = new THREE.DirectionalLight('#fff4df', 3.2);
sun.position.set(-3, 8, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false;
controls.minPolarAngle = 0.28; controls.maxPolarAngle = Math.PI / 2.05; controls.minDistance = 4; controls.maxDistance = 18;
const roomGroup = new THREE.Group(); scene.add(roomGroup);
let roomData;

const sample = {
  name: 'Phòng khách ấm cúng',
  room: { width: 5.2, depth: 4.4, height: 2.8 },
  objects: [
    { id: 'sofa-1', modelId: 'sofa', position: { x: 0, y: 0.42, z: -1.42 }, size: { width: 2.25, height: 0.84, depth: 0.88 }, rotationY: 0 },
    { id: 'table-1', modelId: 'table', position: { x: 0.1, y: 0.23, z: 0.02 }, size: { width: 1.05, height: 0.46, depth: 0.66 }, rotationY: -0.1 },
    { id: 'chair-1', modelId: 'chair', position: { x: -1.72, y: 0.4, z: 0.25 }, size: { width: 0.76, height: 0.8, depth: 0.78 }, rotationY: -0.35 },
    { id: 'plant-1', modelId: 'plant', position: { x: 2.05, y: 0.65, z: -1.45 }, size: { width: 0.48, height: 1.3, depth: 0.48 }, rotationY: 0 }
  ]
};

function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON phải là một đối tượng RoomScene.');
  const r = data.room;
  if (!r || !['width', 'depth', 'height'].every(k => Number.isFinite(r[k]) && r[k] > 0)) throw new Error('Thiếu room.width, room.depth hoặc room.height hợp lệ (đơn vị mét).');
  if (!Array.isArray(data.objects)) throw new Error('RoomScene cần có danh sách objects.');
  data.objects.forEach((o, i) => {
    if (!o || !o.position || !o.size || !['x', 'y', 'z'].every(k => Number.isFinite(o.position[k])) || !['width', 'height', 'depth'].every(k => Number.isFinite(o.size[k]) && o.size[k] > 0)) throw new Error(`Vị trí hoặc kích thước của objects[${i}] chưa hợp lệ.`);
  });
  return data;
}

function material(color, roughness = 0.86) { return new THREE.MeshStandardMaterial({ color, roughness }); }
function box(parent, w, h, d, mat, x, y, z, radius = 0) {
  let geometry;
  if (radius > 0) geometry = new THREE.BoxGeometry(w, h, d);
  else geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function addFurniture(parent, obj) {
  const { width: w, height: h, depth: d } = obj.size;
  const group = new THREE.Group(); group.position.set(obj.position.x, obj.position.y, obj.position.z); group.rotation.y = Number.isFinite(obj.rotationY) ? obj.rotationY : 0; parent.add(group);
  const id = String(obj.modelId || '').toLowerCase(); const color = colors[id] || colors.default; const m = material(color); const dark = material('#685c50');
  if (id.includes('sofa')) {
    box(group, w, h * .48, d, m, 0, -h * .05, 0);
    box(group, w, h * .55, d * .22, m, 0, h * .23, -d * .38);
    for (const side of [-1, 1]) box(group, w * .12, h * .55, d * .9, m, side * w * .44, h * .02, 0);
    for (const side of [-1, 1]) box(group, w * .28, h * .27, d * .13, material('#b7bca9'), side * w * .22, h * .14, -d * .05);
  } else if (id.includes('chair')) {
    box(group, w * .94, h * .17, d * .9, m, 0, -h * .05, 0); box(group, w * .94, h * .55, d * .16, m, 0, h * .2, -d * .39);
    for (const x of [-1, 1]) for (const z of [-1, 1]) box(group, w * .08, h * .4, d * .08, dark, x * w * .38, -h * .3, z * d * .36);
  } else if (id.includes('table') || id.includes('desk')) {
    box(group, w, h * .16, d, m, 0, h * .35, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) box(group, w * .065, h * .68, d * .065, dark, x * w * .4, -h * .08, z * d * .4);
  } else if (id.includes('plant')) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(w * .4, w * .3, h * .28, 16), material('#b77c61')); pot.position.y = -h * .36; pot.castShadow = true; group.add(pot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, h * .55, 8), material('#667454')); stem.position.y = -h * .03; group.add(stem);
    for (let i = 0; i < 7; i++) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(w * .25, 12, 10), material(i % 2 ? '#82916e' : '#71865f')); leaf.scale.set(.65, 1.6, .48); leaf.position.set(Math.sin(i * 2.4) * w * .28, h * (.04 + (i % 3) * .12), Math.cos(i * 2.4) * w * .24); leaf.castShadow = true; group.add(leaf); }
  } else {
    box(group, w, h, d, m, 0, 0, 0);
    if (id.includes('bed')) box(group, w * .42, h * .12, d * .28, material('#eee9dc'), -w * .24, h * .52, -d * .22);
  }
  return group;
}
function renderRoom(raw) {
  const data = validate(raw); roomData = data;
  while (roomGroup.children.length) {
    const child = roomGroup.children[roomGroup.children.length - 1];
    roomGroup.remove(child);
    child.traverse?.(node => { node.geometry?.dispose(); if (Array.isArray(node.material)) node.material.forEach(m => m.dispose()); else node.material?.dispose(); });
  }
  const { width: w, depth: d, height: h } = data.room;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material(colors.floor)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.receiveShadow = true; roomGroup.add(floor);
  const wallMat = material(colors.wall);
  const back = box(roomGroup, w, h, .08, wallMat, 0, h / 2, -d / 2, 0); back.castShadow = false;
  const left = box(roomGroup, .08, h, d, wallMat, -w / 2, h / 2, 0); left.castShadow = false;
  // Open front and right sides keep the whole room visible from the camera.
  data.objects.forEach(o => addFurniture(roomGroup, o));
  camera.position.set(w * .95, h * 1.1, d * 1.2); controls.target.set(0, h * .25, 0); controls.minDistance = Math.max(3, Math.min(w, d) * .7); controls.maxDistance = Math.max(12, Math.max(w, d) * 3); controls.update();
  document.querySelector('#room-title').textContent = data.name || 'Không gian của bạn';
  document.querySelector('#room-dimensions').textContent = `${w} × ${d} m`;
  document.querySelector('#room-size').textContent = `${w} × ${d} m`;
  document.querySelector('#room-area').textContent = `${(w * d).toFixed(1)} m²`;
  const count = data.objects.length;
  document.querySelector('#item-count').textContent = count; document.querySelector('#furniture-count').textContent = count;
  const list = document.querySelector('#furniture-list');
  list.innerHTML = data.objects.slice(0, 4).map(o => `<span class="furniture-chip"><i style="--chip:${colors[String(o.modelId || '').toLowerCase()] || colors.default}"></i>${labels[String(o.modelId || '').toLowerCase()] || o.name || 'Nội thất'}</span>`).join('') || '<span class="empty-list">Chưa có nội thất</span>';
  document.querySelector('#room-subtitle').textContent = `${count} món nội thất · Kéo mô hình để khám phá.`;
}

const resize = new ResizeObserver(entries => { const { width, height } = entries[0].contentRect; if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); });
resize.observe(document.querySelector('#viewer'));
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();

const toast = document.querySelector('#toast'); let toastTimer;
function notify(message, error = false) { toast.textContent = message; toast.classList.toggle('error', error); toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200); }
document.querySelector('#json-file').addEventListener('change', async e => {
  const file = e.target.files?.[0]; if (!file) return;
  try { renderRoom(JSON.parse(await file.text())); notify(`Đã tải ${file.name}`); }
  catch (err) { notify(err instanceof SyntaxError ? 'File JSON không đúng định dạng.' : err.message, true); }
  e.target.value = '';
});
document.querySelector('#reset-view').addEventListener('click', () => { if (roomData) renderRoom(roomData); });

// React Native WebView bridge: post READY, then accept { type: 'LOAD_SCENE', payload: RoomScene }.
function sendReady() {
  const message = JSON.stringify({ type: 'READY' });
  window.ReactNativeWebView?.postMessage(message);
  window.parent !== window && window.parent.postMessage(message, '*');
}
window.addEventListener('message', event => {
  let message = event.data;
  if (typeof message === 'string') { try { message = JSON.parse(message); } catch { return; } }
  if (message?.type !== 'LOAD_SCENE') return;
  try { renderRoom(message.payload); notify('Đã cập nhật không gian'); }
  catch (err) { notify(err.message, true); }
});
window.addEventListener('load', sendReady, { once: true });
renderRoom(sample);

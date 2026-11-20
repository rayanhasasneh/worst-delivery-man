import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import './style.css';

const $ = (id) => document.getElementById(id);
const scoreEl = $('score');
const timerEl = $('timer');
const orderEl = $('order');
const messageEl = $('message');
const eventsEl = $('events');
const promptEl = $('center-prompt');
const restartButton = $('restart');
restartButton.addEventListener('click', () => window.location.reload());

// -------------------- EVENT QUEUE --------------------
// Producers enqueue events. The queue processes them in FIFO order.
class EventQueue {
  constructor() {
    this.queue = [];
    this.handlers = new Map();
  }
  on(eventName, handler) {
    if (!this.handlers.has(eventName)) this.handlers.set(eventName, []);
    this.handlers.get(eventName).push(handler);
  }
  emit(eventName, payload = {}) {
    this.queue.push({ type: eventName, payload, createdAt: Date.now() });
  }
  processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      logEvent(event.type);
      for (const handler of this.handlers.get(event.type) || []) {
        handler(event.payload);
      }
    }
  }
}

const events = new EventQueue();
function logEvent(name) {
  const line = document.createElement('div');
  line.className = 'event-line';
  line.textContent = `› ${name}`;
  eventsEl.prepend(line);
  while (eventsEl.children.length > 6) eventsEl.lastChild.remove();
}

let score = 0;
let timeLeft = 180;
let hasPackage = false;
let gameEnded = false;
let dogCooldown = 0;
let jumpQueued = false;
const keys = new Set();

// -------------------- THREE.JS SCENE --------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bd5ef);
scene.fog = new THREE.Fog(0x9bd5ef, 35, 95);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x63835b, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-12, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
const groundMat = mat(0x75b96b);
const roadMat = mat(0x555b64);
const whiteMat = mat(0xffffff);

function box(name, x, y, z, sx, sy, sz, color, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(color));
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
box('road', 0, 0.02, -17, 12, 0.04, 78, 0x555b64, false);
for (let z = -52; z < 18; z += 8) box('road-line', 0, 0.05, z, 0.22, 0.02, 3.5, 0xf5e6a8, false);

// No raised side barriers: the road opens directly onto the grass.

// Buildings
const buildingData = [
  [-13, -9, 7, 10, 9, 0xf3b56b], [13, -11, 7, 12, 8, 0xe58b73],
  [-13, -28, 8, 12, 11, 0x8eb6d9], [13, -31, 8, 10, 12, 0xe6d27c],
  [-13, -48, 7, 11, 10, 0xd59ac1], [13, -50, 7, 10, 9, 0x91c7a0]
];
for (const [x,z,sx,sy,sz,c] of buildingData) {
  box('building', x, sy/2, z, sx, sy, sz, c);
  for (let yy = 2; yy < sy - 1; yy += 3) {
    for (let xx = -sx/2 + 1.5; xx < sx/2; xx += 3) {
      box('window', x + xx, yy, z + sz/2 + 0.025, 1.1, 1.25, 0.06, 0x8ed7e8, false);
    }
  }
}

// Clearly visible pizza restaurant, placed beside the road
box('restaurant', -9.2, 1.5, 1.8, 5.4, 3, 5.5, 0xf3a638);
box('restaurant-roof', -9.2, 3.12, 1.8, 5.8, 0.38, 5.9, 0xd94335);
// Front awning and shop windows face the player (+Z)
box('restaurant-awning', -9.2, 2.35, 4.62, 5.5, 0.42, 0.65, 0xf4e6c8);
box('restaurant-door', -9.2, 1.0, 4.62, 1.15, 2.0, 0x65402e);
box('restaurant-window-left', -10.85, 1.55, 4.63, 1.35, 1.25, 0x83d7ed);
box('restaurant-window-right', -7.55, 1.55, 4.63, 1.35, 1.25, 0x83d7ed);
box('restaurant-sign', -9.2, 3.0, 4.72, 3.8, 0.72, 0xfff1c7, false);
// A bright pizza icon/sign makes the shop easy to identify
const signCanvas = document.createElement('canvas');
signCanvas.width = 512; signCanvas.height = 128;
const signCtx = signCanvas.getContext('2d');
signCtx.fillStyle = '#fff1c7'; signCtx.fillRect(0, 0, 512, 128);
signCtx.font = 'bold 76px Arial'; signCtx.textAlign = 'center'; signCtx.textBaseline = 'middle';
signCtx.fillStyle = '#b83226'; signCtx.fillText('🍕 PIZZA', 256, 66);
const signTexture = new THREE.CanvasTexture(signCanvas);
const signLabel = new THREE.Mesh(new THREE.PlaneGeometry(3.65, 0.62), new THREE.MeshBasicMaterial({ map: signTexture }));
signLabel.position.set(-9.2, 3.0, 5.09);
scene.add(signLabel);
// Customer house: centered at the end of the road so it is easy to spot.
box('delivery-house', 0, 2.0, -44, 9, 4, 6, 0x8fca91);
box('house-roof', 0, 4.25, -44, 9.8, 0.65, 6.8, 0x9b5144);
box('house-door', 0, 1.15, -40.92, 1.35, 2.3, 0x65402e);
box('house-window-left', -2.8, 2.35, -40.92, 1.7, 1.45, 0x83d7ed, false);
box('house-window-right', 2.8, 2.35, -40.92, 1.7, 1.45, 0x83d7ed, false);
box('customer-sign-board', 0, 5.35, -40.65, 4.6, 0.85, 0xfff1c7, false);
const customerCanvas = document.createElement('canvas');
customerCanvas.width = 512; customerCanvas.height = 128;
const customerCtx = customerCanvas.getContext('2d');
customerCtx.fillStyle = '#fff1c7'; customerCtx.fillRect(0, 0, 512, 128);
customerCtx.font = 'bold 66px Arial'; customerCtx.textAlign = 'center'; customerCtx.textBaseline = 'middle';
customerCtx.fillStyle = '#2456a6'; customerCtx.fillText('CUSTOMER', 256, 66);
const customerTexture = new THREE.CanvasTexture(customerCanvas);
const customerLabel = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.72), new THREE.MeshBasicMaterial({ map: customerTexture }));
customerLabel.position.set(0, 5.35, -40.18);
scene.add(customerLabel);

// Trees
function tree(x, z) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,1.8,8), mat(0x80512f));
  trunk.position.set(x,.9,z); trunk.castShadow = true; scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 10), mat(0x39834b));
  crown.position.set(x,2.5,z); crown.castShadow = true; scene.add(crown);
}
for (const z of [-4,-16,-25,-37,-45,-56]) { tree(-9.1,z); tree(9.1,z-2); }

// Player cartoon body
const player = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.75, 4, 8), mat(0x2878d0));
body.position.y = 1.15; body.castShadow = true; player.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), mat(0xffc58e));
head.position.y = 1.95; head.castShadow = true; player.add(head);
const cap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 8, 0, Math.PI*2, 0, Math.PI/2), mat(0xe94b3c));
cap.position.y = 2.18; player.add(cap);
const backpack = new THREE.Mesh(new THREE.BoxGeometry(.65,.75,.25), mat(0xf1c232));
backpack.position.set(0,1.2,.48); player.add(backpack);
scene.add(player);

// Pizza package
const packageMesh = new THREE.Mesh(new THREE.BoxGeometry(.75,.25,.75), mat(0xd99a43));
packageMesh.position.set(-5.4,.35,5.6);
packageMesh.castShadow = true;
scene.add(packageMesh);

// Dog NPC
const dog = new THREE.Group();
const dogBody = new THREE.Mesh(new THREE.BoxGeometry(1.1,.65,.55), mat(0x9b623c));
dogBody.position.y=.55; dog.add(dogBody);
const dogHead = new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.55), mat(0xb77a4a));
dogHead.position.set(0,.95,-.42); dog.add(dogHead);
const ear1 = new THREE.Mesh(new THREE.BoxGeometry(.18,.4,.18), mat(0x633d29));
ear1.position.set(-.2,1.25,-.5); dog.add(ear1);
const ear2 = ear1.clone(); ear2.position.x=.2; dog.add(ear2);
dog.position.set(8,0,-25);
scene.add(dog);

// Markers
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15,.12,8,32), mat(0x25c56b));
ring.rotation.x = Math.PI/2; ring.position.set(-5.4,.18,5.6); scene.add(ring);
const destinationRing = new THREE.Mesh(new THREE.TorusGeometry(2.0,.16,8,32), mat(0x1769ff));
destinationRing.rotation.x = Math.PI/2; destinationRing.position.set(0,.18,-37.8); scene.add(destinationRing);

// -------------------- RAPier PHYSICS --------------------
await RAPIER.init();
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
world.createCollider(RAPIER.ColliderDesc.cuboid(60, .1, 60).setTranslation(0, -.12, 0), groundBody);

// Player rigid body
const playerBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1.3, 8).lockRotations()
);
world.createCollider(RAPIER.ColliderDesc.capsule(.58, .34).setFriction(0), playerBody);

// Static obstacle colliders for building blocks
for (const [x,z,sx,sy,sz] of buildingData) {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, sy/2, z));
  world.createCollider(RAPIER.ColliderDesc.cuboid(sx/2, sy/2, sz/2), rb);
}

// -------------------- EVENT HANDLERS --------------------
events.on('OrderPickedUp', () => {
  hasPackage = true;
  packageMesh.visible = false;
  orderEl.textContent = 'Carrying pizza';
  messageEl.textContent = 'Pizza collected! Deliver it to the blue marker at the house.';
});
events.on('PackageDropped', () => {
  if (!hasPackage) return;
  hasPackage = false;
  packageMesh.visible = true;
  packageMesh.position.set(player.position.x, .35, player.position.z);
  orderEl.textContent = 'Dropped!';
  score = Math.max(0, score - 10);
  scoreEl.textContent = score;
  messageEl.textContent = 'Oh no! You dropped the pizza. Go pick it up again with E.';
});
events.on('DeliveryCompleted', () => {
  hasPackage = false;
  score += 100;
  scoreEl.textContent = score;
  orderEl.textContent = 'Delivered!';
  messageEl.textContent = 'Delivery completed! You earned 100 points. 🎉';
  gameEnded = true;
});
events.on('DogCollision', () => {
  messageEl.textContent = 'A dog startled you! Your pizza is in danger!';
  if (hasPackage) events.emit('PackageDropped');
});
events.on('TimerExpired', () => {
  gameEnded = true;
  messageEl.textContent = 'Time is up! Delivery failed.';
  orderEl.textContent = 'Failed';
});

// Producers: keyboard, proximity checks, timer, dog AI.
window.addEventListener('keydown', (e) => {
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'Space' && !e.repeat) jumpQueued = true;
  if (e.code === 'KeyE' && !e.repeat) events.emit('InteractRequested');
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

events.on('InteractRequested', () => {
  const p = playerBody.translation();
  const restaurantDistance = Math.hypot(p.x + 5.4, p.z - 5.6);
  const houseDistance = Math.hypot(p.x, p.z + 37.8);
  const packageDistance = Math.hypot(p.x - packageMesh.position.x, p.z - packageMesh.position.z);
  if (!hasPackage && !packageMesh.visible && restaurantDistance < 3.2) {
    events.emit('OrderPickedUp');
  } else if (!hasPackage && packageMesh.visible && packageDistance < 3.0) {
    events.emit('OrderPickedUp');
    packageMesh.visible = false;
  } else if (hasPackage && houseDistance < 3.4) {
    events.emit('DeliveryCompleted');
  } else {
    messageEl.textContent = 'Nothing to interact with here. Find the restaurant, pizza, or customer.';
  }
});

let lastTime = performance.now();
let elapsed = 0;
let dogDirection = 1;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  if (!gameEnded) {
    timeLeft -= dt;
    timerEl.textContent = Math.max(0, Math.ceil(timeLeft));
    if (timeLeft <= 0) events.emit('TimerExpired');

    const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const right = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const length = Math.hypot(forward, right) || 1;
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 8 : 5;
    const velocity = playerBody.linvel();
    playerBody.setLinvel({ x: (right/length)*speed, y: velocity.y, z: (-forward/length)*speed }, true);

    if (jumpQueued && Math.abs(velocity.y) < 0.15) {
      playerBody.applyImpulse({x:0,y:5.3,z:0}, true);
      events.emit('PlayerJumped');
    }
    jumpQueued = false;

    world.timestep = dt;
    world.step();
    const pos = playerBody.translation();
    player.position.set(pos.x, pos.y - 1.3, pos.z);
    if (Math.abs(right) + Math.abs(forward) > 0) {
      player.rotation.y = Math.atan2(right, forward);
    }
    if (hasPackage) packageMesh.position.set(pos.x, pos.y + 1.45, pos.z + .55);

    // Emit a movement event at a modest interval to avoid flooding the queue.
    if (Math.floor(elapsed * 4) !== Math.floor((elapsed - dt) * 4) && (Math.abs(right)+Math.abs(forward)>0)) {
      events.emit('PlayerMoved', { x: pos.x, z: pos.z });
    }

    // Simple dog patrol and proximity collision event.
    dog.position.x = 8 + Math.sin(elapsed * 1.3) * 2.2;
    dog.position.z = -25 + Math.cos(elapsed * .7) * 1.4;
    const dogDistance = Math.hypot(pos.x - dog.position.x, pos.z - dog.position.z);
    dogCooldown -= dt;
    if (dogDistance < 1.7 && dogCooldown <= 0) {
      events.emit('DogCollision');
      dogCooldown = 3;
    }

    // Keep player within the playable street area.
    if (pos.x < -11) playerBody.setTranslation({x:-11,y:pos.y,z:pos.z}, true);
    if (pos.x > 11) playerBody.setTranslation({x:11,y:pos.y,z:pos.z}, true);
    if (pos.z > 12) playerBody.setTranslation({x:pos.x,y:pos.y,z:12}, true);
    if (pos.z < -58) playerBody.setTranslation({x:pos.x,y:pos.y,z:-58}, true);
  }

  events.processQueue();

  // Third-person camera follows behind the player.
  const p = player.position;
  const cameraTarget = new THREE.Vector3(p.x, p.y + 1.3, p.z);
  const cameraDesired = new THREE.Vector3(p.x, p.y + 5.0, p.z + 8.5);
  camera.position.lerp(cameraDesired, 1 - Math.pow(0.001, dt));
  camera.lookAt(cameraTarget);

  ring.rotation.z += dt * 0.8;
  destinationRing.rotation.z -= dt * 0.5;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start event
events.emit('GameStarted');

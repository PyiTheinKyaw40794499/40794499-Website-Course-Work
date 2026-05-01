// ── SOUND ENGINE ───────────────────────────────────────────
const SFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function tone(freq, type, duration, vol = 0.3, delay = 0) {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    o.start(c.currentTime + delay);
    o.stop(c.currentTime + delay + duration + 0.05);
  }
  function noise(duration, vol = 0.15) {
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buf; src.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.start(); src.stop(c.currentTime + duration + 0.05);
  }
  return {
    menuClick() { tone(440, 'square', 0.08, 0.2); tone(660, 'square', 0.08, 0.15, 0.08); },
    interact() { tone(300, 'sine', 0.1, 0.2); tone(500, 'sine', 0.1, 0.2, 0.1); },
    collect() { tone(523, 'sine', 0.08, 0.3); tone(659, 'sine', 0.08, 0.3, 0.08); tone(784, 'sine', 0.12, 0.3, 0.16); },
    puzzleSolve() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.15, 0.3, i * 0.1)); },
    puzzleError() { tone(200, 'sawtooth', 0.1, 0.3); tone(150, 'sawtooth', 0.15, 0.3, 0.1); },
    timerWarning() { tone(660, 'square', 0.1, 0.25); tone(660, 'square', 0.1, 0.25, 0.2); },
    timerCritical() { tone(880, 'square', 0.08, 0.3); },
    roomTransition() { [200, 300, 400, 600].forEach((f, i) => tone(f, 'sine', 0.2, 0.25, i * 0.12)); },
    explosion() { noise(0.6, 0.4); tone(80, 'sawtooth', 0.5, 0.4); },
    gameOver() { [400, 350, 300, 200].forEach((f, i) => tone(f, 'sawtooth', 0.3, 0.3, i * 0.2)); },
    victory() { [523, 659, 784, 880, 1047].forEach((f, i) => tone(f, 'sine', 0.25, 0.35, i * 0.12)); },
    useItem() { tone(350, 'square', 0.08, 0.2); tone(500, 'square', 0.08, 0.2, 0.1); },
    step() { tone(120, 'sine', 0.04, 0.05); },
  };
})();

// ── AMBIENT ENGINE ─────────────────────────────────────────
const Ambient = (() => {
  let interval = null;
  let actx = null;
  function getCtx() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    return actx;
  }
  function hum(freq, duration, vol = 0.04) {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    o.start(); o.stop(c.currentTime + duration + 0.1);
  }
  const PATTERNS = [
    () => { hum(60, 3); hum(90, 2, 0.02); },
    () => { hum(80, 3); hum(120, 2, 0.02); },
    () => { hum(55, 3, 0.05); hum(110, 2, 0.02); },
    () => { hum(70, 4, 0.06); hum(140, 3, 0.02); },
  ];
  return {
    start(room) { this.stop(); interval = setInterval(() => PATTERNS[room % 4](), 3000); PATTERNS[room % 4](); },
    stop() { clearInterval(interval); interval = null; }
  };
})();

// ── STAR FIELD INIT ────────────────────────────────────────
(function initStars() {
  const sf = document.getElementById('star-field');
  if (!sf) return;
  for (let i = 0; i < 140; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      width:${size}px; height:${size}px;
      animation-delay:${Math.random() * 4}s;
      animation-duration:${2 + Math.random() * 3}s;
    `;
    sf.appendChild(s);
  }
})();

// ── GAME STATE ─────────────────────────────────────────────
const G = {
  state: 'idle',
  room: 0,
  timer: 60,
  score: 0,
  inventory: [],
  stats: { startTime: 0, wrong: 0, itemsUsed: 0, roomsCompleted: 0 },
  timerInterval: null,
  ROOM_TIME: 60,
  ROOMS: [
    { name: 'ENGINEERING BAY', icon: '⚙️', color: '#00ffcc' },
    { name: 'POWER CONTROL', icon: '⚡', color: '#ffcc00' },
    { name: 'RESEARCH LAB', icon: '🔬', color: '#ff44cc' },
    { name: 'ESCAPE POD BAY', icon: '🚀', color: '#00ff88' },
  ],
};

// ── CANVAS SETUP ───────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const TILE = 48;

const ROOM_MAPS = [
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [{ id: 'override_chip', icon: '💾', name: 'CHIP', tx: 6, ty: 6 }],
    terminal: { tx: 7, ty: 9 }
  },
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [{ id: 'data_tablet', icon: '📟', name: 'TABLET', tx: 7, ty: 5 }],
    terminal: { tx: 7, ty: 7 }
  },
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [{ id: 'stabilizer_key', icon: '🔑', name: 'KEY', tx: 6, ty: 4 }],
    terminal: { tx: 7, ty: 6 }
  },
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [],
    terminal: { tx: 7, ty: 5 }
  }
];

let player = { x: 2, y: 2, px: 2 * TILE, py: 2 * TILE };
let roomItems = [];
let keys = {};
let rafId, lastMove = 0, activePuzzle = null;

// ── CANVAS RESIZE ──────────────────────────────────────────
function resizeCanvas() {
  const wrap = document.getElementById('game-wrap');
  const invW = (G.state === 'playing' || G.state === 'puzzle') ? 100 : 0;
  canvas.width = wrap.clientWidth - invW;
  canvas.height = wrap.clientHeight;
}

// ── COLORS ─────────────────────────────────────────────────
const COLORS = { wall: '#0a2233', floor: '#060d14', terminal: '#00ffcc', item: '#ffcc00' };

// ── DRAW ───────────────────────────────────────────────────
function drawGame() {
  if (G.state !== 'playing' && G.state !== 'puzzle') return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const roomDef = ROOM_MAPS[G.room];
  const map = roomDef.map;
  const rows = map.length, cols = map[0].length;
  const offX = Math.floor((canvas.width - cols * TILE) / 2);
  const offY = Math.floor((canvas.height - rows * TILE) / 2);

  // Grid tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = map[r][c], x = offX + c * TILE, y = offY + r * TILE;
      ctx.fillStyle = t === 1 ? COLORS.wall : COLORS.floor;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = t === 1 ? 'rgba(0,50,80,0.5)' : 'rgba(0,80,100,0.15)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      if (t === 1) {
        ctx.fillStyle = '#0d2235';
        ctx.fillRect(x + 2, y + 2, 6, 6);
        ctx.fillRect(x + TILE - 8, y + TILE - 8, 6, 6);
      }
    }
  }

  // Terminal
  const term = roomDef.terminal;
  const termX = offX + term.tx * TILE, termY = offY + term.ty * TILE;
  const glow = Math.sin(Date.now() / 400) * 0.5 + 0.5;
  ctx.shadowColor = COLORS.terminal; ctx.shadowBlur = 8 + glow * 12;
  ctx.fillStyle = 'rgba(0,80,80,0.9)';
  ctx.fillRect(termX + 4, termY + 4, TILE - 8, TILE - 8);
  ctx.strokeStyle = COLORS.terminal; ctx.lineWidth = 2;
  ctx.strokeRect(termX + 4, termY + 4, TILE - 8, TILE - 8);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#080118'; ctx.font = '20px monospace'; ctx.textAlign = 'center';
  ctx.fillText('⚡', termX + TILE / 2, termY + TILE / 2 + 7);

  // Items
  roomItems.forEach(item => {
    const ix = offX + item.tx * TILE, iy = offY + item.ty * TILE;
    const bounce = Math.sin(Date.now() / 300) * 3;
    ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 14;
    ctx.font = '24px monospace'; ctx.textAlign = 'center';
    ctx.fillText(item.icon, ix + TILE / 2, iy + TILE / 2 + 4 + bounce);
    ctx.shadowBlur = 0;
  });

  // Player
  const ppx = offX + player.px, ppy = offY + player.py;
  ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 12;
  // Body
  ctx.fillStyle = '#004466';
  ctx.fillRect(ppx + 10, ppy + 14, TILE - 20, TILE - 18);
  // Helmet
  ctx.fillStyle = '#00ffcc';
  ctx.fillRect(ppx + 12, ppy + 4, TILE - 24, 12);
  ctx.fillStyle = 'rgba(150,255,255,0.4)';
  ctx.fillRect(ppx + 13, ppy + 5, TILE - 26, 10);
  // Suit detail
  ctx.fillStyle = '#ff00cc';
  ctx.fillRect(ppx + 14, ppy + 20, 5, 5);
  // Legs
  ctx.fillStyle = '#003344';
  ctx.fillRect(ppx + 10, ppy + TILE - 14, 10, 10);
  ctx.fillRect(ppx + TILE - 20, ppy + TILE - 14, 10, 10);
  ctx.shadowBlur = 0;

  // Interaction hint
  if (G.state === 'playing') {
    const near = getNearInteractable(offX, offY);
    if (near) {
      ctx.save();
      ctx.font = "bold 9px 'Press Start 2P',monospace";
      ctx.fillStyle = '#f5e000'; ctx.shadowColor = '#f5e000'; ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText('[E] ' + (near.type === 'terminal' ? 'ACTIVATE' : 'PICK UP'), offX + near.tx * TILE + TILE / 2, offY + near.ty * TILE - 8);
      ctx.restore();
    }
  }
}

function getNearInteractable(offX, offY) {
  const term = ROOM_MAPS[G.room].terminal;
  const px = Math.round(player.px / TILE), py = Math.round(player.py / TILE);
  const d = (a, b) => Math.abs(a - b);
  if (d(px, term.tx) <= 1 && d(py, term.ty) <= 1) return { tx: term.tx, ty: term.ty, type: 'terminal' };
  for (const item of roomItems)
    if (d(px, item.tx) <= 1 && d(py, item.ty) <= 1) return { tx: item.tx, ty: item.ty, type: 'item', item };
  return null;
}

// ── MOVEMENT ───────────────────────────────────────────────
function movePlayer() {
  if (G.state !== 'playing') return;
  const now = Date.now(); if (now - lastMove < 130) return;
  const map = ROOM_MAPS[G.room].map;
  let nx = player.px, ny = player.py;
  if (keys['ArrowUp'] || keys['w'] || keys['W']) ny -= TILE;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) ny += TILE;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) nx -= TILE;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) nx += TILE;
  const col = Math.round(nx / TILE), row = Math.round(ny / TILE);
  if (row >= 0 && row < map.length && col >= 0 && col < map[0].length && map[row][col] !== 1) {
    player.px = nx; player.py = ny; player.x = col; player.y = row; lastMove = now;
  }
}

// ── GAME LOOP ──────────────────────────────────────────────
function gameLoop() { movePlayer(); drawGame(); rafId = requestAnimationFrame(gameLoop); }

// ── TIMER — runs during 'playing' AND 'puzzle' ─────────────
function startTimer() {
  clearInterval(G.timerInterval);
  G.timerInterval = setInterval(() => {
    if (G.state !== 'playing' && G.state !== 'puzzle') return;
    G.timer--;
    updateHUD();
    if (G.timer === 20) SFX.timerWarning();
    if (G.timer <= 10 && G.timer > 0) SFX.timerCritical();
    // Show warning in puzzle overlay
    const warn = document.getElementById('puzzle-timer-warning');
    if (warn) warn.style.display = G.timer <= 10 ? 'block' : 'none';
    if (G.timer <= 0) {
      clearInterval(G.timerInterval);
      document.getElementById('puzzle-overlay').classList.add('hidden');
      triggerGameOver();
    }
  }, 1000);
}

function updateHUD() {
  const el = document.getElementById('hud-timer');
  if (!el) return;
  el.textContent = G.timer;
  el.className = 'hud-timer';
  if (G.timer <= 10) el.classList.add('critical');
  else if (G.timer <= 20) el.classList.add('warning');
  document.getElementById('hud-score').textContent = G.score.toLocaleString() + ' PTS';
  document.getElementById('hud-room').textContent = G.ROOMS[G.room].icon + ' ' + G.ROOMS[G.room].name;
  const badge = document.getElementById('hud-room-badge');
  if (badge) badge.textContent = (G.room + 1) + '/4';
}

// ── START ─────────────────────────────────────────────────
function startGame() {
  SFX.menuClick();
  G.room = 0; G.timer = G.ROOM_TIME; G.score = 0; G.inventory = [];
  G.stats = { startTime: Date.now(), wrong: 0, itemsUsed: 0, roomsCompleted: 0 };
  G.state = 'playing';
  player = { x: 2, y: 2, px: 2 * TILE, py: 2 * TILE };
  roomItems = [...ROOM_MAPS[0].items];
  document.getElementById('idle-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('victory-screen').classList.add('hidden');
  document.getElementById('inventory').style.display = 'flex';
  document.getElementById('controls-hint').style.display = 'flex';
  updateHUD(); renderInventory(); startTimer();
  cancelAnimationFrame(rafId); gameLoop();
  setTimeout(() => Ambient.start(0), 300);
}

// ── NEXT ROOM ─────────────────────────────────────────────
function goNextRoom() {
  SFX.roomTransition(); Ambient.stop();
  G.room++; G.timer = G.ROOM_TIME;
  player = { x: 2, y: 2, px: 2 * TILE, py: 2 * TILE };
  roomItems = [...ROOM_MAPS[G.room].items];
  G.state = 'transition';
  const ts = document.getElementById('transition-screen');
  ts.querySelector('.screen-title').textContent = G.ROOMS[G.room].icon + ' ' + G.ROOMS[G.room].name;
  ts.classList.remove('hidden');
  setTimeout(() => {
    ts.classList.add('hidden');
    G.state = 'playing'; updateHUD();
    Ambient.start(G.room);
  }, 2500);
}

// ── GAME OVER ─────────────────────────────────────────────
function triggerGameOver() {
  G.state = 'gameover'; clearInterval(G.timerInterval); Ambient.stop();
  SFX.explosion(); setTimeout(() => SFX.gameOver(), 600);
  const elapsed = Math.round((Date.now() - G.stats.startTime) / 1000);
  saveScore(false, G.score, elapsed);
  const s = document.getElementById('gameover-screen');
  s.querySelector('#go-score').textContent = G.score.toLocaleString() + ' PTS';
  s.querySelector('#go-rooms').textContent = G.stats.roomsCompleted + ' / 4';
  s.querySelector('#go-wrong').textContent = G.stats.wrong;
  s.classList.remove('hidden');
  document.getElementById('inventory').style.display = 'none';
  document.getElementById('controls-hint').style.display = 'none';
}

// ── VICTORY ───────────────────────────────────────────────
function triggerVictory() {
  G.state = 'victory'; clearInterval(G.timerInterval); Ambient.stop();
  SFX.victory();
  const elapsed = Math.round((Date.now() - G.stats.startTime) / 1000);
  const bonus = Math.max(0, 300 - elapsed) * 5;
  const penalty = G.stats.wrong * 50;
  G.score = G.score + bonus - penalty + 1000;
  saveScore(true, G.score, elapsed);
  const s = document.getElementById('victory-screen');
  s.querySelector('#vic-score').textContent = G.score.toLocaleString() + ' PTS';
  s.querySelector('#vic-rooms').textContent = G.stats.roomsCompleted + ' / 4';
  s.querySelector('#vic-time').textContent = elapsed + 's';
  s.querySelector('#vic-wrong').textContent = G.stats.wrong;
  s.classList.remove('hidden');
  document.getElementById('inventory').style.display = 'none';
  document.getElementById('controls-hint').style.display = 'none';
}

// ── SAVE SCORE ─────────────────────────────────────────────
function saveScore(won, score, elapsed) {
  if (typeof Auth === 'undefined') return;
  const sess = Auth.getSession(); if (!sess) return;
  const users = Auth.getUsers();
  const idx = users.findIndex(u => u.email === sess.email); if (idx === -1) return;
  if (!users[idx].scores) users[idx].scores = [];
  users[idx].scores.unshift({ score, won, rooms: G.stats.roomsCompleted, time: elapsed, date: new Date().toISOString() });
  Auth.saveUsers(users);
}

// ── ITEM DEFINITIONS ───────────────────────────────────────
const ITEM_INFO = {
  override_chip: {
    icon: '💾',
    name: 'OVERRIDE CHIP',
    rarity: '★★★ RARE',
    desc: 'A military-grade bypass module extracted from the corrupted core processor.',
    use: 'Power Grid Puzzle\nBypasses alignment instantly. No rotation needed.'
  },
  data_tablet: {
    icon: '📟',
    name: 'DATA TABLET',
    rarity: '★★☆ UNCOMMON',
    desc: 'Encrypted crew tablet with decryption logs recorded before the AI went rogue.',
    use: 'Code Decrypt Puzzle\nReveals the correct symbol sequence. Auto-solves cipher.'
  },
  stabilizer_key: {
    icon: '🔑',
    name: 'STABILIZER KEY',
    rarity: '★★☆ UNCOMMON',
    desc: 'Emergency reactor key. Physically locks plasma flow to safe operating levels.',
    use: 'Reactor Stabilize Puzzle\nLocks all reactor values into the safe zone instantly. The last number for the = 4 9'
  }
};

// ── INVENTORY ─────────────────────────────────────────────
function renderInventory() {
  const panel = document.getElementById('inv-slots');
  panel.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    slot.className = 'inv-slot';
    const item = G.inventory[i];
    if (item) {
      slot.classList.add('has-item');
      slot.innerHTML = `<span style="font-size:28px">${item.icon}</span><span class="item-name">${item.name}</span>`;
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        showItemPopup(item, slot);
      });
    }
    panel.appendChild(slot);
  }
}

function collectItem(item) {
  SFX.collect();
  G.inventory.push(item); G.score += 150;
  roomItems = roomItems.filter(i => i.id !== item.id);
  renderInventory(); updateHUD();
}


// ── ITEM POPUP ─────────────────────────────────────────────
function showItemPopup(item, slotEl) {
  const info = ITEM_INFO[item.id];
  if (!info) return;

  document.getElementById('item-popup-icon').textContent = info.icon;
  document.getElementById('item-popup-name').textContent = info.name;
  document.getElementById('item-popup-rarity').textContent = info.rarity;
  document.getElementById('item-popup-desc').textContent = info.desc;
  document.getElementById('item-popup-use').innerHTML = info.use.replace(/\n/g, '<br>');

  const popup = document.getElementById('item-popup');
  const wrap = document.getElementById('game-wrap');
  const rect = slotEl.getBoundingClientRect();
  const wRect = wrap.getBoundingClientRect();

  popup.style.display = 'block';

  let left = rect.left - wRect.left - 250;  // appear to the left of inventory
  let top = rect.top - wRect.top;
  if (left < 8) left = 8;
  if (top + 320 > wrap.clientHeight) top = Math.max(8, wrap.clientHeight - 328);

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
}

function closeItemPopup() {
  const popup = document.getElementById('item-popup');
  if (popup) popup.style.display = 'none';
}

// Close when clicking outside
document.addEventListener('click', (e) => {
  const popup = document.getElementById('item-popup');
  if (!popup || popup.style.display === 'none') return;
  if (!popup.contains(e.target) && !e.target.closest('.inv-slot')) {
    closeItemPopup();
  }
});

// ── PUZZLE HELPERS ─────────────────────────────────────────
function openPuzzle() {
  SFX.interact();
  activePuzzle = G.room; G.state = 'puzzle';
  document.getElementById('puzzle-overlay').classList.remove('hidden');
  const warn = document.getElementById('puzzle-timer-warning');
  if (warn) warn.style.display = 'none';
  const fns = [powerGridPuzzle, codeDecryptPuzzle, reactorPuzzle, escapePodPuzzle];
  fns[G.room]();
}

function closePuzzle() {
  activePuzzle = null; G.state = 'playing';
  document.getElementById('puzzle-overlay').classList.add('hidden');
}

function onSolved(bypassed = false) {
  SFX.puzzleSolve();
  G.score += bypassed ? 200 : (500 + G.timer * 10);
  G.stats.roomsCompleted++;
  if (bypassed) { SFX.useItem(); G.stats.itemsUsed++; }
  closePuzzle(); updateHUD();
  if (G.room >= 3) triggerVictory();
  else { goNextRoom(); startTimer(); }
}

function onWrong() {
  SFX.puzzleError();
  G.stats.wrong++;
  G.timer = Math.max(1, G.timer - 10);
  updateHUD();
}

// ── PUZZLE 0: POWER GRID ───────────────────────────────────
function powerGridPuzzle() {
  const nodes = [0, 1, 2, 3]; // 4 nodes: 0=right(→), 1=down(↓), 2=left(←), 3=up(↑)
  const CORRECT = [0, 0, 0, 0]; // all facing → (right = toward core)
  const ARROWS = ['→', '↓', '←', '↑'];
  const LABELS = ['NODE A', 'NODE B', 'NODE C', 'NODE D'];
  const box = document.getElementById('puzzle-content');
  const hasChip = G.inventory.some(i => i.id === 'override_chip');

  function render() {
    const aligned = nodes.every((v, i) => v === CORRECT[i]);
    box.innerHTML = `
      <p class="puzzle-title">⚡ POWER GRID ALIGNMENT</p>
      <p class="puzzle-desc">Rotate all 4 energy nodes to face the CORE (→). Align them to restore power.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
        ${nodes.map((dir, i) => `
          <button onclick="pgRotate(${i})" style="
            font-family:'Press Start 2P',monospace;
            padding:20px 12px 10px;
            background:${dir === 0 ? 'rgba(0,255,100,0.15)' : 'rgba(0,30,50,0.85)'};
            border:2px solid ${dir === 0 ? '#00ff88' : '#00cccc'};
            border-radius:6px;cursor:pointer;
            display:flex;flex-direction:column;align-items:center;gap:10px;
            transition:all 0.2s">
            <span style="
              font-size:22px;color:${dir === 0 ? '#00ff88' : '#00cccc'};
              text-shadow:0 0 10px ${dir === 0 ? '#00ff88' : '#00cccc'};
              display:inline-block;
              transform:rotate(${dir * 90}deg);
              transition:transform 0.2s">→</span>
            <span style="font-size:6px;color:#446655;letter-spacing:1px">${LABELS[i]}</span>
          </button>`).join('')}
      </div>
      <div style="
        font-family:'Press Start 2P',monospace;font-size:8px;
        color:${aligned ? '#00ff88' : '#ff4444'};
        text-align:center;padding:10px 0;margin-bottom:14px">
        CORE STATUS: ${aligned ? '✓ ALIGNED' : '✗ MISALIGNED'}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button onclick="pgCheck()" style="
          font-family:'Press Start 2P',monospace;font-size:8px;
          color:#000;background:#00ffcc;
          border:2px solid #00ffcc;border-radius:4px;
          padding:12px 20px;cursor:pointer;
          box-shadow:0 0 10px rgba(0,255,200,0.5)">
          ACTIVATE CORE
        </button>
        ${hasChip ? `<button onclick="pgBypass()" style="
          font-family:'Press Start 2P',monospace;font-size:8px;
          color:#000;background:#f5e000;
          border:2px solid #f5e000;border-radius:4px;
          padding:12px 20px;cursor:pointer;
          box-shadow:0 0 10px rgba(245,224,0,0.5)">
          💾 USE OVERRIDE CHIP
        </button>` : ''}
      </div>`;
  }

  window.pgRotate = function (i) {
    nodes[i] = (nodes[i] + 1) % 4;
    render();
  };
  window.pgCheck = function () {
    if (nodes.every((v, i) => v === CORRECT[i])) {
      onSolved();
    } else {
      onWrong();
      // Flash feedback
      const status = box.querySelector('[data-status]');
    }
  };
  window.pgBypass = function () {
    G.inventory = G.inventory.filter(i => i.id !== 'override_chip');
    renderInventory();
    onSolved(true);
  };

  render();
}
// ── PUZZLE 1: CODE DECRYPT ─────────────────────────────────
function codeDecryptPuzzle() {
  const SYMBOLS = ['◈', '◉', '◊', '⊕', '⊗', '⊞'], SECRET = [0, 3, 2, 5];
  let input = [];
  const hasTablet = G.inventory.some(i => i.id === 'data_tablet');
  const box = document.getElementById('puzzle-content');
  function render() {
    box.innerHTML = `
      <p class="puzzle-title">🔐 CODE DECRYPT</p>
      <p class="puzzle-desc">Match the alien sequence from the wall</p>
      ${hasTablet ? `<div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#f5e000;background:rgba(245,224,0,0.08);border:1px solid #f5e000;border-radius:4px;padding:8px;margin-bottom:10px">📟 TABLET HINT: ${SECRET.map(i => SYMBOLS[i]).join(' ')}</div>` : ''}
      <div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px">
        ${Array(4).fill(0).map((_, i) => `<div style="width:48px;height:48px;background:rgba(0,200,200,0.1);border:2px solid ${i < input.length ? '#f5e000' : 'rgba(0,200,200,0.3)'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#f5e000">${i < input.length ? SYMBOLS[input[i]] : '?'}</div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:14px">
        ${SYMBOLS.map((s, i) => `<button onclick="cdInput(${i})" style="font-size:18px;padding:10px 4px;background:rgba(0,30,50,0.9);border:2px solid rgba(0,200,200,0.4);border-radius:4px;cursor:pointer;color:#00cccc;transition:all 0.15s">${s}</button>`).join('')}
      </div>
      <div id="cd-feedback" style="font-family:'Press Start 2P',monospace;font-size:7px;text-align:center;min-height:20px;margin-bottom:10px"></div>
      <div style="display:flex;gap:8px">
        <button onclick="cdClear()" style="font-family:'Press Start 2P',monospace;font-size:7px;padding:10px 14px;background:rgba(0,50,80,0.8);border:1px solid rgba(0,200,200,0.3);border-radius:4px;cursor:pointer;color:#8899aa">CLEAR</button>
        ${hasTablet ? `<button onclick="cdHint()" style="font-family:'Press Start 2P',monospace;font-size:7px;padding:10px 14px;background:#f5e000;border:2px solid #f5e000;border-radius:4px;cursor:pointer;color:#000">📟 AUTO-SOLVE</button>` : ''}
      </div>`;
  }
  window.cdInput = function (i) {
    if (input.length >= 4) return; input.push(i); render();
    if (input.length === 4) {
      setTimeout(() => {
        const fb = document.getElementById('cd-feedback');
        if (input.every((v, j) => v === SECRET[j])) { if (fb) { fb.textContent = '✓ CODE ACCEPTED'; fb.style.color = '#00ff88'; } setTimeout(() => onSolved(), 400); }
        else { if (fb) { fb.textContent = '✗ WRONG CODE — -10s PENALTY'; fb.style.color = '#ff4444'; } onWrong(); input = []; render(); }
      }, 300);
    }
  };
  window.cdClear = function () { input = []; render(); };
  window.cdHint = function () { G.inventory = G.inventory.filter(i => i.id !== 'data_tablet'); renderInventory(); input = [...SECRET]; render(); setTimeout(() => onSolved(true), 600); };
  render();
}

// ── PUZZLE 2: REACTOR STABILIZE ────────────────────────────
function reactorPuzzle() {
  const values = [30, 70, 50], targets = [55, 55, 55], range = 10;
  let stableTime = 0, stableInterval = null;
  const hasKey = G.inventory.some(i => i.id === 'stabilizer_key');
  const box = document.getElementById('puzzle-content');
  const isStable = () => values.every((v, i) => Math.abs(v - targets[i]) <= range);
  function render() {
    box.innerHTML = `
      <p class="puzzle-title">⚛️ REACTOR STABILIZE</p>
      <p class="puzzle-desc">Balance PLASMA, COOLANT, OUTPUT into safe zone (45–65%). Hold 5 seconds.</p>
      ${['PLASMA', 'COOLANT', 'OUTPUT'].map((label, i) => {
      const ok = Math.abs(values[i] - targets[i]) <= range;
      return `<div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-family:'Press Start 2P',monospace;font-size:7px;color:#8899aa;margin-bottom:6px">
            <span>${label}</span><span style="color:${ok ? '#00ff88' : '#ff4444'}">${values[i]}% ${ok ? '✓ SAFE' : '✗ DANGER'}</span>
          </div>
          <div style="position:relative;height:20px">
            <div style="position:absolute;left:45%;right:35%;top:0;bottom:0;background:rgba(0,255,100,0.15);border:1px solid rgba(0,255,100,0.3)"></div>
            <input type="range" min="0" max="100" value="${values[i]}" oninput="rsSlide(${i},this.value)" style="width:100%;accent-color:${ok ? '#00ff88' : '#ff4400'};position:relative;z-index:1">
          </div>
        </div>`;
    }).join('')}
      <p style="font-family:'Press Start 2P',monospace;font-size:7px;color:${stableTime > 0 ? '#00ff88' : '#446655'};margin-top:8px;text-align:center">
        ${stableTime > 0 ? `HOLDING... ${'█'.repeat(stableTime)}${'░'.repeat(5 - stableTime)} ${stableTime}/5s` : 'All green = STABLE — hold 5 seconds'}
      </p>
      ${hasKey ? `<button onclick="rsKey()" style="font-family:'Press Start 2P',monospace;font-size:7px;padding:10px 14px;background:#f5e000;border:2px solid #f5e000;border-radius:4px;cursor:pointer;color:#000;margin-top:10px">🔑 USE STABILIZER KEY</button>` : ''}`;
  }
  window.rsSlide = function (i, v) {
    values[i] = parseInt(v); render(); clearInterval(stableInterval); stableTime = 0;
    if (isStable()) {
      stableInterval = setInterval(() => {
        if (!isStable()) { clearInterval(stableInterval); stableTime = 0; render(); return; }
        stableTime++; render(); if (stableTime >= 5) { clearInterval(stableInterval); onSolved(); }
      }, 1000);
    }
  };
  window.rsKey = function () { clearInterval(stableInterval); G.inventory = G.inventory.filter(i => i.id !== 'stabilizer_key'); renderInventory(); onSolved(true); };
  render();
}

// ── PUZZLE 3: ESCAPE POD ───────────────────────────────────
function escapePodPuzzle() {
  const LAUNCH_CODE = '7749'; let codeInput = '';
  const box = document.getElementById('puzzle-content');
  const card1 = G.inventory.some(i => i.id === 'override_chip');
  const card2 = G.inventory.some(i => i.id === 'data_tablet');
  function render() {
    box.innerHTML = `
      <p class="puzzle-title">🚀 ESCAPE POD</p>
      <p class="puzzle-desc">Insert keycards collected from earlier rooms, then enter the launch code.</p>
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <div style="flex:1;padding:10px;border-radius:6px;font-family:'Press Start 2P',monospace;font-size:7px;
          border:1px solid ${card1 ? '#00ff88' : '#888'};
          color:${card1 ? '#00ff88' : '#aaa'};
          background:${card1 ? 'rgba(0,255,100,0.08)' : 'rgba(255,255,255,0.03)'};
          text-align:center">
          ${card1 ? '✓ READY' : 'OPTIONAL'}
          <br><span style="font-size:5px;color:#8899aa;margin-top:4px;display:block">Override Chip</span>
        </div>
        <div style="flex:1;padding:10px;border-radius:6px;font-family:'Press Start 2P',monospace;font-size:7px;
          border:1px solid ${card2 ? '#00ff88' : '#888'};
          color:${card2 ? '#00ff88' : '#aaa'};
          background:${card2 ? 'rgba(0,255,100,0.08)' : 'rgba(255,255,255,0.03)'};
          text-align:center">
          ${card2 ? '✓ READY' : 'OPTIONAL'}
        <br><span style="font-size:5px;color:#8899aa;margin-top:4px;display:block">Data Tablet</span>
      </div>
</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#ffcc88;background:rgba(255,200,0,0.06);border:1px solid rgba(255,200,0,0.25);border-radius:4px;padding:10px;margin-bottom:14px;line-height:1.8">
        💡 HINT: Launch code found in Research Lab.<br>Reactor temp threshold = 7 7 _ _.
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:14px">
        ${Array(4).fill(0).map((_, i) => `<div style="width:44px;height:44px;background:rgba(0,200,200,0.1);border:2px solid ${i < codeInput.length ? '#00ffcc' : 'rgba(0,200,200,0.3)'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'Press Start 2P',monospace;font-size:16px;color:#00ffcc">${codeInput[i] !== undefined ? '●' : '○'}</div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px;margin-bottom:10px">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => `<button onclick="epKey('${k}')" style="font-family:'Press Start 2P',monospace;font-size:10px;padding:10px;background:rgba(0,200,200,0.08);border:1px solid rgba(0,200,200,0.25);border-radius:4px;cursor:pointer;color:#fff">${k}</button>`).join('')}
      </div>
      <div id="ep-msg" style="font-family:'Press Start 2P',monospace;font-size:7px;min-height:18px;color:#ff4444"></div>`;
  }
  window.epKey = function (k) {
    if (k === '⌫') { codeInput = codeInput.slice(0, -1); render(); return; }
    if (k === '' || codeInput.length >= 4) return;

    codeInput += k;
    render();

    if (codeInput.length === 4) {
      setTimeout(() => {
        const msg = document.getElementById('ep-msg');

        if (codeInput === LAUNCH_CODE) {
          // ✅ Bonus based on items (optional system)
          let bonus = 0;
          if (card1) bonus += 300;
          if (card2) bonus += 300;

          G.score += bonus;

          if (msg) {
            msg.textContent = bonus > 0
              ? `✓ LAUNCH SUCCESS — BONUS +${bonus}`
              : '✓ LAUNCH SUCCESS — NO BONUS';
            msg.style.color = '#00ff88';
          }

          setTimeout(() => onSolved(), 500);
        } else {
          if (msg) msg.textContent = '✗ INVALID CODE — -10s PENALTY';
          onWrong();
          codeInput = '';
          render();
        }
      }, 300);
    }
  };
  render();
}

// ── KEYBOARD ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if ((e.key === 'e' || e.key === 'E') && G.state === 'playing') {
    const offX = Math.floor((canvas.width - ROOM_MAPS[G.room].map[0].length * TILE) / 2);
    const offY = Math.floor((canvas.height - ROOM_MAPS[G.room].map.length * TILE) / 2);
    const near = getNearInteractable(offX, offY);
    if (near) { if (near.type === 'terminal') openPuzzle(); if (near.type === 'item') collectItem(near.item); }
  }
  if (e.key === 'Escape') closePuzzle();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Auth !== 'undefined') {
    const sess = Auth.getSession();
    if (!sess) { sessionStorage.setItem('afterLogin', 'game.html'); window.location.href = 'index.html?login=1'; return; }
    document.getElementById('hud-user').textContent = '👤 ' + sess.username;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  cancelAnimationFrame(rafId);
  gameLoop();
});
// ── GAME STATE ─────────────────────────────────────────────
const G = {
    state: 'idle',
    room: 0,
    timer: 60,
    score: 0,
    inventory: [],
    stats: {
        startTime: 0,
        wrong: 0,
        itemsUsed: 0,
        roomsCompleted: 0
    },
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
let rafId;
let lastMove = 0;
let activePuzzle = null;

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
    const rows = map.length;
    const cols = map[0].length;
    const offX = Math.floor((canvas.width - cols * TILE) / 2);
    const offY = Math.floor((canvas.height - rows * TILE) / 2);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const t = map[r][c];
            const x = offX + c * TILE, y = offY + r * TILE;
            ctx.fillStyle = t === 1 ? COLORS.wall : COLORS.floor;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = t === 1 ? 'rgba(0,50,80,0.5)' : 'rgba(0,80,100,0.15)';
            ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        }
    }

    // Terminal
    const term = roomDef.terminal;
    const termX = offX + term.tx * TILE, termY = offY + term.ty * TILE;
    ctx.fillStyle = COLORS.terminal;
    ctx.shadowColor = COLORS.terminal;
    ctx.shadowBlur = 14;
    ctx.fillRect(termX + 6, termY + 6, TILE - 12, TILE - 12);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#080118';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', termX + TILE / 2, termY + TILE / 2 + 7);

    // Items
    roomItems.forEach(item => {
        const ix = offX + item.tx * TILE, iy = offY + item.ty * TILE;
        ctx.fillStyle = 'rgba(255,200,0,0.15)';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.fillRect(ix + 4, iy + 4, TILE - 8, TILE - 8);
        ctx.shadowBlur = 0;
        ctx.font = '22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, ix + TILE / 2, iy + TILE / 2 + 8);
    });

    // Player
    const ppx = offX + player.px, ppy = offY + player.py;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(ppx + 6, ppy + 6, TILE - 12, TILE - 12);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#080118';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🧑‍🚀', ppx + TILE / 2, ppy + TILE / 2 + 6);

    // Hint
    const near = getNearInteractable(offX, offY);
    if (near) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(near.x - 34, near.y - 30, 76, 22);
        ctx.fillStyle = '#fff';
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('[E] INTERACT', near.x, near.y - 14);
    }
}

function getNearInteractable(offX, offY) {
    const term = ROOM_MAPS[G.room].terminal;
    const px = Math.round(player.px / TILE), py = Math.round(player.py / TILE);
    const dist = (a, b) => Math.abs(a - b);
    if (dist(px, term.tx) <= 1 && dist(py, term.ty) <= 1) return { x: offX + term.tx * TILE + TILE / 2, y: offY + term.ty * TILE, type: 'terminal' };
    for (const item of roomItems) if (dist(px, item.tx) <= 1 && dist(py, item.ty) <= 1) return { x: offX + item.tx * TILE + TILE / 2, y: offY + item.ty * TILE, type: 'item', item };
    return null;
}

// ── MOVEMENT ───────────────────────────────────────────────
function movePlayer() {
    if (G.state !== 'playing') return;
    const now = Date.now();
    if (now - lastMove < 130) return;
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
function gameLoop() {
    movePlayer();
    drawGame();
    rafId = requestAnimationFrame(gameLoop);
}

// ── TIMER ─────────────────────────────────────────────────
function startTimer() {
    clearInterval(G.timerInterval);
    G.timerInterval = setInterval(() => {
        if (G.state !== 'playing') return;
        G.timer--;
        updateHUD();
        if (G.timer <= 0) {
            clearInterval(G.timerInterval);
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
}

// ── START / RESTART ────────────────────────────────────────
function startGame() {
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
}

// ── NEXT ROOM ─────────────────────────────────────────────
function goNextRoom() {
    G.room++;
    G.timer = G.ROOM_TIME;
    player = { x: 2, y: 2, px: 2 * TILE, py: 2 * TILE };
    roomItems = [...ROOM_MAPS[G.room].items];
    G.state = 'transition';
    const ts = document.getElementById('transition-screen');
    ts.querySelector('.screen-title').textContent = G.ROOMS[G.room].icon + ' ' + G.ROOMS[G.room].name;
    ts.classList.remove('hidden');
    setTimeout(() => {
        ts.classList.add('hidden');
        G.state = 'playing';
        updateHUD();
    }, 2500);
}

// ── GAME OVER ─────────────────────────────────────────────
function triggerGameOver() {
    G.state = 'gameover';
    clearInterval(G.timerInterval);
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
    G.state = 'victory';
    clearInterval(G.timerInterval);
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
    const sess = Auth.getSession();
    if (!sess) return;
    const users = Auth.getUsers();
    const idx = users.findIndex(u => u.email === sess.email);
    if (idx === -1) return;
    if (!users[idx].scores) users[idx].scores = [];
    users[idx].scores.unshift({ score, won, rooms: G.stats.roomsCompleted, time: elapsed, date: new Date().toISOString() });
    Auth.saveUsers(users);
}

// ── INVENTORY ─────────────────────────────────────────────
function renderInventory() {
    const panel = document.getElementById('inv-slots');
    panel.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot';
        const item = G.inventory[i];
        if (item) {
            slot.textContent = item.icon;
            slot.innerHTML += `<span class="item-name">${item.name}</span>`;
            slot.title = item.name;
        }
        panel.appendChild(slot);
    }
}

function collectItem(item) {
    G.inventory.push(item);
    G.score += 150;
    roomItems = roomItems.filter(i => i.id !== item.id);
    renderInventory();
    updateHUD();
}

// ── PUZZLE HELPERS ─────────────────────────────────────────
function openPuzzle() {
    activePuzzle = G.room;
    G.state = 'puzzle';
    document.getElementById('puzzle-overlay').classList.remove('hidden');
    const fns = [powerGridPuzzle, codeDecryptPuzzle, reactorPuzzle, escapePodPuzzle];
    fns[G.room]();
}

function closePuzzle() {
    activePuzzle = null;
    G.state = 'playing';
    document.getElementById('puzzle-overlay').classList.add('hidden');
}

function onSolved(bypassed = false) {
    G.score += bypassed ? 200 : (500 + G.timer * 10);
    G.stats.roomsCompleted++;
    if (bypassed) G.stats.itemsUsed++;
    closePuzzle();
    updateHUD();
    if (G.room >= 3) triggerVictory();
    else { goNextRoom(); startTimer(); }
}

function onWrong() {
    G.stats.wrong++;
    G.timer = Math.max(1, G.timer - 10);
    updateHUD();
}

// ── PUZZLE 0: POWER GRID ───────────────────────────────────
function powerGridPuzzle() {
    const nodes = [0, 1, 2, 3, 0, 2, 1, 3, 2];
    const box = document.getElementById('puzzle-content');
    const hasChip = G.inventory.some(i => i.id === 'override_chip');
    function render() {
        box.innerHTML = `
            <p class="puzzle-title">⚡ POWER GRID</p>
            <p class="puzzle-desc">Rotate all nodes to point ▲. Click each to rotate.</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
                ${nodes.map((v, i) => `
                    <button onclick="pgRotate(${i})" style="font-family:'Press Start 2P',monospace;font-size:20px;padding:16px;background:rgba(0,200,200,0.1);border:2px solid ${v === 0 ? '#00ffcc' : 'rgba(0,200,200,0.3)'};border-radius:6px;cursor:pointer;color:#fff;transform:rotate(${v * 90}deg);transition:transform 0.2s">
                        ${['▲', '▶', '▼', '◀'][v]}
                    </button>`).join('')}
            </div>
            ${hasChip ? `<button onclick="pgBypass()" class="btn-magenta" style="font-size:7px">💾 USE OVERRIDE CHIP</button>` : ''}`;
    }
    window.pgRotate = function (i) {
        nodes[i] = (nodes[i] + 1) % 4; render();
        if (nodes.every(v => v === 0)) onSolved();
    };
    window.pgBypass = function () {
        G.inventory = G.inventory.filter(i => i.id !== 'override_chip');
        renderInventory(); onSolved(true);
    };
    render();
}

// ── PUZZLE 1: CODE DECRYPT ─────────────────────────────────
function codeDecryptPuzzle() {
    const SYMBOLS = ['◆', '▲', '●', '■'], SECRET = [1, 3, 0, 2];
    let input = [];
    const hasTablet = G.inventory.some(i => i.id === 'data_tablet');
    const box = document.getElementById('puzzle-content');
    function render() {
        box.innerHTML = `
            <p class="puzzle-title">🔐 CODE DECRYPT</p>
            <p class="puzzle-desc">Enter the correct 4-symbol sequence.</p>
            <div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px">
                ${Array(4).fill(0).map((_, i) => `<div style="width:48px;height:48px;background:rgba(0,200,200,0.1);border:2px solid ${i < input.length ? '#00ffcc' : 'rgba(0,200,200,0.3)'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#00ffcc">${i < input.length ? SYMBOLS[input[i]] : '?'}</div>`).join('')}
            </div>
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
                ${SYMBOLS.map((s, i) => `<button onclick="cdInput(${i})" style="font-family:'Press Start 2P',monospace;font-size:20px;width:56px;height:56px;background:rgba(0,200,200,0.08);border:2px solid rgba(0,200,200,0.3);border-radius:6px;cursor:pointer;color:#fff">${s}</button>`).join('')}
            </div>
            <button onclick="cdClear()" class="btn-magenta" style="font-size:7px;margin-right:8px">CLEAR</button>
            ${hasTablet ? `<button onclick="cdHint()" class="btn-cyan" style="font-size:7px">📟 TABLET (AUTO-SOLVE)</button>` : ''}`;
    }
    window.cdInput = function (i) {
        if (input.length >= 4) return; input.push(i); render();
        if (input.length === 4) {
            setTimeout(() => { if (input.every((v, j) => v === SECRET[j])) onSolved(); else { onWrong(); input = []; render(); } }, 300);
        }
    };
    window.cdClear = function () { input = []; render(); };
    window.cdHint = function () {
        G.inventory = G.inventory.filter(i => i.id !== 'data_tablet');
        renderInventory(); input = [...SECRET]; render();
        setTimeout(() => onSolved(true), 600);
    };
    render();
}

// ── PUZZLE 2: REACTOR STABILIZE ────────────────────────────
function reactorPuzzle() {
    const values = [50, 50, 50], targets = [65, 40, 75], range = 8;
    let stableTime = 0, stableInterval = null;
    const hasKey = G.inventory.some(i => i.id === 'stabilizer_key');
    const box = document.getElementById('puzzle-content');
    const isStable = () => values.every((v, i) => Math.abs(v - targets[i]) <= range);
    function render() {
        box.innerHTML = `
            <p class="puzzle-title">⚛️ REACTOR STABILIZE</p>
            <p class="puzzle-desc">Set all sliders to the safe zone. Hold 3 seconds.</p>
            ${values.map((v, i) => {
            const ok = Math.abs(v - targets[i]) <= range;
            return `
                <div style="margin-bottom:14px">
                    <div style="display:flex;justify-content:space-between;font-size:7px;color:#8899aa;margin-bottom:6px">
                        <span>CORE ${i + 1}</span><span style="color:${ok ? '#00ff88' : '#ff4444'}">${ok ? '● STABLE' : '○ UNSTABLE'}</span>
                    </div>
                    <input type="range" min="0" max="100" value="${v}" oninput="rsSlide(${i},this.value)" style="-webkit-appearance:none;width:100%;height:8px;background:linear-gradient(to right,${ok ? '#00ff88' : '#ff4444'} ${v}%,rgba(255,255,255,0.1) ${v}%);border-radius:4px;outline:none;">
                </div>`;
        }).join('')}
            <p style="font-size:7px;color:${stableTime > 0 ? '#00ff88' : '#8899aa'};margin-top:8px">${stableTime > 0 ? `HOLDING... ${stableTime}/3s` : 'All green = STABLE'}</p>
            ${hasKey ? `<button onclick="rsKey()" class="btn-magenta" style="font-size:7px;margin-top:8px">🔑 USE STABILIZER KEY</button>` : ''}`;
    }
    window.rsSlide = function (i, v) {
        values[i] = parseInt(v); render(); clearInterval(stableInterval); stableTime = 0;
        if (isStable()) {
            stableInterval = setInterval(() => {
                if (!isStable()) { clearInterval(stableInterval); stableTime = 0; render(); return; }
                stableTime++; render(); if (stableTime >= 3) { clearInterval(stableInterval); onSolved(); }
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
            <p class="puzzle-desc">Insert keycards and enter the launch code.</p>
            <div style="display:flex;gap:12px;margin-bottom:16px">
                <div style="padding:10px 14px;border-radius:6px;font-size:7px;border:1px solid ${card1 ? '#00ff88' : '#ff4444'};color:${card1 ? '#00ff88' : '#ff4444'}">${card1 ? '✓' : '✗'} CARD A</div>
                <div style="padding:10px 14px;border-radius:6px;font-size:7px;border:1px solid ${card2 ? '#00ff88' : '#ff4444'};color:${card2 ? '#00ff88' : '#ff4444'}">${card2 ? '✓' : '✗'} CARD B</div>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:16px">
                ${Array(4).fill(0).map((_, i) => `<div style="width:44px;height:44px;background:rgba(0,200,200,0.1);border:2px solid ${i < codeInput.length ? '#00ffcc' : 'rgba(0,200,200,0.3)'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;color:#00ffcc">${codeInput[i] !== undefined ? '●' : '○'}</div>`).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => `<button onclick="epKey('${k}')" style="font-family:'Press Start 2P',monospace;font-size:10px;padding:10px;background:rgba(0,200,200,0.08);border:1px solid rgba(0,200,200,0.25);border-radius:4px;cursor:pointer;color:#fff">${k}</button>`).join('')}
            </div><div id="ep-msg" style="font-size:7px;margin-top:12px;color:#ff4444"></div>`;
    }
    window.epKey = function (k) {
        if (k === '⌫') { codeInput = codeInput.slice(0, -1); render(); return; }
        if (k === '' || codeInput.length >= 4) return;
        codeInput += k; render();
        if (codeInput.length === 4) {
            setTimeout(() => {
                const msg = document.getElementById('ep-msg');
                if (!card1 || !card2) { if (msg) msg.textContent = '✗ KEYCARDS REQUIRED'; onWrong(); codeInput = ''; render(); return; }
                if (codeInput === LAUNCH_CODE) onSolved();
                else { if (msg) msg.textContent = '✗ INVALID CODE'; onWrong(); codeInput = ''; render(); }
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
        if (near) {
            if (near.type === 'terminal') openPuzzle();
            if (near.type === 'item') collectItem(near.item);
        }
    }
    if (e.key === 'Escape') closePuzzle();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined') {
        const sess = Auth.getSession();
        if (!sess) {
            sessionStorage.setItem('afterLogin', 'game.html');
            window.location.href = 'index.html?login=1';
            return;
        }
        document.getElementById('hud-user').textContent = '👤 ' + sess.username;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    cancelAnimationFrame(rafId);
    gameLoop();
});
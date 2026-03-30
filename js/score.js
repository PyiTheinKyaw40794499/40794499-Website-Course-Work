document.addEventListener('DOMContentLoaded', () => {
  const sess = Auth.getSession();

  // ── GLOBAL LEADERBOARD ────────────────────────
  const allUsers = Auth.getUsers();
  let allScores = [];
  allUsers.forEach(u => {
    if (u.scores && u.scores.length) {
      const best = u.scores.reduce((a, b) => a.score > b.score ? a : b);
      allScores.push({ username: u.username, ...best });
    }
  });
  allScores.sort((a, b) => b.score - a.score);

  const lb = document.getElementById('leaderboard');
  const rankLabels = ['🥇', '🥈', '🥉'];
  const rankClasses = ['gold', 'silver', 'bronze'];

  if (allScores.length === 0) {
    lb.innerHTML = '<p style="font-size:8px;color:#8899aa;text-align:center">No scores yet. Be the first!</p>';
  } else {
    allScores.slice(0, 10).forEach((s, i) => {
      const rankCls = i < 3 ? rankClasses[i] : 'other';
      const rankTxt = i < 3 ? rankLabels[i] : `#${i+1}`;
      lb.innerHTML += `
        <div class="leaderboard-row">
          <span class="rank ${rankCls}">${rankTxt}</span>
          <span class="lb-name">${s.username}</span>
          <span class="lb-score">${s.score.toLocaleString()} PTS</span>
          <span class="lb-tag ${s.won ? 'win' : 'loss'}">${s.won ? '✓ WIN' : '✗ FAIL'}</span>
          <span style="font-size:7px;color:#8899aa">${s.rooms || 0}/4 rooms</span>
        </div>`;
    });
  }

  // ── PERSONAL HISTORY ──────────────────────────
  const section = document.getElementById('personal-section');
  if (!sess) {
    section.innerHTML = `
      <div style="text-align:center;padding:32px">
        <p style="font-size:8px;color:#8899aa;margin-bottom:16px">Login to see your mission history.</p>
        <button onclick="document.getElementById('auth-modal').classList.remove('hidden')" class="btn-cyan">LOGIN</button>
      </div>`;
    return;
  }

  const me = allUsers.find(u => u.email === sess.email);
  if (!me || !me.scores || me.scores.length === 0) {
    section.innerHTML = `
      <div style="text-align:center;padding:32px">
        <p style="font-size:8px;color:#8899aa;margin-bottom:16px">No missions yet. Start playing!</p>
        <a href__="game.html" class="btn-play" style="font-size:10px;padding:12px 28px">▶ PLAY NOW</a>
      </div>`;
    return;
  }

  const best = me.scores.reduce((a, b) => a.score > b.score ? a : b);
  section.innerHTML = `
    <h2 style="font-size:11px;color:#00ffff;margin-bottom:16px">⭐ BEST RUN</h2>
    <div class="stat-box" style="margin-bottom:24px">
      <div class="stat-row"><span>SCORE</span><span class="stat-val">${best.score.toLocaleString()}</span></div>
      <div class="stat-row"><span>RESULT</span><span class="stat-val" style="color:${best.won?'#00ff88':'#ff4444'}">${best.won?'✓ ESCAPED':'✗ FAILED'}</span></div>
      <div class="stat-row"><span>ROOMS</span><span class="stat-val">${best.rooms || 0}/4</span></div>
      <div class="stat-row"><span>TIME</span><span class="stat-val">${best.time || 0}s</span></div>
    </div>
    <h2 style="font-size:11px;color:#00ffff;margin-bottom:16px">📋 MISSION LOG</h2>`;

  me.scores.slice(0, 10).forEach((s, i) => {
    const d = new Date(s.date);
    const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    section.innerHTML += `
      <div class="leaderboard-row">
        <span style="font-size:7px;color:#8899aa">#${i+1}</span>
        <span class="lb-tag ${s.won ? 'win' : 'loss'}">${s.won ? '✓ WIN' : '✗ FAIL'}</span>
        <span class="lb-score">${s.score.toLocaleString()} PTS</span>
        <span style="font-size:7px;color:#8899aa">${s.rooms||0}/4 rooms · ${s.time||0}s</span>
        <span style="font-size:6px;color:#556677;margin-left:auto">${dateStr}</span>
      </div>`;
  });
});
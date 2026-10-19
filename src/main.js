import './style.css';
import { EkoBeacon } from './world.js';
import { StartNg } from './startng.js';

const ui = {
  intro: document.querySelector('#intro-panel'), result: document.querySelector('#result-panel'), hud: document.querySelector('#hud'), controls: document.querySelector('#puzzle-controls'),
  name: document.querySelector('#player-name'), account: document.querySelector('#player-account'), signIn: document.querySelector('#sign-in'), avatarDot: document.querySelector('#avatar-dot'),
  level: document.querySelector('#level'), moves: document.querySelector('#moves'), time: document.querySelector('#time'), finalLevels: document.querySelector('#final-levels'), finalTime: document.querySelector('#final-time'),
  resultEyebrow: document.querySelector('#result-eyebrow'), resultHeading: document.querySelector('#result-heading'), saveMessage: document.querySelector('#save-message'),
  continueButton: document.querySelector('#continue-button'), leaderboard: document.querySelector('#leaderboard'), toast: document.querySelector('#toast'), playTip: document.querySelector('#play-tip'),
};

const platform = new StartNg();
let currentPlayer = { name: 'Guest', account: null, style: {}, guest: true };
let toastTimer;
const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const showToast = (message) => { ui.toast.textContent = message; ui.toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { ui.toast.hidden = true; }, 2600); };

const game = new EkoBeacon(document.querySelector('#scene'), {
  onTick: ({ level, moves, time }) => {
    ui.level.textContent = level; ui.moves.textContent = moves; ui.time.textContent = formatTime(time);
    ui.playTip.textContent = level === 1
      ? 'Goal: guide gold light to the beacon. Roof 1 tip: tap the middle mirror once to send light up, then right.'
      : 'Goal: guide gold light to the beacon. Tap a teal mirror to redirect the light and watch its path.';
  },
  onLevelSolved: ({ level, moves, time }) => {
    ui.result.hidden = false; ui.resultEyebrow.textContent = 'SIGNAL ALIGNED'; ui.resultHeading.innerHTML = 'Beacon<br><em>lit.</em>';
    ui.finalLevels.textContent = level; ui.finalTime.textContent = formatTime(time); ui.saveMessage.textContent = `${moves} mirror turn${moves === 1 ? '' : 's'} on this roof.`;
    ui.continueButton.hidden = false; ui.continueButton.innerHTML = 'NEXT ROOF <span>↗</span>';
  },
  onComplete: saveRun,
});

function setPlayer(player) {
  currentPlayer = player || { name: 'Guest', account: null, style: {}, guest: true };
  ui.name.textContent = currentPlayer.name || 'Guest';
  ui.account.textContent = currentPlayer.account ? `@${currentPlayer.account}` : (currentPlayer.guest ? 'Playing as guest' : 'start.ng player');
  ui.avatarDot.textContent = (currentPlayer.name || 'G').slice(0, 1).toUpperCase();
  ui.avatarDot.style.background = currentPlayer.style?.primaryColor || '#e5a33d';
  ui.signIn.hidden = !currentPlayer.guest; game.setPlayer(currentPlayer); refreshBoard();
}

function beginPuzzle() {
  ui.intro.hidden = true; ui.result.hidden = true; ui.hud.hidden = false; ui.controls.hidden = false; ui.playTip.hidden = false; game.start();
}

async function saveRun(stats) {
  ui.hud.hidden = true; ui.controls.hidden = true; ui.result.hidden = false;
  ui.playTip.hidden = true;
  ui.resultEyebrow.textContent = 'ALL SIGNALS LIT'; ui.resultHeading.innerHTML = 'You brought<br><em>the light.</em>';
  ui.finalLevels.textContent = stats.levels; ui.finalTime.textContent = formatTime(stats.time);
  ui.continueButton.hidden = false; ui.continueButton.innerHTML = 'SOLVE AGAIN <span>↻</span>';
  ui.saveMessage.textContent = currentPlayer.guest ? 'Sign in with start.ng to save this route.' : 'Saving your route…';
  if (!currentPlayer.guest) {
    const saved = await platform.saveScore(stats);
    ui.saveMessage.textContent = saved?.ok
      ? (saved.result?.improved ? `New best route! You’re #${saved.result.rank || '—'}.` : 'Route saved to Beacon Keepers.')
      : 'Couldn’t reach the leaderboard. Your route is complete.';
    refreshBoard();
  }
}

async function refreshBoard() {
  const entries = await platform.leaderboard(5);
  if (!entries?.length) { ui.leaderboard.innerHTML = '<li class="empty-board">Light the first beacon.</li>'; return; }
  ui.leaderboard.replaceChildren(...entries.map((entry, index) => {
    const item = document.createElement('li');
    const rank = document.createElement('i'); rank.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span'); name.textContent = entry.name || 'Keeper';
    const score = document.createElement('b'); score.textContent = `${entry.stats?.levels ?? 0}/3 · ${formatTime(entry.stats?.time ?? 0)}`;
    item.append(rank, name, score); return item;
  }));
}

document.querySelector('#play-button').addEventListener('click', beginPuzzle);
ui.continueButton.addEventListener('click', () => {
  if (game.state === 'solved') { ui.result.hidden = true; game.nextLevel(); ui.hud.hidden = false; ui.controls.hidden = false; ui.playTip.hidden = false; }
  else if (game.state === 'complete') beginPuzzle();
});
document.querySelector('#rotate-button').addEventListener('click', () => game.rotateSelected());
document.querySelector('#select-prev').addEventListener('click', () => game.selectRelative(-1));
document.querySelector('#select-next').addEventListener('click', () => game.selectRelative(1));
ui.signIn.href = platform.signInUrl(); ui.signIn.addEventListener('click', (event) => { event.preventDefault(); platform.signIn(); });
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') { event.preventDefault(); game.selectRelative(-1); }
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') { event.preventDefault(); game.selectRelative(1); }
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    if (game.state === 'ready') beginPuzzle(); else if (game.state === 'solved') ui.continueButton.click(); else if (game.state === 'active') game.rotateSelected();
  }
});

platform.onPlayer(setPlayer); platform.connect().then((player) => player && setPlayer(player));
platform.onUnavailable(() => showToast('Playing as Guest — start.ng connection unavailable.'));
document.addEventListener('visibilitychange', () => { if (!document.hidden) platform.connect().then((player) => player && setPlayer(player)); });
window.addEventListener('focus', () => platform.connect().then((player) => player && setPlayer(player)));

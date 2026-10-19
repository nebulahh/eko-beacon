const START_NG = 'https://start.ng';
const WAIT_MS = 5000;

export class StartNg {
  constructor() { this.framePromise = null; this.player = null; this.playerListener = null; this.unavailableListener = null; }

  async frame() {
    if (!this.framePromise) this.framePromise = new Promise((resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.src = `${START_NG}/connect`; frame.hidden = true; frame.title = 'start.ng connection';
      frame.onload = () => resolve(frame); frame.onerror = reject; document.body.append(frame);
    });
    return this.framePromise;
  }

  async ask(message, replyType, timeout = WAIT_MS) {
    try {
      const frame = await this.frame();
      return await new Promise((resolve) => {
        const requestId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
        const finish = (reply) => { clearTimeout(timer); removeEventListener('message', onMessage); resolve(reply); };
        const timer = setTimeout(() => finish(null), timeout);
        const onMessage = (event) => {
          if (event.origin !== START_NG || event.source !== frame.contentWindow) return;
          if (event.data?.type === replyType && event.data.requestId === requestId) finish(event.data);
        };
        addEventListener('message', onMessage);
        frame.contentWindow.postMessage({ ...message, requestId }, START_NG);
      });
    } catch { return null; }
  }

  normalize(user, guest = false) {
    return { name: user?.name || 'Guest', account: user?.account || null, id: user?.id ?? null, face: user?.face || null, style: user?.style || {}, guest };
  }

  async connect() {
    const reply = await this.ask({ type: 'startng:whoami' }, 'startng:user');
    const person = reply?.user ? this.normalize(reply.user) : reply?.guest ? this.normalize(reply.guest, true) : null;
    if (person) { this.player = person; this.playerListener?.(person); }
    else if (this.unavailableListener) this.unavailableListener();
    return person;
  }

  onPlayer(listener) { this.playerListener = listener; }
  onUnavailable(listener) { this.unavailableListener = listener; }
  signInUrl() { return `${START_NG}/?return_to=${encodeURIComponent(location.origin + location.pathname)}`; }
  signIn() { location.href = this.signInUrl(); }

  async saveScore(stats) {
    const result = await this.ask({ type: 'startng:score', stats }, 'startng:scoreSaved');
    return result?.ok ? result : null;
  }

  async leaderboard(limit = 10) {
    const reply = await this.ask({ type: 'startng:leaderboard', limit }, 'startng:leaderboardData');
    return reply?.ok ? (reply.entries || []) : [];
  }
}

import { WORD_LIST } from './words.js';
const KEY = { words: 'wl_words', stats: 'wl_stats', sessions: 'wl_sessions' };
export function loadWords() { const raw = localStorage.getItem(KEY.words); if (raw) return JSON.parse(raw); return seed(); }
export function saveWords(words) { localStorage.setItem(KEY.words, JSON.stringify(words)); }
export function loadStats() { const raw = localStorage.getItem(KEY.stats); if (raw) return JSON.parse(raw); return { lastPlayDate: null, currentStreak: 0, totalSessions: 0, totalScore: 0 }; }
export function saveStats(stats) { localStorage.setItem(KEY.stats, JSON.stringify(stats)); }
export function saveSession(session) { const sessions = JSON.parse(localStorage.getItem(KEY.sessions) || '[]'); sessions.push(session); localStorage.setItem(KEY.sessions, JSON.stringify(sessions)); }
export function updateStatsOnStart(stats) {
  const today = dateStr(new Date()), yesterday = dateStr(new Date(Date.now() - 86400000));
  if (stats.lastPlayDate === yesterday) { stats.currentStreak += 1; } else if (stats.lastPlayDate !== today) { stats.currentStreak = 1; }
  stats.lastPlayDate = today; stats.totalSessions += 1; saveStats(stats); return stats;
}
export function getDailyMessage(stats) {
  const today = dateStr(new Date()), yesterday = dateStr(new Date(Date.now() - 86400000));
  if (!stats.lastPlayDate || stats.lastPlayDate === today) return null;
  if (stats.lastPlayDate === yesterday) return { type: 'praise', text: PRAISE[Math.floor(Math.random() * PRAISE.length)] };
  return { type: 'scold', text: SCOLD[Math.floor(Math.random() * SCOLD.length)] };
}
function seed() { const words = WORD_LIST.map((w,i) => ({ id:i, english:w[0], japanese:w[1], correctCount:0, wrongCount:0, isMastered:false, isWeak:false })); saveWords(words); return words; }
function dateStr(d) { return d.toISOString().slice(0, 10); }
const PRAISE = ['昨日もやったじゃん！その調子！','連続参加、えらすぎる。','毎日続けてるの、マジでかっこいい。','昨日もちゃんとやったんだ。すごいじゃん。','継続は力なりって、まさに君のことだよ。','また来たね。さすがだわ。','ストリーク継続中！今日も頑張れ！','昨日の努力、ちゃんと見てたよ。えらい！','毎日来てくれるの、うれしいじゃないですか。','やるじゃん。APU受かるよ、絶対。'];
const SCOLD = ['昨日サボってたじゃん。','あ、昨日は来なかったんだ。ふーん。','昨日の自分に失望した？','サボり記録更新中。','APUの入試、待ってくれないよ？','昨日さぼりましたね。まあ、今日来たからゆるす。','昨日どこいってたの。','英単語は逃げないけど、チャンスは逃げるよ。','昨日の分も今日やれ。','久々じゃん。忘れてないから安心して。'];
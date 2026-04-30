import { loadWords, saveWords, loadStats, saveStats, saveSession, updateStatsOnStart, getDailyMessage } from './storage.js';
import { buildQuiz, calcScore, applyAnswer } from './quiz.js';
import { launchFireworks, showUwai, startRain, showZannen } from './animations.js';
let words, stats, questions, qIndex, totalUDc, combo, maxCombo, results, stopRain;
document.addEventListener('DOMContentLoaded', () => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); words = loadWords(); stats = loadStats(); showHome(); });
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function showHome() { stats = loadStats(); words = loadWords(); renderHome(); showScreen('home'); }
function renderHome() {
  const msg = getDailyMessage(stats), msgEl = document.getElementById('daily-msg');
  if (msg) { msgEl.textContent = msg.text; msgEl.className = 'daily-msg ' + msg.type; msgEl.style.display = 'block'; } else { msgEl.style.display = 'none'; }
  const streakEl = document.getElementById('streak');
  if (stats.currentStreak > 0) { streakEl.textContent = `🔥 ${stats.currentStreak}日連続`; streakEl.className = 'streak-badge'; } else { streakEl.textContent = '💀 ストリーク途切れ'; streakEl.className = 'streak-badge broken'; }
  const mastered = words.filter(w => w.isMastered).length;
  document.getElementById('mastered-count').textContent = mastered;
  document.getElementById('score-display').textContent = formatScore(stats.totalScore);
  const pct = words.length ? mastered / words.length * 100 : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${mastered} / ${words.length}語`;
}
document.getElementById('start-btn').addEventListener('click', () => { stats = updateStatsOnStart(stats); startQuiz(); });
function startQuiz() { questions = buildQuiz(words); qIndex = 0; totalUDc = 0; combo = 0; maxCombo = 0; results = []; renderQuestion(); showScreen('quiz'); }
function renderQuestion() {
  const q = questions[qIndex];
  document.getElementById('q-num').textContent = qIndex + 1;
  document.getElementById('progress-bar-quiz').style.width = `${(qIndex+1)/questions.length*100}%`;
  document.getElementById('score-live').textContent = formatScore(totalUDc);
  document.getElementById('combo-bar').style.display = combo >= 2 ? 'flex' : 'none';
  document.getElementById('combo-text').textContent = `🔥 ${combo}連続正解中！${comboLabel(combo)}`;
  const isW2M = q.type === 'wordToMeaning';
  document.getElementById('q-type-badge').textContent = isW2M ? '単語 → 意味' : '意味 → 単語';
  document.getElementById('q-text').textContent = isW2M ? q.word.english : q.word.japanese;
  document.getElementById('q-hint').textContent = isW2M ? 'この単語の意味は？' : '英単語を選んでください';
  const list = document.getElementById('choices'); list.innerHTML = '';
  q.choices.forEach((text, i) => {
    const btn = document.createElement('button'); btn.className = 'choice-btn';
    btn.innerHTML = `<span class="choice-lbl">${['A','B','C','D'][i]}</span><span>${text}</span>`;
    btn.addEventListener('click', () => onAnswer(i)); list.appendChild(btn);
  });
  document.getElementById('next-btn').style.display = 'none'; clearFeedback();
}
function onAnswer(idx) {
  const q = questions[qIndex];
  if (document.querySelectorAll('.choice-btn.correct, .choice-btn.wrong').length) return;
  const isCorrect = idx === q.correctIndex, btns = document.querySelectorAll('.choice-btn');
  btns.forEach(b => b.disabled = true); btns[q.correctIndex].classList.add('correct');
  if (!isCorrect) btns[idx].classList.add('wrong');
  words = words.map(w => w.id === q.word.id ? applyAnswer({...w}, isCorrect) : w); saveWords(words);
  if (isCorrect) { combo++; maxCombo = Math.max(maxCombo, combo); totalUDc += calcScore(combo); document.getElementById('score-live').textContent = formatScore(totalUDc); showCorrectFx(combo >= 2); } else { combo = 0; showWrongFx(); }
  results.push({ english: q.word.english, japanese: q.word.japanese, isCorrect });
  document.getElementById('next-btn').style.display = 'block';
  document.getElementById('next-btn').textContent = qIndex + 1 >= questions.length ? '結果を見る' : '次の問題 →';
}
document.getElementById('next-btn').addEventListener('click', () => { clearFeedback(); qIndex++; if (qIndex >= questions.length) { if (results.filter(r => r.isCorrect).length === questions.length) totalUDc += 50; finishQuiz(); } else { renderQuestion(); } });
function showCorrectFx(isCombo) { const o = document.getElementById('fx-overlay'); o.style.display = 'block'; launchFireworks(o); if (isCombo) showUwai(o); }
function showWrongFx() { const o = document.getElementById('fx-overlay'); o.style.display = 'block'; o.classList.add('rain-bg'); stopRain = startRain(o); showZannen(o); }
function clearFeedback() { const o = document.getElementById('fx-overlay'); o.innerHTML = ''; o.style.display = 'none'; o.classList.remove('rain-bg'); if (stopRain) { stopRain(); stopRain = null; } }
function finishQuiz() { stats.totalScore += totalUDc; saveStats(stats); saveSession({ date: new Date().toISOString(), totalUDc, results, maxCombo }); renderResults(); showScreen('results'); }
function renderResults() {
  const correct = results.filter(r => r.isCorrect).length;
  document.getElementById('res-score').textContent = formatScore(totalUDc);
  document.getElementById('res-total-score').textContent = formatScore(stats.totalScore);
  document.getElementById('res-correct').textContent = `${correct} / ${results.length}問正解`;
  document.getElementById('res-combo').textContent = `最大コンボ 🔥 ${maxCombo}連続`;
  document.getElementById('res-bonus').style.display = correct === results.length ? 'block' : 'none';
  document.getElementById('res-list').innerHTML = results.map(r => `<div class="res-row"><span class="res-icon">${r.isCorrect ? '✅' : '❌'}</span><div class="res-words"><div class="res-en">${r.english}</div><div class="res-ja">${r.japanese}</div></div></div>`).join('');
}
document.getElementById('home-btn').addEventListener('click', showHome);
function formatScore(udc) { const tdc = Math.floor(udc/1000), rem = udc%1000; return tdc > 0 ? `${tdc} TDc ${rem} UDc` : `${udc} UDc`; }
function comboLabel(c) { if (c >= 5) return '× 2.0倍'; if (c >= 3) return '× 1.5倍'; return ''; }
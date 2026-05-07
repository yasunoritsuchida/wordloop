import { loadWords, saveWords, loadStats, saveStats, saveSession, updateStatsOnStart, getDailyMessage } from './storage.js';
import { buildQuiz, calcScore, applyAnswer } from './quiz.js';
import { launchFireworks, showUwai, startRain, showZannen } from './animations.js';
import { startBGM, stopBGM, isBGMPlaying } from './bgm.js';
import { EXAMPLES } from './examples.js';

// ── State ──────────────────────────────────────────────────────────
let words, stats, questions, qIndex, totalUDc, combo, maxCombo, results, stopRain;
let currentEnglish = '';

// ── Boot ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
  words = loadWords();
  stats = loadStats();
  showHome();
});

// ── Screens ────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── HOME ───────────────────────────────────────────────────────────
function showHome() {
  stats = loadStats();
  words = loadWords();
  renderHome();
  showScreen('home');
}

function renderHome() {
  const msg = getDailyMessage(stats);
  const msgEl = document.getElementById('daily-msg');
  if (msg) {
    msgEl.textContent = msg.text;
    msgEl.className = 'daily-msg ' + msg.type;
    msgEl.style.display = 'block';
  } else {
    msgEl.style.display = 'none';
  }

  const streakEl = document.getElementById('streak');
  if (stats.currentStreak > 0) {
    streakEl.textContent = `🔥 ${stats.currentStreak}日連続`;
    streakEl.className = 'streak-badge';
  } else {
    streakEl.textContent = '💀 ストリーク途切れ';
    streakEl.className = 'streak-badge broken';
  }

  const mastered = words.filter(w => w.isMastered).length;
  document.getElementById('mastered-count').textContent = mastered;
  document.getElementById('score-display').textContent = formatScore(stats.totalScore);

  const pct = words.length ? mastered / words.length * 100 : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${mastered} / ${words.length}語`;
}

document.getElementById('start-btn').addEventListener('click', () => {
  stats = updateStatsOnStart(stats);
  startQuiz();
});

document.getElementById('bgm-btn').addEventListener('click', () => {
  if (isBGMPlaying()) {
    stopBGM();
    document.getElementById('bgm-btn').textContent = '🔇';
    document.getElementById('bgm-btn').classList.remove('on');
  } else {
    startBGM();
    document.getElementById('bgm-btn').textContent = '🎵';
    document.getElementById('bgm-btn').classList.add('on');
  }
});

document.getElementById('wordlist-open-btn').addEventListener('click', () => {
  showWordList('all');
});

// ── QUIZ ───────────────────────────────────────────────────────────
function startQuiz() {
  questions = buildQuiz(words);
  qIndex = 0; totalUDc = 0; combo = 0; maxCombo = 0; results = [];
  renderQuestion();
  showScreen('quiz');
}

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

  currentEnglish = q.word.english;
  document.getElementById('speak-btn').classList.remove('speaking');

  const exEl = document.getElementById('q-example');
  const ex = EXAMPLES[q.word.english.toLowerCase()] || EXAMPLES[q.word.english];
  if (ex) {
    exEl.textContent = '📖 ' + ex;
    exEl.style.display = 'block';
  } else {
    exEl.style.display = 'none';
  }

  const choiceLabels = ['A','B','C','D'];
  const list = document.getElementById('choices');
  list.innerHTML = '';
  q.choices.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="choice-lbl">${choiceLabels[i]}</span><span>${text}</span>`;
    btn.addEventListener('click', () => onAnswer(i));
    list.appendChild(btn);
  });

  document.getElementById('next-btn').style.display = 'none';
  clearFeedback();
}

function onAnswer(idx) {
  const q = questions[qIndex];
  if (document.querySelectorAll('.choice-btn.correct, .choice-btn.wrong').length) return;

  const isCorrect = idx === q.correctIndex;
  const btns = document.querySelectorAll('.choice-btn');
  btns.forEach(b => b.disabled = true);
  btns[q.correctIndex].classList.add('correct');
  if (!isCorrect) btns[idx].classList.add('wrong');

  words = words.map(w => w.id === q.word.id ? applyAnswer({...w}, isCorrect) : w);
  saveWords(words);

  if (isCorrect) {
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    totalUDc += calcScore(combo);
    document.getElementById('score-live').textContent = formatScore(totalUDc);
    showCorrectFx(combo >= 2);
  } else {
    combo = 0;
    showWrongFx();
  }

  results.push({ english: q.word.english, japanese: q.word.japanese, isCorrect });
  document.getElementById('next-btn').style.display = 'block';
  document.getElementById('next-btn').textContent =
    qIndex + 1 >= questions.length ? '結果を見る' : '次の問題 →';
}

document.getElementById('next-btn').addEventListener('click', () => {
  clearFeedback();
  qIndex++;
  if (qIndex >= questions.length) {
    if (results.filter(r => r.isCorrect).length === questions.length) totalUDc += 50;
    finishQuiz();
  } else {
    renderQuestion();
  }
});

document.getElementById('speak-btn').addEventListener('click', () => {
  if (!currentEnglish) return;
  speakWord(currentEnglish);
});

function speakWord(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.88;
  utt.pitch = 1.0;

  const btn = document.getElementById('speak-btn');
  btn.classList.add('speaking');
  utt.onend  = () => btn.classList.remove('speaking');
  utt.onerror = () => btn.classList.remove('speaking');

  speechSynthesis.speak(utt);
}

function showCorrectFx(isCombo) {
  const overlay = document.getElementById('fx-overlay');
  overlay.style.display = 'block';
  launchFireworks(overlay);
  if (isCombo) showUwai(overlay);
}

function showWrongFx() {
  const overlay = document.getElementById('fx-overlay');
  overlay.style.display = 'block';
  overlay.classList.add('rain-bg');
  stopRain = startRain(overlay);
  showZannen(overlay);
}

function clearFeedback() {
  const overlay = document.getElementById('fx-overlay');
  overlay.innerHTML = '';
  overlay.style.display = 'none';
  overlay.classList.remove('rain-bg');
  if (stopRain) { stopRain(); stopRain = null; }
}

// ── RESULTS ────────────────────────────────────────────────────────
function finishQuiz() {
  stats.totalScore += totalUDc;
  saveStats(stats);
  saveSession({ date: new Date().toISOString(), totalUDc, results, maxCombo });
  renderResults();
  showScreen('results');
}

function renderResults() {
  const correct = results.filter(r => r.isCorrect).length;
  document.getElementById('res-score').textContent = formatScore(totalUDc);
  document.getElementById('res-total-score').textContent = formatScore(stats.totalScore);
  document.getElementById('res-correct').textContent = `${correct} / ${results.length}問正解`;
  document.getElementById('res-combo').textContent = `最大コンボ 🔥 ${maxCombo}連続`;

  const bonus = document.getElementById('res-bonus');
  bonus.style.display = correct === results.length ? 'block' : 'none';

  const list = document.getElementById('res-list');
  list.innerHTML = results.map(r => `
    <div class="res-row">
      <span class="res-icon">${r.isCorrect ? '✅' : '❌'}</span>
      <div class="res-words">
        <div class="res-en">${r.english}</div>
        <div class="res-ja">${r.japanese}</div>
      </div>
    </div>
  `).join('');
}

document.getElementById('home-btn').addEventListener('click', showHome);

// ── WORD LIST ──────────────────────────────────────────────────────
let currentTab = 'all';

function showWordList(tab) {
  currentTab = tab || 'all';
  renderWordList(currentTab);
  showScreen('wordlist');
}

function renderWordList(tab) {
  const mastered = words.filter(w => w.isMastered).length;
  const total    = words.length;
  const pct      = total ? Math.round(mastered / total * 100) : 0;

  document.getElementById('ach-pct').textContent   = pct + '%';
  document.getElementById('ach-count').textContent = `${mastered} / ${total}語 マスター済み`;
  document.getElementById('ach-ring').style.setProperty('--pct', pct);

  let filtered;
  switch (tab) {
    case 'mastered':  filtered = words.filter(w => w.isMastered); break;
    case 'weak':      filtered = words.filter(w => w.isWeak); break;
    case 'attempted': filtered = words.filter(w => w.correctCount > 0 || w.wrongCount > 0); break;
    default:          filtered = [...words];
  }

  const order = { mastered: 0, attempted: 1, weak: 2, new: 3 };
  filtered.sort((a, b) => {
    const sa = statusOf(a), sb = statusOf(b);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    return a.english.localeCompare(b.english);
  });

  const listEl = document.getElementById('wl-list');
  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="wl-empty">該当する単語がありません</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(w => {
    const st = statusOf(w);
    const badgeLabel = { mastered: '✅ マスター', weak: '⚠️ 苦手', attempted: '📘 学習中', new: '□ 未出題' }[st];
    const statsHtml  = (w.correctCount > 0 || w.wrongCount > 0)
      ? `<div class="wl-stats">○${w.correctCount} ×${w.wrongCount}</div>`
      : '';
    return `
      <div class="wl-row">
        <div class="wl-words">
          <div class="wl-en">${w.english}</div>
          <div class="wl-ja">${w.japanese}</div>
        </div>
        <div class="wl-right">
          <span class="wl-badge wl-${st}">${badgeLabel}</span>
          ${statsHtml}
        </div>
      </div>`;
  }).join('');
}

function statusOf(w) {
  if (w.isMastered) return 'mastered';
  if (w.isWeak)     return 'weak';
  if (w.correctCount > 0 || w.wrongCount > 0) return 'attempted';
  return 'new';
}

document.querySelectorAll('.wl-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wl-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    renderWordList(currentTab);
  });
});

document.getElementById('wl-back-btn').addEventListener('click', () => {
  showHome();
});

// ── Helpers ────────────────────────────────────────────────────────
function formatScore(udc) {
  const tdc = Math.floor(udc / 1000);
  const rem = udc % 1000;
  return tdc > 0 ? `${tdc} TDc ${rem} UDc` : `${udc} UDc`;
}

function comboLabel(c) {
  if (c >= 5) return '× 2.0倍';
  if (c >= 3) return '× 1.5倍';
  return '';
}

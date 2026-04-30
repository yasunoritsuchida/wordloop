export function buildQuiz(words, count = 10) {
  const pool = words.filter(w => !w.isMastered);
  const source = pool.length >= count ? shuffle(pool).slice(0, count) : [...shuffle(pool), ...shuffle(words.filter(w => w.isMastered))].slice(0, count);
  return source.map(word => {
    const type = Math.random() < 0.5 ? 'wordToMeaning' : 'meaningToWord';
    const wrong = shuffle(words.filter(w => w.id !== word.id)).slice(0, 3);
    let correctAnswer, choices;
    if (type === 'wordToMeaning') { correctAnswer = word.japanese; choices = shuffle([correctAnswer, ...wrong.map(w => w.japanese)]); }
    else { correctAnswer = word.english; choices = shuffle([correctAnswer, ...wrong.map(w => w.english)]); }
    return { word, type, choices, correctIndex: choices.indexOf(correctAnswer) };
  });
}
export function calcScore(combo) { if (combo >= 5) return 20; if (combo >= 3) return 15; return 10; }
export function applyAnswer(word, isCorrect) {
  if (isCorrect) { word.correctCount += 1; if (word.correctCount >= 2) word.isMastered = true; }
  else { word.wrongCount += 1; if (word.wrongCount >= 2) word.isWeak = true; }
  return word;
}
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
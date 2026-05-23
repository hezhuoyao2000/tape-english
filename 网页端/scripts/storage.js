// WORD STATS — localStorage 持久化学习进度和错词记录
// 所有数据存储在用户本地浏览器中，不联网、不跨设备
// ============================================================
function loadWordStats() {
  try {
    const raw = localStorage.getItem("typing_word_stats");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveWordStats() {
  try {
    localStorage.setItem("typing_word_stats", JSON.stringify(state.wordStats));
  } catch (e) { /* quota exceeded, ignore — 存储配额超限则忽略 */ }
}

function loadWrongWords() {
  try {
    const raw = localStorage.getItem("typing_wrong_words");
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveWrongWords() {
  try {
    localStorage.setItem("typing_wrong_words", JSON.stringify(state.wrongWordCounts));
  } catch (e) {}
}

function recordWrongWord(word) {
  const key = word.en.toLowerCase();
  if (!state.wrongWordCounts[key]) state.wrongWordCounts[key] = 0;
  state.wrongWordCounts[key]++;
  saveWrongWords();
}

function recordAttempt(word) {
  const key = word.en.toLowerCase();
  if (!state.wordStats[key]) {
    state.wordStats[key] = { attempts: 0, completed: 0 };
  }
  state.wordStats[key].attempts++;
  saveWordStats();
}

function recordCompletion(word) {
  const key = word.en.toLowerCase();
  if (!state.wordStats[key]) {
    state.wordStats[key] = { attempts: 0, completed: 0 };
  }
  state.wordStats[key].completed++;
  saveWordStats();
}

// ============================================================

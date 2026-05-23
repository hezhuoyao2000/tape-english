// SESSION CONTROL — 一轮练习的结束、结果计算、星级评价、历史保存
// ============================================================
function finishSession() {
  state.endTime = Date.now();
  state.isComplete = true;
  state.isStarted = false;
  updateStats();
  showResults();
}

function getStarRating(accuracy) {
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

function renderStars(count) {
  let html = "";
  for (let i = 0; i < 3; i++) {
    html += i < count
      ? '<span class="star-filled">★</span>'
      : '<span class="star-empty">★</span>';
  }
  return html;
}

function getStarLabel(count) {
  const labels = ["Keep Practicing", "Good Effort", "Great Job", "Perfect"];
  return labels[count] || "";
}

function saveSessionRecord(wpm, accuracy, wordsCompleted, stars) {
  let history = [];
  try {
    const raw = localStorage.getItem("typing_session_history");
    if (raw) history = JSON.parse(raw);
  } catch (e) {}
  history.unshift({
    date: new Date().toISOString().slice(0, 10),
    wpm: wpm,
    accuracy: accuracy,
    words: wordsCompleted,
    stars: stars
  });
  if (history.length > 10) history = history.slice(0, 10);
  try {
    localStorage.setItem("typing_session_history", JSON.stringify(history));
  } catch (e) {}
}

function renderSessionHistory() {
  let history = [];
  try {
    const raw = localStorage.getItem("typing_session_history");
    if (raw) history = JSON.parse(raw);
  } catch (e) {}
  const container = document.getElementById("sessionHistoryContent");
  if (!container) return;
  if (history.length === 0) {
    container.className = "session-history-empty";
    container.textContent = "No history yet.";
    return;
  }
  container.className = "";
  container.innerHTML = history.map(s =>
    `<div class="session-history-row">
      <span class="sh-date">${s.date.slice(5)}</span>
      <span class="sh-stars">${renderStars(s.stars)}</span>
      <span class="sh-wpm">${s.wpm} wpm</span>
      <span class="sh-acc">${s.accuracy}%</span>
    </div>`
  ).join("");
}

function showResults() {
  const elapsed = (state.endTime - state.startTime) / 1000;
  const minutes = elapsed / 60;
  const totalTyped = state.totalCorrect + state.totalErrors;
  const wpm = minutes > 0 ? Math.round((state.totalCorrect / 5) / minutes) : 0;
  const accuracy = totalTyped > 0 ? Math.round((state.totalCorrect / totalTyped) * 100) : 100;
  const stars = getStarRating(accuracy);

  state.elements.resultWpm.textContent = wpm;
  state.elements.resultAccuracy.textContent = accuracy + "%";
  state.elements.resultTime.textContent = formatTime(elapsed);
  state.elements.resultWords.textContent = state.wordsCompleted;
  state.elements.resultErrors.textContent = state.totalErrors;

  // Star rating — 星级评价（根据准确率计算1-3星）
  const starEl = document.getElementById("starRating");
  const starLabel = document.getElementById("starLabel");
  if (starEl) starEl.innerHTML = renderStars(stars);
  if (starLabel) starLabel.textContent = getStarLabel(stars);

  // Session history — 保存本次会话记录到历史
  saveSessionRecord(wpm, accuracy, state.wordsCompleted, stars);
  renderSessionHistory();

  state.elements.resultOverlay.classList.add("visible");
}

function hideResults() {
  state.elements.resultOverlay.classList.remove("visible");
}

function resetSession(keepWords) {
  hideResults();

  if (state.wrongTimer) clearTimeout(state.wrongTimer);

  if (!keepWords || state.words.length === 0) {
    const pool = getWordPool();
    state.words = getLearningQueue(pool, state.dailyCount);
  }

  state.wordIndex = 0;
  state.userInput = "";
  state.totalInputs = 0;
  state.totalCorrect = 0;
  state.totalErrors = 0;
  state.wordsCompleted = 0;
  state.startTime = null;
  state.endTime = null;
  state.isStarted = false;
  state.isComplete = false;
  state.isWrong = false;
  state.isStarted = true;
  state.startTime = Date.now();

  state.elements.resultOverlay.classList.remove("visible");
  state.elements.wordDisplay.innerHTML = "";
  state.elements.wordTranslation.textContent = "";
  state.elements.wordJyutping.textContent = "";
  updateStats();
  renderWord();
  updateProgress();
  state.elements.hiddenInput.focus();
}

// ============================================================

// WORD LOGIC — 单词推进、错误处理、正确字母处理
// ============================================================
function advanceWord() {
  const completedWord = state.words[state.wordIndex];
  state.wordIndex++;
  state.userInput = "";

  if (completedWord) recordCompletion(completedWord);

  if (state.wordIndex >= state.words.length) {
    finishSession();
    return;
  }

  renderWord();
  updateStats();
  state.elements.hiddenInput.focus();
}

function handleWrongInput() {
  state.isWrong = true;
  const curWord = state.words[state.wordIndex];
  if (curWord) recordWrongWord(curWord);
  updateLetterStates();
  playKeySound(false);
  flashFrame("wrong");

  const display = state.elements.wordDisplay;
  display.classList.add("shake");
  setTimeout(() => display.classList.remove("shake"), 400);

  // Clear and reset after delay (mimicking Qwerty Learner's 300ms delay) — 错误后清空输入并重置
  state.wrongTimer = setTimeout(() => {
    state.userInput = "";
    state.isWrong = false;
    renderWord();
    state.elements.hiddenInput.focus();
  }, 350);
}

function handleCorrectLetter() {
  state.totalCorrect++;
  updateLetterStates();
  playKeySound(true);
  flashFrame("correct");

  // Check if word is complete (spaces skipped, hyphens optional) — 检查单词是否已打完
  const word = state.words[state.wordIndex];
  let wi = 0, ui = 0;
  while (wi < word.en.length) {
    if (word.en[wi] === " ") { wi++; continue; }
    if (ui >= state.userInput.length) break;
    if (word.en[wi] === "-" && state.userInput[ui] === "-") { wi++; ui++; continue; }
    if (word.en[wi] === "-") { wi++; continue; }
    if (state.userInput[ui].toLowerCase() !== word.en[wi].toLowerCase()) break;
    wi++; ui++;
  }
  // Check if all non-space chars covered — 检查是否所有非空格字符已覆盖
  let remaining = false;
  for (let i = wi; i < word.en.length; i++) {
    if (word.en[i] !== " ") { remaining = true; break; }
  }
  if (!remaining) {
    state.wordsCompleted++;
    setTimeout(() => advanceWord(), 80);
  }
}

// ============================================================

// WORD RENDERING — 渲染当前单词到页面
// 将单词拆分为字母数组，空格/连字符渲染为特殊样式，其余字母初始化 normal 态
// ============================================================
function renderWord() {
  const word = state.words[state.wordIndex];
  if (!word) return;

  state.elements.wordTranslation.textContent = word.zh;
  state.elements.wordJyutping.textContent = word.jyut || "";
  state.elements.wordJyutping.style.visibility = "visible";

  const display = state.elements.wordDisplay;
  display.innerHTML = "";
  display.classList.remove("shake");

  for (let i = 0; i < word.en.length; i++) {
    const span = document.createElement("span");
    span.textContent = word.en[i];
    const ch = word.en[i];
    if (ch === " ") span.className = "letter space";
    else if (ch === "-") span.className = "letter skip";
    else span.className = "letter normal";
    span.dataset.index = i;
    display.appendChild(span);
  }

  updateProgress();
  recordAttempt(word);
  speakWord(word);
}

function updateLetterStates() {
  const word = state.words[state.wordIndex];
  const letters = state.elements.wordDisplay.querySelectorAll(".letter");

  letters.forEach(span => {
    const wordIdx = Number(span.dataset.index);
    span.classList.remove("normal", "correct", "wrong", "space", "skip");

    // Spaces and hyphens are always neutral — 空格和连字符始终为中性，跳过打字逻辑
    if (word.en[wordIdx] === " ") {
      span.classList.add("space");
      return;
    }
    if (word.en[wordIdx] === "-") {
      span.classList.add("skip");
      return;
    }

    const userIdx = nonSpaceCountBefore(word, wordIdx);

    if (state.isWrong) {
      if (userIdx < state.userInput.length) {
        if (state.userInput[userIdx].toLowerCase() === word.en[wordIdx].toLowerCase()) {
          span.classList.add("correct");
        } else {
          span.classList.add("wrong");
        }
      } else {
        span.classList.add("normal");
      }
    } else if (userIdx < state.userInput.length) {
      span.classList.add("correct");
    } else {
      span.classList.add("normal");
    }
  });
}

function updateProgress() {
  const total = state.words.length;
  const done = state.wordIndex;
  const pct = total > 0 ? (done / total) * 100 : 0;

  state.elements.progressFill.style.width = pct + "%";
  state.elements.progressCurrent.textContent = done;
  state.elements.progressTotal.textContent = total;
}

// ============================================================
// STATS — 实时统计更新（时间/WPM/准确率/输入数）
// ============================================================
function updateStats() {
  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  const minutes = elapsed / 60;
  const totalTyped = state.totalCorrect + state.totalErrors;

  const wpm = minutes > 0 ? Math.round((state.totalCorrect / 5) / minutes) : 0;
  const accuracy = totalTyped > 0 ? Math.round((state.totalCorrect / totalTyped) * 100) : 100;

  state.elements.timeDisplay.textContent = formatTime(elapsed);
  state.elements.inputDisplay.textContent = state.totalInputs;
  state.elements.wpmDisplay.textContent = wpm;
  state.elements.correctDisplay.textContent = state.totalCorrect;
  state.elements.accuracyDisplay.textContent = accuracy + "%";
}

// ============================================================

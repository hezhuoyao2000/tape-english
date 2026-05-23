// INPUT HANDLING — 核心键盘输入逻辑
// 字母逐字匹配（大小写不敏感），退格回退，空格/连字符自动跳过，
// 打错后 350ms 抖动重置，打完一个词后 150ms 自动推进
// ============================================================
function handleKeydown(e) {
  // Ignore if not started or complete — 未开始或已完成则忽略
  if (!state.isStarted || state.isComplete) return;

  // Close word list on any typing key if open — 打字时自动关闭词库面板
  if (document.getElementById("wordlistOverlay").classList.contains("visible")) {
    hideWordList();
    state.elements.hiddenInput.focus();
    return;
  }

  // Ignore if in wrong state (waiting for reset) — 错误抖动期间忽略输入
  if (state.isWrong) return;

  // Allow browser shortcuts — 允许 Ctrl/Meta/Alt 快捷键通过
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  e.preventDefault();

  // Handle backspace — 退格删除上一个已输入字符
  if (e.key === "Backspace") {
    if (state.userInput.length > 0) {
      state.userInput = state.userInput.slice(0, -1);
      state.totalInputs++;
      updateLetterStates();
    }
    updateStats();
    return;
  }

  // Only handle printable characters — 仅处理可打印单字符（字母/连字符）
  if (e.key.length !== 1) return;

  const word = state.words[state.wordIndex];
  if (!word) return;

  state.totalInputs++;
  const userIdx = state.userInput.length;
  state.userInput += e.key;
  const wordIdx = nthNonSpace(word, userIdx);

  // Hyphen matching: user can type "-" or skip it — 连字符可打可不打
  if (e.key === "-") {
    // Look for a hyphen between previous match and wordIdx — 在相邻字符间查找连字符
    const prevIdx = userIdx > 0 ? nthNonSpace(word, userIdx - 1) : -1;
    let found = false;
    for (let i = prevIdx + 1; i <= wordIdx && i < word.en.length; i++) {
      if (word.en[i] === "-") { found = true; break; }
    }
    if (found) {
      handleCorrectLetter();
    } else {
      state.totalErrors++;
      handleWrongInput();
    }
    updateStats();
    return;
  }

  if (e.key.toLowerCase() === word.en[wordIdx].toLowerCase()) {
    handleCorrectLetter();
  } else {
    state.totalErrors++;
    handleWrongInput();
  }

  updateStats();
}

// ============================================================

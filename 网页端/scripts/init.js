// INIT — 应用启动入口
// 1. 恢复主题/自定义配色/词库统计数据
// 2. 首次用户显示引导弹窗，老用户直接显示数量选择面板
// 3. START 确认后进入打字会话
// ============================================================
function init() {
  cacheElements();

  // Load saved theme & custom themes — 恢复保存的主题和自定义配色
  try {
    const savedCustom = localStorage.getItem("typing_custom_theme");
    if (savedCustom) customThemes["custom"] = JSON.parse(savedCustom);
    const savedHex = localStorage.getItem("typing_custom_hex");
    if (savedHex) document.getElementById("themeColorPicker").value = savedHex;
    const saved = localStorage.getItem("typing_theme");
    if (saved) applyTheme(saved);
  } catch (e) {}

  // Load persisted stats — 恢复本地存储的学习统计数据
  state.wordStats = loadWordStats();
  state.wrongWordCounts = loadWrongWords();

  // Wire theme dots (preset quick-select) — 绑定预设主题快捷切换圆点
  document.querySelectorAll(".theme-dot:not(.theme-dot-picker)").forEach(dot => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      applyTheme(dot.dataset.theme);
    });
  });

  // Wire color picker — 绑定HSL取色器输入事件
  document.getElementById("themeColorPicker").addEventListener("input", (e) => {
    e.stopPropagation();
    applyCustomColor(e.target.value);
  });

  // Show count selector first (or guide for first-time users) — 先显示数量选择面板（首次用户显示引导）
  const guideOverlay = document.getElementById("guideOverlay");
  const countOverlay = document.getElementById("countOverlay");

  // Expose dismiss function globally so onclick can reach it — 暴露关闭引导函数到全局供 onclick 调用
  window.dismissGuide = function() {
    guideOverlay.classList.add("hidden");
    countOverlay.classList.remove("hidden");
    localStorage.setItem("typing_guide_dismissed", "1");
  };

  if (!localStorage.getItem("typing_guide_dismissed")) {
    // First-time user: show guide, hide count selector — 首次用户：显示引导弹窗，隐藏数量选择
    countOverlay.classList.add("hidden");
    guideOverlay.classList.remove("hidden");
  }

  const pool = getWordPool();
  document.getElementById("countTotal").textContent = pool.length;

  let selectedCount = 30;
  let isCustom = false;

  document.querySelectorAll(".count-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".count-opt").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const val = Number(btn.dataset.count);
      if (val === -1) {
        isCustom = true;
        document.getElementById("countCustomWrap").style.display = "block";
        document.getElementById("countCustomInput").focus();
      } else {
        isCustom = false;
        document.getElementById("countCustomWrap").style.display = "none";
        selectedCount = val;
      }
    });
  });

  document.getElementById("countCustomInput").addEventListener("input", () => {
    selectedCount = Number(document.getElementById("countCustomInput").value) || 0;
  });

  document.getElementById("btnCountConfirm").addEventListener("click", () => {
    if (isCustom) {
      selectedCount = Number(document.getElementById("countCustomInput").value) || 0;
    }
    state.dailyCount = selectedCount;
    state.words = getLearningQueue(pool, selectedCount);
    state.elements.progressTotal.textContent = state.words.length;

    document.getElementById("countOverlay").classList.add("hidden");
    state.isStarted = true;
    state.startTime = Date.now();
    renderWord();
    updateProgress();
    updateStats();
    state.elements.hiddenInput.focus();

    finishInit();
  });
}

// 打字会话开始后绑定所有交互事件：键盘输入、按钮、面板开关、计时器、发音
function finishInit() {
  // 全局键盘监听 — 核心打字循环入口
  document.addEventListener("keydown", e => {
    handleKeydown(e);
  });

  // Hidden input — 隐藏输入框（接收键盘事件但不显示）
  state.elements.hiddenInput.addEventListener("focus", () => {
    state.elements.hiddenInput.value = "";
  });
  state.elements.hiddenInput.addEventListener("input", () => {
    state.elements.hiddenInput.value = "";
  });
  // Safari-fix: auto-refocus when input loses focus during typing — 失焦时自动恢复焦点
  state.elements.hiddenInput.addEventListener("blur", () => {
    if (state.isStarted && !state.isComplete) {
      setTimeout(() => {
        var ae = document.activeElement;
        if (ae && ae.tagName === "SELECT") return;
        state.elements.hiddenInput.focus();
      }, 10);
    }
  });

  // Result buttons — 结果面板按钮（重试/新组）
  state.elements.btnRetry.addEventListener("click", () => resetSession(true));
  state.elements.btnNewSet.addEventListener("click", () => resetSession(false));

  // Click overlay backdrop — 点击结果面板背景关闭
  state.elements.resultOverlay.addEventListener("click", e => {
    if (e.target === state.elements.resultOverlay) {
      resetSession(false);
    }
  });

  // Live timer — 实时计时器（requestAnimationFrame 驱动）
  function timerTick() {
    if (state.startTime && !state.isComplete) {
      updateStats();
    }
    requestAnimationFrame(timerTick);
  }
  requestAnimationFrame(timerTick);

  // Focus — 保持隐藏输入框获取焦点以接收键盘事件
  state.elements.hiddenInput.focus();
  document.addEventListener("click", (e) => {
    // Don't steal focus when interacting with word list or sound select — 词库/音效选择时不抢夺焦点
    if (document.getElementById("wordlistOverlay").classList.contains("visible")) return;
    if (e.target.closest && e.target.closest("#soundSelect")) return;
    state.elements.hiddenInput.focus();
  });

  // Sound toggle — 音效开关按钮
  document.getElementById("btnSound").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSound();
  });

  // Theme cycle (header T button) — 主题循环切换按钮
  document.getElementById("btnTheme").addEventListener("click", (e) => {
    e.stopPropagation();
    cycleTheme();
  });

  // Sound selector — 音效下拉选择
  document.getElementById("soundSelect").addEventListener("change", (e) => {
    e.stopPropagation();
    currentSoundPreset = e.target.value;
    _loadPresetAudio();
    try { localStorage.setItem("typing_sound", currentSoundPreset); } catch (e) {}
  });
  // Restore saved sound preference — 恢复保存的音效偏好
  try {
    const savedSound = localStorage.getItem("typing_sound");
    if (savedSound && _soundUri[savedSound + "_correct"]) {
      currentSoundPreset = savedSound;
      _loadPresetAudio();
      document.getElementById("soundSelect").value = savedSound;
    }
  } catch (e) {}

  // Manual pronunciation buttons — 手动发音按钮（英语/粤语）
  document.getElementById("btnPronounceEn").addEventListener("click", (e) => {
    e.stopPropagation();
    const word = state.words[state.wordIndex];
    if (word) speakEnglish(word);
  });
  document.getElementById("btnPronounceYue").addEventListener("click", (e) => {
    e.stopPropagation();
    const word = state.words[state.wordIndex];
    if (word) speakCantonese(word);
  });

  // Word list — 词库面板打开/关闭
  document.getElementById("btnWordList").addEventListener("click", (e) => {
    e.stopPropagation();
    showWordList();
  });
  document.getElementById("btnWordlistClose").addEventListener("click", (e) => {
    e.stopPropagation();
    hideWordList();
  });
  document.getElementById("wordlistOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) hideWordList();
  });

  // Review panel — 错词复习面板打开/关闭
  document.getElementById("btnReview").addEventListener("click", (e) => {
    e.stopPropagation();
    showReviewPanel();
  });
  document.getElementById("btnReviewClose").addEventListener("click", (e) => {
    e.stopPropagation();
    hideReviewPanel();
  });
  document.getElementById("reviewOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) hideReviewPanel();
  });

  // Word list sorting — 词库表头点击排序
  document.querySelectorAll(".wordlist-table th").forEach(th => {
    th.addEventListener("click", (e) => {
      e.stopPropagation();
      const field = th.dataset.sort;
      if (wordListSort.field === field) {
        wordListSort.asc = !wordListSort.asc;
      } else {
        wordListSort.field = field;
        wordListSort.asc = true;
      }
      renderWordList();
    });
  });

  // Review sorting — 复习面板表头点击排序
  document.querySelectorAll(".review-table th").forEach(th => {
    th.addEventListener("click", (e) => {
      e.stopPropagation();
      const field = th.dataset.sort;
      if (reviewSort.field === field) {
        reviewSort.asc = !reviewSort.asc;
      } else {
        reviewSort.field = field;
        reviewSort.asc = true;
      }
      renderReviewList();
    });
  });

  // Escape closes panels (skip when interacting with form elements) — ESC关闭面板（表单交互时跳过）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (document.activeElement && document.activeElement.tagName === "SELECT") return;
      if (document.getElementById("reviewOverlay").classList.contains("visible")) {
        hideReviewPanel();
        state.elements.hiddenInput.focus();
      } else if (document.getElementById("wordlistOverlay").classList.contains("visible")) {
        hideWordList();
        state.elements.hiddenInput.focus();
      } else if (state.isComplete) {
        resetSession(false);
      }
    }
  });
}

// Start app — DOM already ready since script runs at end of body （启动应用，脚本位于body末尾，DOM已就绪）
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

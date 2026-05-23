// ============================================================
// STATE — 全局状态对象，存储当前会话所有数据
// ============================================================
const state = {
  currentCategory: "workplace",
  words: [],           // current word list 当前单词列表
  wordIndex: 0,        // index in current list 当前列表索引
  userInput: "",       // characters typed for current word 当前单词已输入字符
  totalInputs: 0,      // total keystrokes 总击键数
  totalCorrect: 0,     // total correct keystrokes 总正确击键数
  totalErrors: 0,      // total wrong keystrokes 总错误击键数
  wordsCompleted: 0,   // number of words successfully typed 成功打完的单词数
  startTime: null,
  endTime: null,
  isStarted: false,
  isComplete: false,
  isWrong: false,      // currently in error state (waiting to reset) 当前处于错误状态，等待重置
  wrongTimer: null,
  soundEnabled: true,
  dailyCount: 0,       // 0 = all words（0表示全部单词）
  wordStats: {},       // { wordKey: { attempts, completed } } 单词学习统计
  wrongWordCounts: {}, // { wordKey: errorCount } 错词错误次数
  elements: {}
};

// ============================================================
// DOM CACHE — 缓存所有DOM元素引用
// ============================================================
function cacheElements() {
  state.elements = {
    wordDisplay: document.getElementById("wordDisplay"),
    wordTranslation: document.getElementById("wordTranslation"),
    wordJyutping: document.getElementById("wordJyutping"),
    categoryLabel: document.getElementById("categoryLabel"),
    timeDisplay: document.getElementById("timeDisplay"),
    inputDisplay: document.getElementById("inputDisplay"),
    wpmDisplay: document.getElementById("wpmDisplay"),
    correctDisplay: document.getElementById("correctDisplay"),
    accuracyDisplay: document.getElementById("accuracyDisplay"),
    progressFill: document.getElementById("progressFill"),
    progressCurrent: document.getElementById("progressCurrent"),
    progressTotal: document.getElementById("progressTotal"),
    resultOverlay: document.getElementById("resultOverlay"),
    resultWpm: document.getElementById("resultWpm"),
    resultAccuracy: document.getElementById("resultAccuracy"),
    resultTime: document.getElementById("resultTime"),
    resultWords: document.getElementById("resultWords"),
    resultErrors: document.getElementById("resultErrors"),
    btnRetry: document.getElementById("btnRetry"),
    btnNewSet: document.getElementById("btnNewSet"),
    hiddenInput: document.getElementById("hiddenInput")
  };
}

// ============================================================

# HK English Typing Practice — 网页端文档

港英打字练习，帮助在香港生活的人掌握香港英语日常词汇。纯原生 HTML/CSS/JS，无依赖，双击即可运行。

---

## 功能概览

| 功能 | 描述 |
|------|------|
| 打字练习 | 逐字母匹配，大小写不敏感，空格/连字符自动跳过 |
| 词库浏览 | 全词库表格，支持按单词/中文/尝试次数排序 |
| 错词复习 | 记录打错次数，按错误数降序展示 |
| TTS 发音 | 英语 (en-US) + 粤语 (zh-HK)，先英后粤自动链式播放 |
| 键盘音效 | 5 种机械键盘音色（mechanical/membrane/typewriter/blue/thock） |
| 主题切换 | 6 套预设主题 + HSL 取色器无限自定义配色 |
| 学习进度 | localStorage 持久化，记录每词尝试/完成次数 |
| 会话统计 | WPM、准确率、时间、击键数，结束后星级评分 |
| 历史记录 | 最近 10 次会话记录（日期/WPM/准确率/星级） |

---

## 目录结构

```
网页端/
├── index.html                  # 入口文件（266行，纯 HTML 骨架 + 外链引用）
│
├── styles/                     # 所有 CSS 样式
│   ├── base.css                # CSS 变量、全局重置、星空/扫描线背景
│   ├── layout.css              # 头栏、主内容区、进度条、底部统计栏
│   ├── overlays.css            # 所有浮层面板（引导/数量选择/结果/词库/复习）
│   └── responsive.css          # 响应式媒体查询
│
├── scripts/
│   ├── data/
│   │   └── wordbank.js         # 【词库数据字典】纯数据，无逻辑
│   │
│   ├── state.js                # 全局状态对象 + DOM 元素缓存
│   ├── sounds.js               # 键盘音效生成与播放（含通用工具函数）
│   ├── queue.js                # 单词队列排序（学习优先级算法）
│   ├── storage.js              # localStorage 读写封装
│   ├── helpers.js              # 空格/连字符跳过工具函数
│   ├── speech.js               # TTS 发音 + 音效开关 + 词库入口
│   ├── render.js               # 单词渲染 + 字母状态着色 + 实时统计更新
│   ├── typing.js               # 单词推进逻辑 + 错误处理
│   ├── session.js              # 会话控制（开始/结束/重置/评分/历史）
│   ├── input.js                # 键盘输入核心处理器
│   │
│   ├── panels/
│   │   ├── wordlist.js         # 词库浏览面板（渲染 + 排序）
│   │   ├── themes.js           # 主题系统（预设 + HSL 自定义）
│   │   └── review.js           # 错词复习面板（渲染 + 排序）
│   │
│   └── init.js                 # 应用初始化入口 + 所有事件绑定
│
└── asset/                      # 静态资源（截图等）
```

---

## 模块详细说明

### `scripts/data/wordbank.js` — 词库数据字典

**职责**：存储全部词汇数据，纯数据文件，零逻辑。

**数据结构**：
```js
const wordBank = {
  workplace: [                          // 职场英语（~290词）
    { en: "revert", zh: "回复", jyut: "wui4 fuk1" },
  ],
  daily: [                              // 港式日常（~423词）
    { en: "cha chaan teng", zh: "茶餐厅", jyut: "caa4 caan1 teng1" },
  ]
};
```

**字段说明**：
- `en`：英文单词（支持空格如 `"hot pot"`、连字符如 `"check-in"`）
- `zh`：中文释义
- `jyut`：粤拼（Jyutping 声调数字标记）

**添加词汇**：在对应分类数组末尾追加 `{ en, zh, jyut }` 对象即可。添加新分类需同步修改 `speech.js` 中的 `getWordPool()`。

---

### `scripts/state.js` — 全局状态

**职责**：单一全局 `state` 对象 + `cacheElements()` DOM 缓存。

**`state` 关键字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `currentCategory` | string | 当前词库分类（`"workplace"` \| `"daily"`） |
| `words` | array | 当前练习的单词列表（已排序） |
| `wordIndex` | number | 当前单词在列表中的位置 |
| `userInput` | string | 用户已输入的字符序列（当前单词） |
| `totalInputs` | number | 本次会话总击键数 |
| `totalCorrect` | number | 正确击键数 |
| `totalErrors` | number | 错误击键数 |
| `wordsCompleted` | number | 已完成单词数 |
| `isStarted` | boolean | 会话是否进行中 |
| `isComplete` | boolean | 会话是否已结束 |
| `isWrong` | boolean | 当前处于错误抖动等待状态 |
| `wrongTimer` | timeout | 错误重置的定时器引用 |
| `soundEnabled` | boolean | 音效开关 |
| `dailyCount` | number | 本次选定词数（0 = 全部） |
| `wordStats` | object | `{ wordKey: { attempts, completed } }` 各词统计 |
| `wrongWordCounts` | object | `{ wordKey: errorCount }` 错词记录 |
| `elements` | object | 由 `cacheElements()` 填充的 DOM 引用 |

**`state.elements` 包含的 DOM 引用**：`wordDisplay`、`wordTranslation`、`wordJyutping`、`categoryLabel`、`timeDisplay`、`inputDisplay`、`wpmDisplay`、`correctDisplay`、`accuracyDisplay`、`progressFill`、`progressCurrent`、`progressTotal`、`resultOverlay`、`resultWpm`、`resultAccuracy`、`resultTime`、`resultWords`、`resultErrors`、`btnRetry`、`btnNewSet`、`hiddenInput`。

---

### `scripts/sounds.js` — 键盘音效

**职责**：在页面加载时预生成所有音效的 WAV data URI，并管理 Audio 对象池。同文件还包含通用工具函数 `flashFrame()` 和 `formatTime()`。

**核心机制**：
1. `_render(wave, f0, f1, dur, vol)` — 相位累积波形合成，支持线性扫频（`sin`/`tri`/`sqr`/`saw`）
2. `_wavUri(samples)` — Float32Array → WAV PCM → base64 data URI
3. 每种音色预加载 4 个 `Audio` 元素组成池，按键时轮询使用，避免 Safari 的单 Audio 限制

**音色列表**（`currentSoundPreset`）：

| 键值 | 描述 |
|------|------|
| `mechanical` | 机械键盘（tri 波，高频扫降） |
| `membrane` | 薄膜键盘（sin 波，柔和） |
| `typewriter` | 打字机（sqr 波，双层混合） |
| `blue` | 青轴（sqr 波，高频清脆） |
| `thock` | Thock（sin 波，低频厚重） |

**暴露 API**：
- `playKeySound(isCorrect: boolean)` — 播放正确/错误音效
- `flashFrame(type: "correct" | "wrong")` — 单词框闪光
- `formatTime(totalSeconds: number): string` — 格式化时间为 `MM:SS`
- `_loadPresetAudio()` — 切换音色后重建 Audio 池
- `currentSoundPreset` — 当前音色键（可读写）

---

### `scripts/queue.js` — 学习队列

**职责**：单词优先级排序，确保薄弱词优先出现。

**算法**：
1. 把词池分为两组：`completed === 0`（未掌握）和 `completed > 0`（已掌握）
2. 两组各自随机打乱（Fisher-Yates）
3. 未掌握组置顶，已掌握组沉底
4. 若 `dailyCount > 0`，取前 N 词

**暴露 API**：
- `shuffle(arr): array` — 纯函数，返回新数组
- `getLearningQueue(pool, dailyCount): array` — 返回排序后的练习队列

---

### `scripts/storage.js` — 本地持久化

**职责**：所有 localStorage 读写，统一封装，带 try/catch 防止配额超限崩溃。

**localStorage 键一览**：

| 键名 | 类型 | 内容 |
|------|------|------|
| `typing_word_stats` | JSON | `{ [wordKey]: { attempts, completed } }` |
| `typing_wrong_words` | JSON | `{ [wordKey]: errorCount }` |
| `typing_session_history` | JSON | 最近 10 次会话记录数组 |
| `typing_theme` | string | 当前主题键名 |
| `typing_custom_theme` | JSON | 自定义主题配色对象 |
| `typing_custom_hex` | string | 自定义主题的原始 HEX 颜色值 |
| `typing_sound` | string | 当前音效键名 |
| `typing_guide_dismissed` | string | `"1"` 表示已关闭新手引导 |

**wordKey 约定**：`word.en.toLowerCase()`，用于跨会话稳定标识单词。

**暴露 API**：`loadWordStats()`、`saveWordStats()`、`loadWrongWords()`、`saveWrongWords()`、`recordWrongWord(word)`、`recordAttempt(word)`、`recordCompletion(word)`。

---

### `scripts/helpers.js` — 跳字符工具

**职责**：处理单词中的空格和连字符——这两类字符用户无需手动输入。

**跳过规则**：空格始终跳过；连字符可打可不打（打了算正确，不打也能通过）。

**暴露 API**：
- `isSkipChar(c: string): boolean`
- `typableLength(word): number` — 需要实际击键的字符数
- `nthNonSpace(word, n): number` — 用户第 n 次击键对应的单词字符索引
- `nonSpaceCountBefore(word, wordIdx): number`

---

### `scripts/speech.js` — TTS 发音

**职责**：调用 Web Speech API 进行英语和粤语朗读，以及音效开关状态管理。同文件包含 `getWordPool()` 作为词库入口。

**发音逻辑**：
- `speakWord(word)` — 朗读英语后自动链式朗读粤语（通过 `u.onend` 回调）
- `speakCantonese(word)` — 优先使用系统 `zh-HK` 语音；不可用时 fallback 到 Google TTS
- `speechGeneration` 计数器防止旧的异步朗读覆盖新请求

**`getWordPool()`**：当前返回 `wordBank.workplace`。切换分类时修改此函数。

**暴露 API**：`speakWord(word)`、`speakEnglish(word)`、`speakCantonese(word)`、`toggleSound()`、`getWordPool(): array`。

---

### `scripts/render.js` — 渲染与实时统计

**职责**：将当前单词渲染为字母 `<span>` 序列，根据输入状态着色，更新进度条和统计数据。

**字母状态 CSS 类**：

| 类名 | 含义 |
|------|------|
| `normal` | 未输入 |
| `correct` | 已正确输入 |
| `wrong` | 输入错误（`isWrong` 状态下显示） |
| `space` | 空格字符（宽间距，永远中性） |
| `skip` | 连字符（细横线，永远中性） |

**WPM 计算**：`Math.round((totalCorrect / 5) / minutes)`，5 字符为一词的标准打字公式。

**暴露 API**：`renderWord()`、`updateLetterStates()`、`updateProgress()`、`updateStats()`。

---

### `scripts/typing.js` — 打字逻辑

**职责**：单词级别的推进和错误处理。

**流程**：
- 正确 → `handleCorrectLetter()` → 着色 + 音效 + 判断完词 → 80ms 后 `advanceWord()`
- 错误 → `handleWrongInput()` → 记录错词 + shake 动画 + 350ms 后重置输入
- 完词 → `advanceWord()` → 推进索引 → 列表结束则 `finishSession()`

**暴露 API**：`advanceWord()`、`handleWrongInput()`、`handleCorrectLetter()`。

---

### `scripts/session.js` — 会话控制

**职责**：管理一轮练习的完整生命周期。

**会话生命周期**：
```
init() → 数量确认 → [打字循环] → finishSession() → showResults()
  → [Retry]     resetSession(keepWords=true)
  → [New Words] resetSession(keepWords=false)
```

**星级评分**：

| 准确率 | 星级 | 标签 |
|--------|------|------|
| ≥ 95%  | ★★★ | Perfect |
| ≥ 85%  | ★★☆ | Great Job |
| ≥ 70%  | ★☆☆ | Good Effort |
| < 70%  | ☆☆☆ | Keep Practicing |

**暴露 API**：`finishSession()`、`showResults()`、`hideResults()`、`resetSession(keepWords)`、`saveSessionRecord(...)`、`renderSessionHistory()`。

---

### `scripts/input.js` — 键盘输入

**职责**：`keydown` 事件的核心处理函数，是打字引擎的唯一入口。

**处理流程**：
1. 状态门控：未开始/已完成/错误抖动期 → 忽略
2. 词库面板打开时任意键 → 关闭面板
3. Ctrl/Meta/Alt → 放行
4. Backspace → 删除上一字符
5. 可打印字符 → 与 `word.en[wordIdx]` 比较 → 正确/错误分支
6. 连字符特殊处理：查找附近是否有 `-`

**暴露 API**：`handleKeydown(e: KeyboardEvent)`。

---

### `scripts/panels/wordlist.js` — 词库面板

**职责**：渲染词库浏览面板，支持按英文/中文/尝试次数/完成次数排序。排序状态保存在模块内 `wordListSort = { field, asc }`。

**暴露 API**：`renderWordList()`、`showWordList()`、`hideWordList()`。

---

### `scripts/panels/themes.js` — 主题系统

**职责**：管理 6 套预设主题和 HSL 自定义主题，通过动态注入 `<style id="theme-style">` 覆写 `:root` CSS 变量。

**预设主题**：`classic`（默认深色）、`ink`（素黑）、`white`（纯白）、`apricot`（暖杏）、`mint`（薄荷）、`mist`（雾蓝）。

**自定义主题生成**：HEX → HSL → 判断亮度决定深/浅色模式 → 色轮偏移生成各功能色。

**CSS 变量（共 15 个）**：`--bg`、`--surface`、`--surface-alt`、`--neon-cyan`、`--neon-magenta`、`--neon-purple`、`--neon-green`、`--neon-red`、`--neon-amber`、`--text`、`--text-muted`、`--border-subtle`、`--glass-bg`、`--star-opacity`、`--scanline-opacity`。

**暴露 API**：`applyTheme(key)`、`cycleTheme()`、`applyCustomColor(hex)`、`generateThemeFromColor(hex)`、`hexToHsl(hex)`、`hslToHex(h,s,l)`。

---

### `scripts/panels/review.js` — 错词复习面板

**职责**：渲染错词列表，展示英文/中文/粤拼/错误次数，支持排序。数据来源：`state.wrongWordCounts`。

**暴露 API**：`renderReviewList()`、`showReviewPanel()`、`hideReviewPanel()`。

---

### `scripts/init.js` — 应用入口

**职责**：DOM 就绪后的全部初始化和事件绑定，分两阶段：

- **`init()`**（加载时）：恢复主题/音效/统计数据 → 判断首次/老用户 → 绑定数量确认 → 调 `finishInit()`
- **`finishInit()`**（会话开始后）：全局键盘监听、Safari focus 修复、结果面板按钮、rAF 计时器、音效/主题/发音/词库/复习面板的所有事件绑定

---

## CSS 架构

### 变量系统（`styles/base.css` `:root`）

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--bg` | `#08081a` | 页面背景色 |
| `--surface` | `#10102a` | 卡片/面板背景 |
| `--neon-cyan` | `#00f0ff` | 主强调色（正确/高亮） |
| `--neon-green` | `#00ff88` | 进度/完成色 |
| `--neon-red` | `#ff3366` | 错误色 |
| `--text` | `#e0e0f0` | 主文字色 |
| `--font-mono` | SF Mono/Fira Code/... | 全局等宽字体栈 |

主题切换通过 JS 动态注入 `<style id="theme-style">` 覆写 `:root`，不修改 CSS 文件。

---

## 数据流

```
用户按键
  └─> handleKeydown (input.js)
        ├─> [正确] handleCorrectLetter (typing.js)
        │     ├─> updateLetterStates + playKeySound + flashFrame
        │     └─> [完词] advanceWord → recordCompletion → renderWord → speakWord
        │               └─> [列表结束] finishSession (session.js)
        └─> [错误] handleWrongInput (typing.js)
                  └─> recordWrongWord + updateLetterStates + playKeySound
```

---

## localStorage 数据结构速查

```js
typing_word_stats:       { "revert": { attempts: 5, completed: 3 } }
typing_wrong_words:      { "revert": 2 }
typing_session_history:  [{ date: "2026-05-23", wpm: 42, accuracy: 88, words: 30, stars: 2 }]
typing_theme:            "classic"
typing_custom_theme:     { bg: "#...", surface: "#...", ... }
typing_custom_hex:       "#00f0ff"
typing_sound:            "mechanical"
typing_guide_dismissed:  "1"
```

---

## 如何运行

直接双击 `index.html` 在浏览器���打开，无需服务器，无需构建，无任何依赖。

> TTS 粤语 Google fallback 需要网络；键盘音效和 Web Speech API 本地即可。

---

## 如何扩展

### 添加新词

在 `scripts/data/wordbank.js` 对应分类末尾追加：
```js
{ en: "new word", zh: "新词", jyut: "san1 ci4" }
```

### 添加新词库分类

1. 在 `wordbank.js` 的 `wordBank` 对象中新增分类数组
2. 修改 `speech.js` 的 `getWordPool()` 返回新分类

### 添加新主题

在 `scripts/panels/themes.js` 的 `presetThemes` 中新增配置，并将键名加入 `themeOrder`：
```js
sakura: { name: "樱花", bg: "#fff0f5", surface: "#ffffff", ... }
```

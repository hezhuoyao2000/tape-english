# CLAUDE.md — AI 开发规范

本文件规范 AI 在此仓库中的开发行为。所有修改必须遵循以下规则。

---

## 项目概述

**HK English Typing Practice**：帮助在港人士练习香港英语词汇的打字工具。

- `网页端/`：纯原生 HTML/CSS/JS，无构建工具，无依赖，双击 index.html 即可运行
- `小程序端/`：微信小程序版本（结构已独立，本规范主要约束网页端）

---

## 架构要点

### 网页端文件职责

```
scripts/data/wordbank.js   ← 唯一词库数据源，纯数据，零逻辑
scripts/state.js           ← 唯一全局状态对象 (state) + DOM缓存
scripts/sounds.js          ← 音效 + flashFrame + formatTime
scripts/queue.js           ← 单词排队算法
scripts/storage.js         ← 所有 localStorage 操作
scripts/helpers.js         ← 跳字符工具函数
scripts/speech.js          ← TTS + toggleSound + getWordPool()
scripts/render.js          ← DOM渲染 + 实时统计
scripts/typing.js          ← 单词推进与错误处理
scripts/session.js         ← 会话生命周期管理
scripts/input.js           ← 键盘输入唯一入口
scripts/panels/wordlist.js ← 词库面板
scripts/panels/themes.js   ← 主题系统
scripts/panels/review.js   ← 错词复习面板
scripts/init.js            ← 初始化 + 所有事件绑定
```

### 脚本加载顺序（依赖顺序，不可随意调换）

```html
wordbank.js → state.js → sounds.js → queue.js → storage.js
→ helpers.js → speech.js → render.js → typing.js → session.js
→ input.js → panels/* → init.js
```

`init.js` 必须最后加载，它依赖所有其他模块。

### 全局作用域共享

所有脚本通过全局作用域共享变量（无 ES Modules）。主要全局变量：
- `wordBank`（来自 wordbank.js）
- `state`（来自 state.js）
- 各模块的函数（直接挂在 `window` 上）

---

## 开发规则

### 1. 注释规范

**仅在以下情况写注释**：
- 非显而易见的约束（如 Safari Audio 池限制、speechGeneration 防竞态）
- 算法的核心假设（如 Fisher-Yates 为何从末尾向前遍历）
- 平台 workaround（如 `pendingUtterance` 防 GC）

**禁止写的注释**：
- 解释代码做了什么（代码本身已清楚表达）
- 重复函数名的注释（`// renderWord — renders the word`）
- 任务来源或 PR 编号（属于 commit message）
- 中英文双重描述同一事物（选一种，保持一致）

**现有注释风格**（保持兼容）：双语注释行用 `—` 分隔，如：
```js
// Cancel any current speech, then wait 20ms for cancel to flush — 取消当前语音，等待20ms让cancel生效
```

### 2. 模块解耦规则

**允许的跨模块调用**（已建立的依赖关系）：

| 调用方 | 可以调用 |
|--------|---------|
| 任意模块 | `state.*`、`formatTime()`、`flashFrame()` |
| render.js | `nonSpaceCountBefore()`、`recordAttempt()`、`speakWord()` |
| typing.js | `renderWord()`、`updateLetterStates()`、`playKeySound()`、`flashFrame()`、`recordWrongWord()`、`recordCompletion()`、`finishSession()` |
| session.js | `updateStats()`、`showResults()`、`renderWord()`、`getLearningQueue()`、`getWordPool()` |
| input.js | `handleCorrectLetter()`、`handleWrongInput()`、`updateLetterStates()`、`updateStats()`、`nthNonSpace()`、`hideWordList()` |
| panels/* | `state.*`、`getWordPool()` |
| init.js | 所有模块 |

**禁止的耦合**：
- `wordbank.js` 不能调用任何其他模块的函数（纯数据）
- `state.js` 不能调用任何其他模块的函数（纯数据结构）
- `storage.js` 只能读写 `state.wordStats` 和 `state.wrongWordCounts`，不能调用 UI 函数
- `helpers.js` 只能处理字符串运算，不能访问 DOM 或 `state`（除 `word.en`）
- `queue.js` 只能读取 `state.wordStats`，不能调用 UI 函数

### 3. 扩展模式

#### 添加新词汇
只修改 `scripts/data/wordbank.js`，追加到对应分类末尾。不要修改其他文件。

#### 添加新词库分类
1. 在 `wordbank.js` 新增分类数组
2. 修改 `speech.js` 的 `getWordPool()` 函数
3. 修改 `state.js` 的 `state.currentCategory` 初始值（如需）
4. 考虑在 index.html 添加分类切换 UI

#### 添加新主题
只修改 `scripts/panels/themes.js`：
- 在 `presetThemes` 对象新增配置
- 在 `themeOrder` 数组末尾追加键名
- 同步在 `index.html` 的数量选择面板 `.theme-row` 中添加对应 `.theme-dot` 按钮

#### 添加新键盘音效
只修改 `scripts/sounds.js`：
- 在 `_soundUri` 的 IIFE 中添加 `defs` 条目（或合成代码）
- 在 `index.html` 的 `<select id="soundSelect">` 添加 `<option>`

#### 添加新功能面板
1. 在 `scripts/panels/` 创建新文件
2. 在 `index.html` 底部脚本区，`panels/review.js` 之后、`init.js` 之前添加 `<script src>`
3. 在 `index.html` body 末尾添加面板 HTML
4. 在 `styles/overlays.css` 添加面板样式
5. 在 `scripts/init.js` 的 `finishInit()` 绑定面板开关事件

### 4. CSS 规则

- **不要**在 JS 中硬编码颜色值——使用 CSS 变量（`var(--neon-cyan)` 等）
- 主题颜色**只通过** `themes.js` 的 `applyTheme()` 修改，不要直接操作 CSS 文件
- 新增样式按功能归类到对应 CSS 文件：
  - 基础变量/重置 → `base.css`
  - 布局/头栏/主区 → `layout.css`
  - 面板/浮层 → `overlays.css`
  - 响应式 → `responsive.css`
- 不要在 `index.html` 中写内联 `<style>` 标签（主题动态注入除外，由 JS 负责）

### 5. localStorage 规则

- 所有 localStorage 操作必须通过 `storage.js` 中的函数，不要直接调用 `localStorage.setItem/getItem`（`init.js` 和 `session.js` 中的主题/会话历史写入除外，这些是独立的非词库数据）
- 新增存储键必须在 `storage.js` 顶部注释中登记
- 所有 localStorage 操作必须包裹 try/catch

### 6. HTML 规则

- `index.html` 只包含 HTML 结构，不写内联 `<script>` 或 `<style>`（`<style>` 由主题系统动态注入）
- 新增 DOM 元素如需在 JS 中频繁访问，添加到 `state.js` 的 `cacheElements()` 中
- 不要在 HTML 中写内联事件处理（`onclick="..."` 等），唯一例外是引导面板的 `dismissGuide()` 调用（历史遗留，暂时保留）

### 7. 不要做的事

- 不要引入 npm、CDN 或任何外部 JS 库
- 不要使用 ES Modules（`type="module"`）——当前用全局作用域加载，添加 module 会破坏兼容性
- 不要修改脚本加载顺序，除非彻底理解依赖关系
- 不要在 `wordbank.js` 中添加任何逻辑代码
- 不要在 `state.js` 中添加函数（只放数据结构）
- 不要在 `init.js` 以外的地方绑定 DOM 事件（`render.js` 的 flashFrame DOM 操作例外）
- 不要"清理"或删除中文注释——它们是双语文档的一部分

---

## 提交规范

### Commit Message 格式

```
type(scope): 简短描述（中英文均可）

可选详细说明。

https://claude.ai/code/session_...
```

**type**：`feat`（新功能）、`fix`（修复）、`refactor`（重构）、`style`（样式）、`docs`（文档）

**scope**：`web`（网页端）、`miniapp`（小程序端）、`data`（词库数据）

**示例**：
```
feat(web): 添加 transportation 词库分类
fix(web): 修复 Safari 粤语 TTS 在 iOS 16 上不发音的问题
data: 新增 50 个饮食类香港词汇
```

### 分支规范

- 功能开发在独立分支，合并前确保 `index.html` 可以直接双击运行
- 每个重构阶段单独 commit，便于回滚

---

## 常见错误排查

| 症状 | 可能原因 |
|------|---------|
| 音效不播放 | Safari 需要用户交互才能播放音频，检查 Audio 池是否初始化 |
| 粤语不发音 | 系统无 zh-HK 语音；Google TTS fallback 需要网络 |
| localStorage 数据丢失 | 隐私模式下 localStorage 禁用；quota 超限 |
| 主题不生效 | `<style id="theme-style">` 是否被意外删除 |
| 打字无响应 | `hiddenInput` 是否失焦；检查 `state.isStarted` 是否为 true |
| 脚本报错 undefined | 检查 `index.html` 中脚本加载顺序是否正确 |

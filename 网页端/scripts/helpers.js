// SKIP-SYMBOL HELPERS — 空格/连字符自动跳过，用户不需要输入
// typableLength — 单词需打字的字符数（排除空格/连字符）
// nthNonSpace — 用户第n次按键对应单词中实际位置（跳过空格/连字符）
// ============================================================
function isSkipChar(c) {
  return c === " " || c === "-";
}

function typableLength(word) {
  let n = 0;
  for (let i = 0; i < word.en.length; i++) {
    if (!isSkipChar(word.en[i])) n++;
  }
  return n;
}

function nthNonSpace(word, n) {
  let count = 0;
  for (let i = 0; i < word.en.length; i++) {
    if (!isSkipChar(word.en[i])) {
      if (count === n) return i;
      count++;
    }
  }
  return -1;
}

function nonSpaceCountBefore(word, wordIdx) {
  let count = 0;
  for (let i = 0; i < wordIdx; i++) {
    if (!isSkipChar(word.en[i])) count++;
  }
  return count;
}

// ============================================================

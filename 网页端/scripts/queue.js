// Fisher-Yates shuffle — 随机打乱数组，用于学习队列随机化
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 学习队列：未掌握的单词(completed=0)置顶，已掌握的沉底，两组各自随机
// 确保薄弱词汇优先出现，提高学习效率
function getLearningQueue(pool, dailyCount) {
  const unlearned = pool.filter(w => {
    const stats = state.wordStats[w.en.toLowerCase()];
    return !stats || stats.completed === 0;
  });
  const learned = pool.filter(w => {
    const stats = state.wordStats[w.en.toLowerCase()];
    return stats && stats.completed > 0;
  });
  const result = [...shuffle(unlearned), ...shuffle(learned)];
  if (dailyCount > 0 && result.length > dailyCount) {
    return result.slice(0, dailyCount);
  }
  return result;
}

// ============================================================

// WORD LIST PANEL — 显示全部词库，每词展示尝试/完成次数，支持点击表头排序
// ============================================================
let wordListSort = { field: "en", asc: true };

function renderWordList() {
  const tbody = document.getElementById("wordlistBody");
  const empty = document.getElementById("wordlistEmpty");
  const pool = getWordPool();

  if (pool.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  // Build rows with stats — 构建带统计数据的表格行
  let rows = pool.map(w => {
    const key = w.en.toLowerCase();
    const stats = state.wordStats[key] || { attempts: 0, completed: 0 };
    const cat = "—";
    return { word: w, cat, attempts: stats.attempts, completed: stats.completed };
  });

  // Sort — 按选定字段排序
  const sf = wordListSort.field;
  rows.sort((a, b) => {
    let va, vb;
    if (sf === "en") { va = a.word.en.toLowerCase(); vb = b.word.en.toLowerCase(); }
    else if (sf === "zh") { va = a.word.zh; vb = b.word.zh; }
    else if (sf === "cat") { va = a.cat; vb = b.cat; }
    else { va = a[sf]; vb = b[sf]; }
    if (va < vb) return wordListSort.asc ? -1 : 1;
    if (va > vb) return wordListSort.asc ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = rows.map(r =>
    `<tr>
      <td>${r.word.en}</td>
      <td class="wl-zh">${r.word.zh}</td>
      <td>${r.cat}</td>
      <td class="wl-count">${r.attempts}</td>
      <td class="wl-count">${r.completed}</td>
    </tr>`
  ).join("");
}

function showWordList() {
  renderWordList();
  document.getElementById("wordlistOverlay").classList.add("visible");
}

function hideWordList() {
  document.getElementById("wordlistOverlay").classList.remove("visible");
}

// ============================================================

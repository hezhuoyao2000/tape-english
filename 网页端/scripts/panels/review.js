// REVIEW PANEL — 错词复习面板，显示打错过的词和错误次数，默认按错误数降序排列
// ============================================================
let reviewSort = { field: "errors", asc: false };

function renderReviewList() {
  const tbody = document.getElementById("reviewBody");
  const empty = document.getElementById("reviewEmpty");
  const pool = getWordPool();

  // Build word lookup for zh/jyut — 构建英文→中文/粤拼的查找表
  const wordLookup = {};
  pool.forEach(w => { wordLookup[w.en.toLowerCase()] = w; });

  // Build rows from wrongWordCounts — 从错词记录构建表格行
  let rows = [];
  for (const [key, count] of Object.entries(state.wrongWordCounts)) {
    if (count === 0) continue;
    const w = wordLookup[key];
    rows.push({
      en: w ? w.en : key,
      zh: w ? w.zh : "—",
      jyut: w ? (w.jyut || "") : "",
      errors: count
    });
  }

  if (rows.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  // Sort — 按选定字段排序
  const sf = reviewSort.field;
  rows.sort((a, b) => {
    let va, vb;
    if (sf === "en") { va = a.en.toLowerCase(); vb = b.en.toLowerCase(); }
    else if (sf === "zh") { va = a.zh; vb = b.zh; }
    else if (sf === "jyut") { va = a.jyut; vb = b.jyut; }
    else { va = a[sf]; vb = b[sf]; }
    if (va < vb) return reviewSort.asc ? -1 : 1;
    if (va > vb) return reviewSort.asc ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = rows.map(r =>
    `<tr>
      <td>${r.en}</td>
      <td class="rv-zh">${r.zh}</td>
      <td class="rv-zh">${r.jyut}</td>
      <td class="rv-err">${r.errors}</td>
    </tr>`
  ).join("");
}

function showReviewPanel() {
  renderReviewList();
  document.getElementById("reviewOverlay").classList.add("visible");
}

function hideReviewPanel() {
  document.getElementById("reviewOverlay").classList.remove("visible");
}

// ============================================================

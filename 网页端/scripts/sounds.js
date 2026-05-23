// KEYBOARD SOUNDS — 预生成 WAV data URI，通过 Audio 元素池播放
// 相位累积生成波形（修复频率扫描 NaN 问题），Audio 池避免 Safari 限制
// ============================================================
var currentSoundPreset = "mechanical";

var _SR = 22050;
var _wave = {
  sin: function(p) { return Math.sin(6.28318530718 * p); },
  tri: function(p) { return 2 * Math.abs(2 * (p - (p | 0) - 0.5)) - 1; },
  sqr: function(p) { return Math.sin(6.28318530718 * p) > 0 ? 1 : -1; },
  saw: function(p) { return 2 * (p - (p | 0)) - 1; }
};
function _render(wave, f0, f1, dur, vol) {
  var n = (_SR * dur) | 0, s = new Float32Array(n), ph = 0, i, t, env;
  for (i = 0; i < n; i++) {
    t = i / _SR;
    ph += (f0 + (f1 - f0) * (t / dur)) / _SR;
    env = vol * (1 - t / dur);
    if (env < 0) env = 0;
    s[i] = _wave[wave](ph) * env;
  }
  return s;
}
function _wavUri(samples) {
  var n = samples.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), i, smp;
  var ws = function(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); ws(8, "WAVE");
  ws(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, _SR, true); v.setUint32(28, _SR * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, "data"); v.setUint32(40, n * 2, true);
  for (i = 0; i < n; i++) { smp = samples[i]; v.setInt16(44 + i * 2, smp > 1 ? 32767 : smp < -1 ? -32768 : (smp * 32767) | 0, true); }
  var bytes = new Uint8Array(buf), b64 = "", j;
  for (i = 0; i < bytes.length; i += 2048) {
    var chunk = bytes.slice(i, i + 2048), arr = new Array(chunk.length);
    for (j = 0; j < chunk.length; j++) arr[j] = chunk[j];
    b64 += btoa(String.fromCharCode.apply(null, arr));
  }
  return "data:audio/wav;base64," + b64;
}

// Build all sound URIs at load time — 加载时预生成所有音效
var _soundUri = {};
(function() {
  var defs = [
    ["mechanical_correct", "tri", 2400, 800, 0.04, 0.25],
    ["mechanical_wrong",   "saw",  120,  120, 0.12, 0.15],
    ["membrane_correct",   "sin",  600,  200, 0.03, 0.12],
    ["membrane_wrong",     "sin",  200,  200, 0.10, 0.08],
    ["typewriter_wrong",   "sqr",  100,  100, 0.15, 0.18],
    ["blue_wrong",         "sqr",  180,  180, 0.10, 0.20],
    ["thock_wrong",        "sin",  150,  150, 0.12, 0.18]
  ];
  for (var d = 0; d < defs.length; d++) {
    var key = defs[d][0], w = defs[d][1], f0 = defs[d][2], f1 = defs[d][3], dur = defs[d][4], vol = defs[d][5];
    _soundUri[key] = _wavUri(_render(w, f0, f1, dur, vol));
  }
  // Merge ring layers into correct sounds — 合并双层音效（取最长层为基准）
  _soundUri["typewriter_correct"] = (function() {
    var a = _render("sqr", 1800, 400, 0.06, 0.20), b = _render("tri", 3200, 2000, 0.08, 0.10);
    var len = a.length > b.length ? a.length : b.length, out = new Float32Array(len);
    for (var i = 0; i < len; i++) out[i] = (a[i] || 0) + (b[i] || 0);
    return _wavUri(out);
  })();
  _soundUri["blue_correct"] = (function() {
    var a = _render("sqr", 3500, 1200, 0.03, 0.30), b = _render("sin", 2800, 1600, 0.06, 0.08);
    var len = a.length > b.length ? a.length : b.length, out = new Float32Array(len);
    for (var i = 0; i < len; i++) out[i] = (a[i] || 0) + (b[i] || 0);
    return _wavUri(out);
  })();
  _soundUri["thock_correct"] = (function() {
    var a = _render("sin", 400, 100, 0.05, 0.35), b = _render("tri", 900, 500, 0.04, 0.10);
    var len = a.length > b.length ? a.length : b.length, out = new Float32Array(len);
    for (var i = 0; i < len; i++) out[i] = (a[i] || 0) + (b[i] || 0);
    return _wavUri(out);
  })();
})();

// 每个音效预加载 4 个 Audio 元素，按键时轮询使用，互不干扰
var _poolOk = [], _poolErr = [], _idxOk = 0, _idxErr = 0;

function _loadPresetAudio() {
  for (var i = 0; i < _poolOk.length; i++) { try { _poolOk[i].pause(); } catch(e) {} }
  for (var i = 0; i < _poolErr.length; i++) { try { _poolErr[i].pause(); } catch(e) {} }
  _poolOk = []; _poolErr = [];
  var okUri = _soundUri[currentSoundPreset + "_correct"];
  var errUri = _soundUri[currentSoundPreset + "_wrong"];
  for (var i = 0; i < 4; i++) {
    if (okUri) { var a = new Audio(okUri); a.volume = 0.8; _poolOk.push(a); }
    if (errUri) { var b = new Audio(errUri); b.volume = 0.8; _poolErr.push(b); }
  }
  _idxOk = 0; _idxErr = 0;
}
_loadPresetAudio();

function playKeySound(isCorrect) {
  var a;
  if (isCorrect) {
    if (_poolOk.length === 0) return;
    a = _poolOk[_idxOk]; _idxOk = (_idxOk + 1) % _poolOk.length;
  } else {
    if (_poolErr.length === 0) return;
    a = _poolErr[_idxErr]; _idxErr = (_idxErr + 1) % _poolErr.length;
  }
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(function() {});
}

function flashFrame(type) {
  const frame = document.getElementById("wordFrame");
  if (!frame) return;
  frame.classList.add(type + "-flash");
  setTimeout(() => frame.classList.remove(type + "-flash"), 140);
}

// ============================================================
// HELPERS — 通用工具函数
// ============================================================
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}


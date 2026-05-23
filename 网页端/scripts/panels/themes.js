// THEMES — 6套预设主题 + HSL取色器自动配色系统
// 通过动态注入 <style> 标签覆写 :root CSS 变量实现切换
// 取色器根据亮度自动判断暗色/浅色模式，生成全套12色配色
// ============================================================
const presetThemes = {
  classic: {
    name: "经典",
    bg: "#08081a", surface: "#10102a", surfaceAlt: "#181840",
    cyan: "#00f0ff", magenta: "#ff00e5", purple: "#a855f7",
    green: "#00ff88", red: "#ff3366", amber: "#ffb800",
    text: "#e0e0f0", muted: "#7878a8", border: "#252550",
    glassBg: "rgba(8,8,26,0.8)", starOpacity: "1", scanlineOpacity: "1",
  },
  ink: {
    name: "素黑",
    bg: "#f2f2f2", surface: "#ffffff", surfaceAlt: "#e8e8e8",
    cyan: "#2c2c2c", magenta: "#555555", purple: "#666666",
    green: "#3a7a5c", red: "#cc4444", amber: "#b8860b",
    text: "#1a1a1a", muted: "#777777", border: "#dddddd",
    glassBg: "rgba(255,255,255,0.85)", starOpacity: "0.1", scanlineOpacity: "0.2",
  },
  white: {
    name: "纯白",
    bg: "#f8f9fa", surface: "#ffffff", surfaceAlt: "#f0f0f0",
    cyan: "#3b6fb6", magenta: "#6b8ec4", purple: "#7b8fce",
    green: "#3a9a6e", red: "#dd4444", amber: "#d4a017",
    text: "#222222", muted: "#888888", border: "#e0e0e0",
    glassBg: "rgba(255,255,255,0.88)", starOpacity: "0.08", scanlineOpacity: "0.15",
  },
  apricot: {
    name: "暖杏",
    bg: "#faf5ef", surface: "#fffaf5", surfaceAlt: "#f5ede3",
    cyan: "#e07b5a", magenta: "#d4696a", purple: "#c08090",
    green: "#6a9a7a", red: "#cc5544", amber: "#d4953a",
    text: "#3a2a1a", muted: "#9a8a7a", border: "#e8ddd0",
    glassBg: "rgba(255,250,245,0.85)", starOpacity: "0.1", scanlineOpacity: "0.2",
  },
  mint: {
    name: "薄荷",
    bg: "#f0f7f4", surface: "#f8fdfa", surfaceAlt: "#e8f2ec",
    cyan: "#4a9a8a", magenta: "#5a9a8a", purple: "#6a8aaa",
    green: "#3a8a5c", red: "#c06050", amber: "#b89440",
    text: "#1a2a22", muted: "#7a8a80", border: "#d8e8e0",
    glassBg: "rgba(248,253,250,0.85)", starOpacity: "0.08", scanlineOpacity: "0.15",
  },
  mist: {
    name: "雾蓝",
    bg: "#f2f4f8", surface: "#fafbfd", surfaceAlt: "#e8ecf4",
    cyan: "#5a8ab8", magenta: "#7a8eb8", purple: "#8a8ec0",
    green: "#5a9a7a", red: "#c06060", amber: "#c0a050",
    text: "#1a2230", muted: "#7a8290", border: "#d8dde8",
    glassBg: "rgba(250,251,253,0.85)", starOpacity: "0.08", scanlineOpacity: "0.15",
  },
};

const themeOrder = ["classic", "ink", "white", "apricot", "mint", "mist"];
let currentTheme = "classic";
let customThemes = {};
let themeStyleEl = null;

function ensureThemeStyle() {
  if (!themeStyleEl) {
    themeStyleEl = document.createElement("style");
    themeStyleEl.id = "theme-style";
    document.head.appendChild(themeStyleEl);
  }
}

function getTheme(key) {
  if (presetThemes[key]) return presetThemes[key];
  if (customThemes[key]) return customThemes[key];
  return presetThemes["classic"];
}

function applyTheme(key) {
  const t = getTheme(key);
  if (!t) return;
  currentTheme = key;

  ensureThemeStyle();
  themeStyleEl.textContent = ":root{" +
    "--bg:" + t.bg + ";" +
    "--surface:" + t.surface + ";" +
    "--surface-alt:" + t.surfaceAlt + ";" +
    "--neon-cyan:" + t.cyan + ";" +
    "--neon-magenta:" + t.magenta + ";" +
    "--neon-purple:" + t.purple + ";" +
    "--neon-green:" + t.green + ";" +
    "--neon-red:" + t.red + ";" +
    "--neon-amber:" + t.amber + ";" +
    "--text:" + t.text + ";" +
    "--text-muted:" + t.muted + ";" +
    "--border-subtle:" + t.border + ";" +
    "--glass-bg:" + t.glassBg + ";" +
    "--star-opacity:" + t.starOpacity + ";" +
    "--scanline-opacity:" + t.scanlineOpacity + ";" +
  "}";

  document.querySelectorAll(".theme-dot").forEach(dot => {
    dot.classList.toggle("active", dot.dataset.theme === key);
  });

  try { localStorage.setItem("typing_theme", key); } catch (e) {}
}

// HSL color utilities — HSL颜色转换工具函数
function hexToHsl(hex) {
  let r, g, b;
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 :
        max === g ? ((b - r) / d + 2) / 6 :
                    ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
      .toString(16).padStart(2, "0");
  };
  return "#" + f(0) + f(8) + f(4);
}

function generateThemeFromColor(baseHex) {
  const { h, s, l } = hexToHsl(baseHex);
  const sat = Math.max(s, 45);
  const accentLight = Math.max(l, 50);
  const isLight = l > 55; // light accent → light theme, dark accent → dark theme （亮色主色调→浅色主题，暗色主色调→深色主题）

  const t = {
    name: "Custom",
    cyan: baseHex,
    magenta: hslToHex((h + 45) % 360, sat, accentLight),
    purple: hslToHex((h + 80) % 360, sat, accentLight),
    green: hslToHex((h + 140) % 360, sat, accentLight),
    red: hslToHex((h + 190) % 360, sat, accentLight),
    amber: hslToHex((h + 30) % 360, sat, Math.min(accentLight + 5, 90)),
  };

  if (isLight) {
    t.bg = hslToHex(h, Math.round(sat * 0.12), 95);
    t.surface = "#ffffff";
    t.surfaceAlt = hslToHex(h, Math.round(sat * 0.15), 90);
    t.text = hslToHex(h, 10, 15);
    t.muted = hslToHex(h, 12, 48);
    t.border = hslToHex(h, Math.round(sat * 0.18), 84);
    t.glassBg = "rgba(255,255,255,0.88)";
    t.starOpacity = "0.06";
    t.scanlineOpacity = "0.12";
  } else {
    t.bg = hslToHex(h, Math.round(sat * 0.18), 5);
    t.surface = hslToHex(h, Math.round(sat * 0.25), 9);
    t.surfaceAlt = hslToHex(h, Math.round(sat * 0.3), 15);
    t.text = hslToHex(h, 8, 90);
    t.muted = hslToHex(h, 12, 50);
    t.border = hslToHex(h, Math.round(sat * 0.22), 16);
    t.glassBg = hslToHex(h, Math.round(sat * 0.2), 10) + "cc";
    t.starOpacity = "1";
    t.scanlineOpacity = "1";
  }

  return t;
}

function applyCustomColor(hex) {
  const t = generateThemeFromColor(hex);
  const key = "custom";
  customThemes[key] = t;
  applyTheme(key);
  try { localStorage.setItem("typing_custom_theme", JSON.stringify(t)); } catch (e) {}
  try { localStorage.setItem("typing_custom_hex", hex); } catch (e) {}
}

function cycleTheme() {
  const idx = themeOrder.indexOf(currentTheme);
  if (idx >= 0) {
    applyTheme(themeOrder[(idx + 1) % themeOrder.length]);
  } else {
    applyTheme(themeOrder[0]);
  }
}

// ============================================================

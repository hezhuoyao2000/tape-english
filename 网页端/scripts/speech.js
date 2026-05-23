// SPEECH — Web Speech API 英语 + 粤语 TTS 发音
// 英语朗读后自动链式调用粤语，手动 EN/粤 按钮可独立播放
// ============================================================
let speechGeneration = 0;

// 保持 pending 引用防止 GC 在 speak() 触发前回收 utterance
let pendingUtterance = null;

// Web Speech API 英语朗读 (en-US)
function speakEnglish(word) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  pendingUtterance = new SpeechSynthesisUtterance(word.en);
  pendingUtterance.lang = "en-US";
  pendingUtterance.rate = 0.85;
  window.speechSynthesis.speak(pendingUtterance);
}

function speakCantonese(word) {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  const yueVoice = voices.find(v => v.lang.startsWith("zh-HK"));
  if (yueVoice) {
    window.speechSynthesis.cancel();
    pendingUtterance = new SpeechSynthesisUtterance(word.zh.replace(/\//g, " "));
    pendingUtterance.voice = yueVoice;
    pendingUtterance.lang = "zh-HK";
    pendingUtterance.rate = 0.9;
    window.speechSynthesis.speak(pendingUtterance);
    return;
  }
  // Fallback: Google TTS — 系统粤语语音不可用时的降级方案
  const audio = new Audio();
  audio.src = "https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-HK&client=tw-ob&q=" + encodeURIComponent(word.zh);
  audio.play().catch(() => {});
}

function speakWord(word) {
  if (!state.soundEnabled) return;
  if (!window.speechSynthesis) return;

  speechGeneration++;
  const gen = speechGeneration;

  // Cancel any current speech, then wait 20ms for cancel to flush before speaking — 取消当前语音，等待20ms让cancel生效后再朗读
  window.speechSynthesis.cancel();
  setTimeout(() => {
    if (gen !== speechGeneration) return; // newer speakWord cancelled us — 已被更新的 speakWord 调用取消
    const u = new SpeechSynthesisUtterance(word.en);
    u.lang = "en-US";
    u.rate = 0.85;
    u.onend = () => {
      if (gen === speechGeneration) {
        speakCantonese(word);
      }
    };
    pendingUtterance = u;
    window.speechSynthesis.speak(u);
  }, 20);
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  const btn = document.getElementById("btnSound");
  if (state.soundEnabled) {
    btn.classList.remove("muted");
    btn.textContent = "S";
  } else {
    btn.classList.add("muted");
    btn.textContent = "S";
  }
}

function getWordPool() {
  return wordBank.workplace;
}

// ============================================================

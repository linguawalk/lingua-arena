/* Lingua Arena — shared helpers (vanilla JS, no build step). */
(function () {
  'use strict';

  var UI = {
    ko: {
      home: '홈', brandSub: 'Lingua Arena', europe: '유럽 언어권', asia: '아시아 언어권',
      pilot: 'A1 · 유닛 1 파일럿 공개', levelsLabel: '레벨', soon: '준비 중', open: '열기',
      unit: '유닛', start: '시작하기', cats: '6개 영역', noData: '이 유닛의 데이터를 찾을 수 없습니다.',
      back: '← 돌아가기', hide: '뜻 가리기', show: '뜻 보이기', example: '예문', explain: '설명',
      practice: '연습 문제', answerCheck: '정답 확인', correct: '정답입니다!', wrong: '아쉬워요. 정답: ',
      transcript: '대본 보기', translation: '번역 보기', listen: '듣기', browserVoice: '브라우저 음성으로 듣기(임시)',
      audioSoon: '이 유닛의 듣기 음성(유튜브)은 준비 중입니다. 지금은 브라우저 음성으로 임시 재생할 수 있습니다.',
      openYT: '유튜브에서 열기', situation: '쓰는 상황', speakTip: '소리 내어 따라 말해 보세요. 🔊를 누르면 브라우저 음성이 읽어 줍니다.',
      writeTask: '쓰기 과제', writePlaceholder: '여기에 써 보세요…', check: '확인', model: '예시 답안', mustInclude: '포함할 표현',
      yourAnswer: '정답', pickOne: '선택하세요', typeHere: '입력', disclaimer1: 'TOEIC, TOEFL, IELTS 등 시험 이름은 각 주관 기관의 상표이며, 이 사이트는 해당 기관과 관련이 없습니다. 모든 문제는 시험 "형식"을 참고해 새로 만든 오리지널 연습 자료입니다.',
      disclaimer2: '듣기 음성은 TTS로 제작해 유튜브에 올리고 링크로 연결합니다.',
      tabs: { vocab: '어휘', grammar: '문법', listening: '듣기', reading: '읽기', speaking: '말하기', writing: '쓰기' },
      heroTitle: '일상에서 쓰는 외국어, 7개 언어 한 곳에서', heroSub: '모든 언어가 같은 A1~C2 단계와 같은 표현 흐름으로 이어집니다. 영어의 be동사를 배우면 프랑스어 être, 일본어 です와 나란히 비교해 볼 수 있어요.',
      langHeroSub: 'A1~C2 단계마다 어휘·문법·듣기·읽기·말하기·쓰기 6개 영역을 공부합니다.', unitsReady: '공개된 유닛', planned: '예정',
    },
    en: {
      home: 'Home', brandSub: 'Lingua Arena', europe: 'European languages', asia: 'Asian languages',
      pilot: 'A1 · Unit 1 pilot is live', levelsLabel: 'Levels', soon: 'Coming soon', open: 'Open',
      unit: 'Unit', start: 'Start', cats: '6 skills', noData: 'Could not find data for this unit.',
      back: '← Back', hide: 'Hide meanings', show: 'Show meanings', example: 'Example', explain: 'Explanation',
      practice: 'Practice', answerCheck: 'Check', correct: 'Correct!', wrong: 'Not quite. Answer: ',
      transcript: 'Show transcript', translation: 'Show translation', listen: 'Listen', browserVoice: 'Play with browser voice (temporary)',
      audioSoon: 'The listening audio (YouTube) for this unit is not ready yet. You can use the browser voice for now.',
      openYT: 'Open on YouTube', situation: 'When to use', speakTip: 'Say each expression out loud. Press 🔊 to hear it in your browser voice.',
      writeTask: 'Writing task', writePlaceholder: 'Write here…', check: 'Check', model: 'Model answer', mustInclude: 'Try to include',
      yourAnswer: 'Answer', pickOne: 'Choose one', typeHere: 'Type', disclaimer1: 'TOEIC, TOEFL, IELTS and other exam names are trademarks of their owners; this site is not affiliated with them. All items are original practice material modelled on the exam formats.',
      disclaimer2: 'Listening audio is made with TTS, uploaded to YouTube and linked from here.',
      tabs: { vocab: 'Vocabulary', grammar: 'Grammar', listening: 'Listening', reading: 'Reading', speaking: 'Speaking', writing: 'Writing' },
      heroTitle: 'Everyday foreign languages — seven in one place', heroSub: 'Every language follows the same A1–C2 steps and the same flow of expressions, so you can compare English "be" with French "être" and Japanese "です" side by side.',
      langHeroSub: 'Each level covers six skills: vocabulary, grammar, listening, reading, speaking and writing.', unitsReady: 'Units available', planned: 'Planned',
    },
  };

  var ui = 'ko';
  try { ui = localStorage.getItem('la_ui') || 'ko'; } catch (e) { /* storage may be blocked */ }
  if (ui !== 'ko' && ui !== 'en') ui = 'ko';

  function t(k) { return (UI[ui] && UI[ui][k]) || UI.en[k] || k; }
  function tabLabel(c) { return UI[ui].tabs[c]; }
  function pick(o) { if (!o) return ''; return ui === 'ko' ? (o.ko || o.en || '') : (o.en || o.ko || ''); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) {
    return String(s || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function qs() {
    var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o;
  }

  function setUI(l) {
    ui = l;
    try { localStorage.setItem('la_ui', l); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
    if (window.renderPage) window.renderPage();
  }

  function header(crumbsHtml) {
    var h = '<header class="nav"><div class="wrap nav-row">' +
      '<a class="brand" href="index.html"><span class="mark">LA</span><span>Lingua Arena</span></a>' +
      '<nav class="crumbs">' + (crumbsHtml || '') + '</nav>' +
      '<div class="ui-toggle" role="group" aria-label="UI language">' +
      '<button type="button" data-ui="ko" class="' + (ui === 'ko' ? 'act' : '') + '">KO</button>' +
      '<button type="button" data-ui="en" class="' + (ui === 'en' ? 'act' : '') + '">EN</button></div></div></header>';
    return h;
  }
  function footer() {
    return '<footer><div class="wrap"><p>' + esc(t('disclaimer1')) + '</p><p>' + esc(t('disclaimer2')) + '</p><p>© Lingua Arena</p></div></footer>';
  }
  function bindToggle(root) {
    root.querySelectorAll('.ui-toggle button').forEach(function (b) {
      b.addEventListener('click', function () { setUI(b.getAttribute('data-ui')); });
    });
  }

  // ---------- data ----------
  var cache = {};
  function getJSON(url) {
    if (!cache[url]) {
      cache[url] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error(url + ' ' + r.status);
        return r.json();
      });
    }
    return cache[url];
  }

  // ---------- speech (browser TTS, temporary fallback + speaking practice) ----------
  var speechOK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  function speak(text, bcp, voiceHint, onEnd) {
    if (!speechOK) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = bcp;
    u.rate = 0.9;
    var voices = window.speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(bcp.slice(0, 2).toLowerCase()) === 0; });
    if (voices.length) {
      var want = voiceHint === 'male' ? /male|man|daniel|alex|jorge|thomas|yuri/i : /female|woman|samantha|amelie|anna|monica|kyoko|yuna|ting/i;
      var m = voices.filter(function (v) { return want.test(v.name); });
      u.voice = (m[0] || voices[0]);
    }
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  }
  function speakLines(lines, bcp, voices) {
    if (!speechOK) return;
    window.speechSynthesis.cancel();
    var i = 0;
    (function next() {
      if (i >= lines.length) return;
      var l = lines[i++];
      speak(l.t, bcp, voices[l.s], next);
    })();
  }
  function stopSpeech() { if (speechOK) window.speechSynthesis.cancel(); }

  // ---------- YouTube (segment playback) ----------
  var ytPlayer = null, ytVideo = null, ytQueue = [], ytLoading = false;
  function ytReady(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    ytQueue.push(cb);
    if (ytLoading) return;
    ytLoading = true;
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
    window.onYouTubeIframeAPIReady = function () { ytQueue.splice(0).forEach(function (f) { f(); }); };
  }
  function ytPlay(containerId, videoId, start, end) {
    ytReady(function () {
      var go = function () { ytPlayer.loadVideoById({ videoId: videoId, startSeconds: start || 0, endSeconds: end || undefined }); };
      if (ytPlayer && ytVideo === videoId) { go(); return; }
      var el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = '<div id="' + containerId + '-p"></div>';
      ytVideo = videoId;
      ytPlayer = new window.YT.Player(containerId + '-p', {
        videoId: videoId, playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onReady: go },
      });
    });
  }

  window.LA = {
    t: t, tabLabel: tabLabel, pick: pick, esc: esc, norm: norm, pad: pad, qs: qs, setUI: setUI,
    header: header, footer: footer, bindToggle: bindToggle, getJSON: getJSON,
    speak: speak, speakLines: speakLines, stopSpeech: stopSpeech, speechOK: speechOK, ytPlay: ytPlay,
    get ui() { return ui; },
  };
  document.documentElement.lang = ui;
})();

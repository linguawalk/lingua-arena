/* Unit page renderer: vocab, grammar, listening, reading, speaking, writing. */
(function () {
  'use strict';
  var L = window.LA, esc = L.esc;
  var app = document.getElementById('app');
  var P = L.qs();
  var code = P.l || 'en', level = P.lv || 'a1', unitNo = parseInt(P.u || '1', 10) || 1;
  var cat = P.c || 'vocab';
  var CATS = ['vocab', 'grammar', 'listening', 'reading', 'speaking', 'writing'];
  var concepts = null, data = null, lang = null;
  var reg = {};           // question registry: key -> question object
  var hideGloss = false;  // vocab self-test mode

  function tg(text, extra) { return '<span class="' + (extra || 'tgt') + '" lang="' + lang.code + '">' + esc(text) + '</span>'; }
  function glossOf(o) { return L.pick(o); }
  function speakBtn(text, hint) {
    if (!L.speechOK) return '';
    return '<button type="button" class="btn icon" data-say="' + esc(text) + '" aria-label="listen">🔊</button>';
  }
  function fmtLabel(kind, f) {
    var o = (concepts.formats[kind] || {})[f];
    if (!o) return esc(f);
    var s = '<span class="fmt">' + esc(L.pick(o).toUpperCase()) + '</span>';
    if (lang.code === 'en' && o.exam) s += ' <span class="exam-tag">· ' + esc(o.exam) + '</span>';
    return s;
  }

  // ---------- questions ----------
  function renderQuestion(key, q, showNum) {
    reg[key] = q;
    var h = '<div class="q" data-key="' + key + '">';
    h += '<div class="qtext" lang="' + lang.code + '">' + (showNum ? esc(showNum) + ' ' : '') + esc(q.q) + '</div>';
    if (q.hint) h += '<div class="dim">' + esc(glossOf(q.hint)) + '</div>';
    if (q.type === 'blank') {
      h += '<div class="row"><input class="blank" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="answer" lang="' + lang.code + '">' +
        '<button type="button" class="btn" data-blank>' + esc(L.t('answerCheck')) + '</button></div>';
    } else {
      h += '<div class="opts" role="group">' + q.options.map(function (o, i) {
        return '<button type="button" class="opt" data-opt="' + i + '" lang="' + lang.code + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    }
    return h + '<div class="fb" aria-live="polite"></div></div>';
  }

  function bindQuestions(root) {
    root.querySelectorAll('.q').forEach(function (el) {
      var q = reg[el.getAttribute('data-key')];
      var fb = el.querySelector('.fb');
      if (q.type === 'blank') {
        var input = el.querySelector('input.blank');
        var check = function () {
          var v = L.norm(input.value).replace(/[.,!?。、！？]/g, '');
          if (!v) return;
          var ok = q.answers.some(function (a) { return L.norm(a) === v; });
          fb.className = 'fb ' + (ok ? 'ok' : 'bad');
          fb.textContent = ok ? L.t('correct') : L.t('wrong') + q.answers[0];
        };
        el.querySelector('[data-blank]').addEventListener('click', check);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
      } else {
        el.querySelectorAll('.opt').forEach(function (b) {
          b.addEventListener('click', function () {
            var i = parseInt(b.getAttribute('data-opt'), 10), ok = i === q.answer;
            el.querySelectorAll('.opt').forEach(function (x) { x.disabled = true; });
            b.classList.add(ok ? 'ok' : 'bad');
            if (!ok) el.querySelector('[data-opt="' + q.answer + '"]').classList.add('ok');
            fb.className = 'fb ' + (ok ? 'ok' : 'bad');
            fb.textContent = ok ? L.t('correct') : L.t('wrong') + q.options[q.answer];
          });
        });
      }
    });
  }

  // ---------- categories ----------
  function vocabPanel() {
    var h = '<div class="row"><button type="button" class="btn" id="toggle-gloss">' + esc(hideGloss ? L.t('show') : L.t('hide')) + '</button></div>';
    h += '<div class="vgrid' + (hideGloss ? ' hidden-gloss' : '') + '" id="vgrid">' + data.vocab.map(function (v) {
      return '<div class="box vcard">' +
        '<div class="row">' + tg(v.t, 'tgt big') + '<span class="spacer"></span>' + speakBtn(v.t) + '</div>' +
        '<div class="row">' + (v.read ? '<span class="read">' + esc(v.read) + '</span>' : '') + '<span class="pos">' + esc(v.pos) + '</span></div>' +
        '<div class="gloss">' + esc(glossOf(v)) + '</div>' +
        '<div class="row" style="margin-top:6px"><div>' + tg(v.ex.t, 'dim') + (v.ex.read ? '<br><span class="read">' + esc(v.ex.read) + '</span>' : '') +
        '<br><span class="dim ex-gloss">' + esc(glossOf(v.ex)) + '</span></div><span class="spacer"></span>' + speakBtn(v.ex.t) + '</div></div>';
    }).join('') + '</div>';
    return h;
  }

  function grammarPanel() {
    var g = data.grammar;
    var h = '<div class="box"><h2>' + esc(glossOf(g.title)) + '</h2><p style="margin-top:8px">' + esc(glossOf(g.explain)) + '</p></div>';
    h += '<div class="box" style="overflow-x:auto"><table class="t"><thead><tr>' + g.table.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + g.table.rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td lang="' + lang.code + '">' + esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    h += '<div class="box"><h3>' + esc(L.t('example')) + '</h3><div style="display:grid;gap:10px;margin-top:8px">' + g.examples.map(function (e) {
      return '<div class="row"><div>' + tg(e.t) + (e.read ? '<br><span class="read">' + esc(e.read) + '</span>' : '') + '<br><span class="dim">' + esc(glossOf(e)) + '</span></div><span class="spacer"></span>' + speakBtn(e.t) + '</div>';
    }).join('') + '</div></div>';
    h += '<div class="box"><ul class="notes">' + g.notes.map(function (n) { return '<li>' + esc(glossOf(n)) + '</li>'; }).join('') + '</ul></div>';
    h += '<div class="box"><h3>' + esc(L.t('practice')) + '</h3>' + g.practice.map(function (p, i) { return renderQuestion('g-' + p.id, p, (i + 1) + '.'); }).join('') + '</div>';
    return h;
  }

  function listeningPanel() {
    var lis = data.listening, vid = lis.video_id;
    var h = '';
    if (vid) {
      h += '<div id="yt-wrap"></div>';
    } else {
      h += '<div class="notice"><b>🎧</b> ' + esc(L.t('audioSoon')) + '</div>';
    }
    h += lis.items.map(function (it) {
      var multi = it.tts.speakers.length > 1;
      var body = '<div class="box" data-item="' + it.id + '"><div class="row">' + fmtLabel('listening', it.format) + '</div>';
      body += '<div class="row" style="margin:10px 0">' +
        '<button type="button" class="btn primary" data-play="' + it.id + '">▶ ' + esc(vid && it.audio.start != null ? L.t('listen') : L.t('browserVoice')) + '</button>';
      if (vid && it.audio.start != null) body += '<a class="btn" target="_blank" rel="noopener" href="https://youtu.be/' + esc(vid) + '?t=' + Math.floor(it.audio.start) + '">' + esc(L.t('openYT')) + '</a>';
      body += '</div>';
      body += '<details class="more"><summary>' + esc(L.t('transcript')) + '</summary><div class="transcript" lang="' + lang.code + '">' +
        it.tts.lines.map(function (l) { return '<div>' + (multi ? '<span class="spk">' + esc(l.s) + '</span>' : '') + esc(l.t) + '</div>'; }).join('') + '</div></details>';
      body += '<details class="more"><summary>' + esc(L.t('translation')) + '</summary><div class="trans">' + esc(glossOf(it.trans)) + '</div></details>';
      body += it.questions.map(function (q, i) { return renderQuestion('l-' + it.id + '-' + i, q); }).join('');
      return body + '</div>';
    }).join('');
    return h;
  }

  function readingPanel() {
    return data.reading.items.map(function (it) {
      var h = '<div class="box"><div class="row">' + fmtLabel('reading', it.format) + '</div>';
      h += '<div class="passage" lang="' + lang.code + '" style="margin:10px 0">' + esc(it.passage) + '</div>';
      h += '<details class="more"><summary>' + esc(L.t('translation')) + '</summary><div class="trans">' + esc(glossOf(it.trans)) + '</div></details>';
      h += it.questions.map(function (q, i) { return renderQuestion('r-' + it.id + '-' + i, q); }).join('');
      return h + '</div>';
    }).join('');
  }

  function speakingPanel() {
    var h = '<div class="notice">' + esc(L.t('speakTip')) + '</div>';
    h += data.speaking.expressions.map(function (s) {
      return '<div class="box"><div class="row"><div>' + tg(s.t) + (s.read ? '<br><span class="read">' + esc(s.read) + '</span>' : '') +
        '<br><span class="gloss">' + esc(glossOf(s)) + '</span><br><span class="dim">' + esc(L.t('situation')) + ': ' + esc(glossOf(s.situation)) + '</span></div>' +
        '<span class="spacer"></span>' + speakBtn(s.t) + '</div></div>';
    }).join('');
    return h;
  }

  function writingPanel() {
    var w = data.writing, tk = w.task;
    var h = w.expressions.map(function (e) {
      return '<div class="box"><div class="row"><div>' + tg(e.t) + (e.read ? '<br><span class="read">' + esc(e.read) + '</span>' : '') +
        '<br><span class="dim">' + esc(glossOf(e)) + '</span></div><span class="spacer"></span>' + speakBtn(e.t) + '</div></div>';
    }).join('');
    h += '<div class="box"><h3>' + esc(L.t('writeTask')) + '</h3><p style="margin:6px 0 10px">' + esc(glossOf(tk.prompt)) + '</p>' +
      '<textarea class="write" id="wtext" lang="' + lang.code + '" placeholder="' + esc(L.t('writePlaceholder')) + '"></textarea>' +
      '<div class="row" style="margin-top:10px"><button type="button" class="btn primary" id="wcheck">' + esc(L.t('check')) + '</button></div>' +
      '<div class="checks" id="wchecks" aria-live="polite"></div>' +
      '<details class="more" style="margin-top:12px"><summary>' + esc(L.t('model')) + '</summary><div class="tgt" lang="' + lang.code + '" style="font-size:17px">' + esc(tk.model) +
      '</div><div class="trans" style="margin-top:6px">' + esc(glossOf(tk.model_trans)) + '</div></details></div>';
    return h;
  }

  var PANELS = { vocab: vocabPanel, grammar: grammarPanel, listening: listeningPanel, reading: readingPanel, speaking: speakingPanel, writing: writingPanel };

  function bindPanel(root) {
    bindQuestions(root);
    root.querySelectorAll('[data-say]').forEach(function (b) {
      b.addEventListener('click', function () { L.stopSpeech(); L.speak(b.getAttribute('data-say'), lang.bcp47); });
    });
    var tgl = root.querySelector('#toggle-gloss');
    if (tgl) tgl.addEventListener('click', function () { hideGloss = !hideGloss; renderPanel(); });
    root.querySelectorAll('.vcard').forEach(function (c) {
      c.addEventListener('click', function (e) { if (!e.target.closest('button')) c.classList.toggle('reveal'); });
    });
    root.querySelectorAll('[data-play]').forEach(function (b) {
      b.addEventListener('click', function () {
        var it = data.listening.items.filter(function (x) { return x.id === b.getAttribute('data-play'); })[0];
        var vid = data.listening.video_id;
        L.stopSpeech();
        if (vid && it.audio.start != null) { L.ytPlay('yt-wrap', vid, it.audio.start, it.audio.end); return; }
        var voices = {};
        it.tts.speakers.forEach(function (s) { voices[s.id] = s.voice; });
        L.speakLines(it.tts.lines, lang.bcp47, voices);
      });
    });
    var wc = root.querySelector('#wcheck');
    if (wc) wc.addEventListener('click', function () {
      var text = L.norm(root.querySelector('#wtext').value);
      var out = data.writing.task.must_include.map(function (m) {
        var ok = text && m.match.some(function (x) { return text.indexOf(L.norm(x)) >= 0; });
        return '<span class="check ' + (ok ? 'ok' : 'bad') + '" lang="' + lang.code + '">' + (ok ? '✓ ' : '✗ ') + esc(m.label) + '</span>';
      }).join('');
      root.querySelector('#wchecks').innerHTML = out;
    });
  }

  function renderPanel() {
    reg = {};
    var panel = document.getElementById('panel');
    panel.innerHTML = PANELS[cat]();
    bindPanel(panel);
    document.querySelectorAll('.tab').forEach(function (t) {
      var on = t.getAttribute('data-cat') === cat;
      t.classList.toggle('act', on); t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function render() {
    var title = data.meta.title;
    document.title = title.target + ' — ' + lang.native + ' — Lingua Arena';
    var crumbs = '<a href="index.html">' + esc(L.t('home')) + '</a><span>/</span><a href="lang.html?l=' + lang.code + '" lang="' + lang.code + '">' + esc(lang.native) +
      '</a><span>/</span><span>' + esc(level.toUpperCase()) + ' U' + L.pad(unitNo) + '</span>';
    var h = L.header(crumbs) + '<main><div class="wrap"><div class="unit-head"><span class="eyebrow">' + esc(level.toUpperCase()) + ' · ' + esc(L.t('unit')) + ' ' + unitNo + '</span>' +
      '<h1 style="text-align:left" lang="' + lang.code + '">' + esc(title.target) + '</h1><p class="dim" style="margin-top:6px">' + esc(L.pick(title)) + '</p></div>' +
      '<div class="tabs" role="tablist">' + CATS.map(function (c) {
        return '<button type="button" class="tab" role="tab" data-cat="' + c + '">' + esc(L.tabLabel(c)) + '</button>';
      }).join('') + '</div><div class="panel" id="panel"></div></div></main>' + L.footer();
    app.innerHTML = h;
    L.bindToggle(app);
    app.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        cat = t.getAttribute('data-cat');
        try { var u = new URL(location.href); u.searchParams.set('c', cat); history.replaceState(null, '', u); } catch (e) { /* ignore */ }
        L.stopSpeech();
        renderPanel();
      });
    });
    renderPanel();
  }

  function fail(msg) {
    app.innerHTML = L.header('') + '<main><div class="empty">' + esc(msg) + '<br><br><a href="index.html">' + esc(L.t('back')) + '</a></div></main>' + L.footer();
    L.bindToggle(app);
  }

  window.renderPage = function () {
    if (!CATS.includes(cat)) cat = 'vocab';
    var url = 'data/' + code + '/' + level + '/u' + L.pad(unitNo) + '.json';
    Promise.all([L.getJSON('data/concepts.json'), L.getJSON(url)]).then(function (r) {
      concepts = r[0]; data = r[1];
      lang = concepts.languages.filter(function (x) { return x.code === code; })[0];
      if (!lang) return fail('Unknown language');
      render();
    }).catch(function () { fail(L.t('noData')); });
  };
  window.renderPage();
})();

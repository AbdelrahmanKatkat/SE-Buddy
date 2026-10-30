/* Minimal Python code editor: a textarea layered over a syntax-highlighted <pre>, with a line-number gutter. */
(function (SEB) {
  'use strict';

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const TOKEN = new RegExp([
    '(#[^\\n]*)',                                                                   // 1 comment
    '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|f?"(?:\\\\.|[^"\\\\\\n])*"|f?\'(?:\\\\.|[^\'\\\\\\n])*\')', // 2 string
    '\\b(def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|yield|global|nonlocal|assert|del)\\b', // 3 keyword
    '\\b(\\d+(?:\\.\\d+)?)\\b',                                                     // 4 number
    '\\b(len|range|print|int|str|float|list|dict|set|tuple|sorted|sum|min|max|abs|enumerate|zip|map|filter|isinstance|reversed|any|all|bool)\\b' // 5 builtin
  ].join('|'), 'g');

  function highlight(src) {
    let out = '';
    let last = 0;
    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index));
      const cls = m[1] ? 'tk-c' : m[2] ? 'tk-s' : m[3] ? 'tk-k' : m[4] ? 'tk-n' : 'tk-b';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return out + esc(src.slice(last));
  }

  // Mounts an editor inside `host`. Returns { getValue, setValue, focus }.
  function mount(host, initial, opts) {
    host.innerHTML =
      '<div class="ed-gutter" aria-hidden="true"></div>' +
      '<div class="ed-body">' +
      '<pre class="ed-hl" aria-hidden="true"></pre>' +
      '<textarea class="ed-input" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Python code editor" wrap="off"></textarea>' +
      '</div>';
    const gutter = host.querySelector('.ed-gutter');
    const pre = host.querySelector('.ed-hl');
    const ta = host.querySelector('.ed-input');

    function paint() {
      const text = ta.value;
      pre.innerHTML = highlight(text) + '\n';
      const lines = text.split('\n').length;
      let g = '';
      for (let i = 1; i <= lines; i++) g += i + '\n';
      gutter.textContent = g;
      sync();
    }
    function sync() {
      pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft;
      gutter.scrollTop = ta.scrollTop;
    }

    ta.value = initial;
    ta.addEventListener('input', () => { paint(); if (opts && opts.onChange) opts.onChange(ta.value); });
    ta.addEventListener('scroll', sync);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const s = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(end);
        ta.selectionStart = ta.selectionEnd = s + 4;
        ta.dispatchEvent(new Event('input'));
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (opts && opts.onRun) opts.onRun();
      } else if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
        // keep the current indentation, add one level after a trailing colon
        const s = ta.selectionStart;
        const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
        const line = ta.value.slice(lineStart, s);
        const indent = (line.match(/^[ ]*/) || [''])[0] + (/:\s*$/.test(line) ? '    ' : '');
        e.preventDefault();
        ta.value = ta.value.slice(0, s) + '\n' + indent + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
        ta.dispatchEvent(new Event('input'));
      }
    });

    paint();
    return {
      getValue: () => ta.value,
      setValue(v) { ta.value = v; paint(); if (opts && opts.onChange) opts.onChange(v); },
      focus: () => ta.focus()
    };
  }

  SEB.editor = { mount, highlight };
})(window.SEB = window.SEB || {});

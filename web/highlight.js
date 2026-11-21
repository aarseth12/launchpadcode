// Tiny dependency-free Java syntax highlighter for the read-only code blocks shown to students.
// Scans left-to-right so keywords inside strings/comments are never mis-coloured, and HTML-escapes
// every token (which also fixes raw "<" in code like `(cm < 25)` from breaking the markup).
// Colours follow the familiar VS Code Dark+ scheme; see the .tok-* CSS in the pages.
(function () {
  const KEYWORDS = new Set(
    ("abstract assert boolean break byte case catch char class const continue default do double " +
     "else enum extends final finally float for goto if implements import instanceof int interface " +
     "long native new package private protected public return short static strictfp super switch " +
     "synchronized this throw throws transient try void volatile while var true false null").split(" ")
  );
  const escHtml = (s) => s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
  const isWord = (c) => /[A-Za-z0-9_$]/.test(c);

  function highlightJava(src) {
    let out = "", i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      // line comment
      if (c === "/" && src[i + 1] === "/") {
        let j = src.indexOf("\n", i); if (j < 0) j = n;
        out += `<span class="tok-com">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // block comment
      if (c === "/" && src[i + 1] === "*") {
        let j = src.indexOf("*/", i); j = j < 0 ? n : j + 2;
        out += `<span class="tok-com">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // string literal
      if (c === '"') {
        let j = i + 1; while (j < n && src[j] !== '"') { if (src[j] === "\\") j++; j++; }
        j = Math.min(j + 1, n);
        out += `<span class="tok-str">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // char literal
      if (c === "'") {
        let j = i + 1; while (j < n && src[j] !== "'") { if (src[j] === "\\") j++; j++; }
        j = Math.min(j + 1, n);
        out += `<span class="tok-str">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // annotation (@TeleOp, @Override, ...)
      if (c === "@") {
        let j = i + 1; while (j < n && isWord(src[j])) j++;
        out += `<span class="tok-ann">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // number
      if (c >= "0" && c <= "9") {
        let j = i + 1; while (j < n && /[0-9._a-fA-FxX]/.test(src[j])) j++;
        out += `<span class="tok-num">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // identifier → keyword / type (Capitalised) / call (followed by "(")
      if (/[A-Za-z_$]/.test(c)) {
        let j = i + 1; while (j < n && isWord(src[j])) j++;
        const word = src.slice(i, j);
        let cls = null;
        if (KEYWORDS.has(word)) cls = "tok-kw";
        else if (/^[A-Z]/.test(word)) cls = "tok-type";
        else if (src[j] === "(") cls = "tok-fn";
        out += cls ? `<span class="${cls}">${escHtml(word)}</span>` : escHtml(word);
        i = j; continue;
      }
      // anything else (punctuation, whitespace): escape a single char
      out += escHtml(c); i++;
    }
    return out;
  }

  // ---- Python — same token classes/colours, Python lexemes ----
  const PY_KEYWORDS = new Set(
    ("False None True and as assert async await break class continue def del elif else except " +
     "finally for from global if import in is lambda nonlocal not or pass raise return try " +
     "while with yield match case").split(" ")
  );
  const PY_BUILTINS = new Set(
    ("print len range int str float bool list dict set tuple input abs min max sum sorted " +
     "enumerate zip map filter open type isinstance round reversed").split(" ")
  );

  function highlightPython(src) {
    let out = "", i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      // comment
      if (c === "#") {
        let j = src.indexOf("\n", i); if (j < 0) j = n;
        out += `<span class="tok-com">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // triple-quoted string ("""...""" / '''...''')
      if ((c === '"' || c === "'") && src[i + 1] === c && src[i + 2] === c) {
        const q = c + c + c; let j = src.indexOf(q, i + 3); j = j < 0 ? n : j + 3;
        out += `<span class="tok-str">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // single/double string
      if (c === '"' || c === "'") {
        let j = i + 1; while (j < n && src[j] !== c) { if (src[j] === "\\") j++; j++; }
        j = Math.min(j + 1, n);
        out += `<span class="tok-str">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // decorator (@property, @staticmethod, ...)
      if (c === "@") {
        let j = i + 1; while (j < n && isWord(src[j])) j++;
        out += `<span class="tok-ann">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // number
      if (c >= "0" && c <= "9") {
        let j = i + 1; while (j < n && /[0-9._a-fA-FxXoObBjJ]/.test(src[j])) j++;
        out += `<span class="tok-num">${escHtml(src.slice(i, j))}</span>`; i = j; continue;
      }
      // identifier → string-prefix (f"" r'' rb"") / keyword / builtin / type (Capitalised) / call
      if (/[A-Za-z_]/.test(c)) {
        let j = i + 1; while (j < n && isWord(src[j])) j++;
        const word = src.slice(i, j);
        if (/^[rbfu]{1,2}$/i.test(word) && (src[j] === '"' || src[j] === "'")) {
          const q = src[j]; let k;
          if (src[j + 1] === q && src[j + 2] === q) { const t = q + q + q; k = src.indexOf(t, j + 3); k = k < 0 ? n : k + 3; }
          else { k = j + 1; while (k < n && src[k] !== q) { if (src[k] === "\\") k++; k++; } k = Math.min(k + 1, n); }
          out += `<span class="tok-str">${escHtml(src.slice(i, k))}</span>`; i = k; continue;
        }
        let cls = null;
        if (PY_KEYWORDS.has(word)) cls = "tok-kw";
        else if (PY_BUILTINS.has(word)) cls = "tok-fn";
        else if (/^[A-Z]/.test(word)) cls = "tok-type";
        else if (src[j] === "(") cls = "tok-fn";
        out += cls ? `<span class="${cls}">${escHtml(word)}</span>` : escHtml(word);
        i = j; continue;
      }
      out += escHtml(c); i++;
    }
    return out;
  }

  window.highlightJava = highlightJava;
  window.highlightPython = highlightPython;
})();

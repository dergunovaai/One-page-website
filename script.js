(() => {
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = Date.now();

  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  const GITHUB = "https://github.com/dergunovaai";
  const TELEGRAM = "https://t.me/aryanochkaa";
  const EMAIL = "dergunova.ai@dvfu.ru";
  const THEMES = ["green", "amber", "violet", "white"];

  /* ================= TEXT ================= */

  const GREET = {
    ru: ["Доброе утро", "Добрый день", "Добрый вечер", "Доброй ночи"],
    en: ["Good morning", "Good afternoon", "Good evening", "Good night"],
  };
  const SUBTITLE = {
    ru: "Студентка ДВФУ · Системное программирование",
    en: "FEFU student · System Programming",
  };
  const HINT = { ru: "нажми ~, чтобы открыть терминал", en: "press ~ to open terminal" };
  const TITLE = { ru: "Визитка Арианы", en: "Ariana's Card" };
  const COPIED = { ru: "Почта скопирована: ", en: "Email copied: " };

  function greeting(lang) {
    const h = new Date().getHours();
    const i = h >= 5 && h < 12 ? 0 : h >= 12 && h < 18 ? 1 : h >= 18 && h < 23 ? 2 : 3;
    return lang === "ru" ? `${GREET.ru[i]}, это Ариана` : `${GREET.en[i]}, it's Ariana`;
  }

  /* ---------- scramble effect ---------- */

  const GLYPHS = "!<>-_\\/[]{}=+*^?#%&@01";
  const frames = new WeakMap();

  function scramble(el, text, fast = false) {
    cancelAnimationFrame(frames.get(el));
    if (reduce) { el.textContent = text; return; }

    const start = performance.now();
    const base = fast ? 60 : 200;
    const step = fast ? 22 : 28;
    const jitter = fast ? 90 : 220;
    const reveal = [...text].map((_, i) => base + i * step + Math.random() * jitter);
    const end = Math.max(...reveal);
    let lastSwap = 0;

    const tick = (now) => {
      const t = now - start;
      if (now - lastSwap > 45 || t >= end) {
        lastSwap = now;
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          out += c === " " || t >= reveal[i] ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
      }
      if (t < end) frames.set(el, requestAnimationFrame(tick));
    };
    frames.set(el, requestAnimationFrame(tick));
  }

  // scramble on hover / focus / touch for the command links
  document.querySelectorAll(".links a").forEach((a) => {
    const cmd = a.querySelector(".cmd");
    const run = () => scramble(cmd, cmd.dataset.text, true);
    a.addEventListener("pointerenter", run);
    a.addEventListener("focus", run);
  });

  /* ---------- language ---------- */

  let lang = store.get("lang", "ru");
  if (lang !== "ru" && lang !== "en") lang = "ru";

  function renderLang(animate = true) {
    const g = greeting(lang);
    root.lang = lang;
    document.title = TITLE[lang];
    $("#hint-text").textContent = HINT[lang];
    $("#greeting-wrap").setAttribute("aria-label", g);
    $("#subtitle-wrap").setAttribute("aria-label", SUBTITLE[lang]);
    if (animate) {
      scramble($("#greeting"), g);
      scramble($("#subtitle"), SUBTITLE[lang]);
    } else {
      $("#greeting").textContent = g;
      $("#subtitle").textContent = SUBTITLE[lang];
    }
    document.querySelectorAll("[data-lang]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang))
    );
  }

  function setLang(l) {
    if (l === lang) return;
    lang = l;
    store.set("lang", lang);
    renderLang();
  }

  document.querySelectorAll("[data-lang]").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.lang))
  );

  /* ---------- theme ---------- */

  let accent = "#5cf08a";

  function updateFavicon() {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15.5" fill="${accent}"/>` +
      `<path d="M9 23 16 8l7 15M11.6 18.2h8.8" fill="none" stroke="#090b0a" stroke-width="2.7" stroke-linejoin="round"/></svg>`;
    $("#favicon").href = "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function setTheme(name) {
    root.dataset.theme = name;
    accent = getComputedStyle(root).getPropertyValue("--accent").trim() || accent;
    document.querySelectorAll("[data-set]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.set === name))
    );
    updateFavicon();
    if (reduce) draw();
  }

  document.querySelectorAll("[data-set]").forEach((b) =>
    b.addEventListener("click", () => {
      store.set("theme", b.dataset.set);
      setTheme(b.dataset.set);
    })
  );

  /* ---------- status bar ---------- */

  const pad = (n) => String(n).padStart(2, "0");
  function tickStatus() {
    const d = new Date();
    $("#clock").textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const s = Math.floor((Date.now() - t0) / 1000);
    const h = Math.floor(s / 3600);
    $("#uptime").textContent = (h ? pad(h) + ":" : "") + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
  }

  /* ---------- email: copy address ---------- */

  const toast = $("#toast");
  let toastTimer;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function copyEmail() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(EMAIL).then(() => true, () => false);
    }
    return Promise.resolve(false);
  }

  // mailto still opens a mail client if one exists; the copy is the fallback
  $("#mail").addEventListener("click", () =>
    copyEmail().then((ok) => showToast(ok ? COPIED[lang] + EMAIL : EMAIL))
  );

  /* ================= TERMINAL ================= */

  const term = $("#terminal");
  const out = $("#term-out");
  const input = $("#term-in");
  const photo = $("#photo");
  const history = [];
  let hi = 0;
  let welcomed = false;

  function print(text, cls) {
    const d = document.createElement("div");
    if (cls) d.className = cls;
    d.textContent = text;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }

  function echo(line) {
    const d = document.createElement("div");
    d.className = "cmd-echo";
    const b = document.createElement("b");
    b.textContent = "visitor@ariana:~$";
    d.append(b, " " + line);
    out.appendChild(d);
  }

  const termOpen = () => !term.hidden;

  function openTerm() {
    term.hidden = false;
    if (!welcomed) {
      welcomed = true;
      print('Ariana\'s terminal. type "help" for the list of commands.');
    }
    input.focus();
  }
  function closeTerm() {
    term.hidden = true;
    input.blur();
  }
  function showPhoto() {
    const img = $("#photo-img");
    if (!img.getAttribute("src")) img.src = "images/meimei.jpg"; // loaded only on demand
    photo.hidden = false;
  }
  function closePhoto() {
    photo.hidden = true;
    if (termOpen()) input.focus();
  }

  const commands = Object.create(null);
  commands.help = () =>
    print(
      [
        "available commands:",
        "  about      who is Ariana",
        "  contacts   links and email",
        "  github     open GitHub",
        "  telegram   open Telegram",
        "  email      copy email address",
        "  lang       lang ru | lang en",
        "  theme      theme green | amber | violet | white",
        "  clear      clear the screen",
        "  exit       close the terminal",
        "...and some secrets",
      ].join("\n")
    );
  commands.about = () =>
    print(
      [
        "name:    Ariana",
        "uni:     FEFU",
        "major:   system programming",
        "status:  learning",
        "links:   type contacts",
      ].join("\n")
    );
  commands.contacts = () =>
    print(
      [
        "github:    github.com/dergunovaai",
        "telegram:  t.me/aryanochkaa",
        `email:     ${EMAIL}`,
      ].join("\n")
    );
  commands.github = () => { print("opening github..."); window.open(GITHUB, "_blank", "noopener"); };
  commands.telegram = () => { print("opening telegram..."); window.open(TELEGRAM, "_blank", "noopener"); };
  commands.email = () => copyEmail().then((ok) => print(ok ? `email copied: ${EMAIL}` : EMAIL));
  commands.lang = ([l]) => {
    if (l !== "ru" && l !== "en") return print("usage: lang ru | lang en");
    setLang(l);
    print(`language set to ${l}`);
  };
  commands.theme = ([t]) => {
    if (!THEMES.includes(t)) return print("usage: theme green | amber | violet | white");
    store.set("theme", t);
    setTheme(t);
    print(`theme set to ${t}`);
  };
  commands.clear = () => { out.textContent = ""; };
  commands.exit = () => closeTerm();
  commands.meimei = () => { print("loading meimei.jpg..."); showPhoto(); };

  function run(raw) {
    const line = raw.trim();
    echo(line);
    if (!line) return;
    history.push(line);
    hi = history.length;
    const [cmd, ...args] = line.split(/\s+/);
    const c = cmd.toLowerCase();
    if (c === "sudo") return print("nice try. permission denied.");
    const fn = commands[c];
    if (!fn) return print(`command not found: ${cmd}. type help`);
    fn(args.map((a) => a.toLowerCase()));
  }

  const COMPLETABLE = ["about", "contacts", "github", "telegram", "email", "lang", "theme", "clear", "exit", "help"];

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      run(input.value);
      input.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hi > 0) input.value = history[--hi];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hi = Math.min(hi + 1, history.length);
      input.value = history[hi] || "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      const v = input.value.trim().toLowerCase();
      const m = COMPLETABLE.filter((c) => c.startsWith(v));
      if (v && m.length === 1) input.value = m[0];
    }
  });

  term.addEventListener("click", () => {
    if (!String(getSelection())) input.focus();
  });
  $("#term-open").addEventListener("click", () => (termOpen() ? closeTerm() : openTerm()));
  photo.addEventListener("click", closePhoto);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!photo.hidden) closePhoto();
      else if (termOpen()) closeTerm();
      return;
    }
    if (termOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (e.code === "Backquote" || ["~", "`", "ё", "Ё"].includes(e.key)) {
      e.preventDefault();
      openTerm();
    }
  });

  /* ================= ASCII BACKGROUND ================= */

  const cv = $("#bg");
  const ctx = cv.getContext("2d");
  const CHARS = ".:;+*=-<>/\\|#%&01{}[]~^";
  const FONT = '14px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

  let W = 0, H = 0;
  let parts = [];
  const ripples = [];
  const mouse = { x: -9999, y: -9999 };

  const MOUSE_R = 140;
  const RIPPLE_SPEED = 0.45; // px per ms
  const RIPPLE_WIDTH = 55;
  const RIPPLE_LIFE = 2600;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const n = Math.max(120, Math.min(800, Math.floor((W * H) / 2600)));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0,
      vy: 0,
      ang: Math.random() * Math.PI * 2,
      sp: 0.15 + Math.random() * 0.35,
      c: CHARS[(Math.random() * CHARS.length) | 0],
      a: 0.12 + Math.random() * 0.25,
      g: 0,
    }));
    if (reduce) draw();
  }

  function update(now, dt) {
    for (let r = ripples.length - 1; r >= 0; r--) {
      if (now - ripples[r].t > RIPPLE_LIFE) ripples.splice(r, 1);
    }

    for (const p of parts) {
      // smooth wandering: slowly turning heading, velocity eases toward it
      p.ang += (Math.random() - 0.5) * 0.12 * dt;
      p.vx += (Math.cos(p.ang) * p.sp - p.vx) * 0.02 * dt;
      p.vy += (Math.sin(p.ang) * p.sp - p.vy) * 0.02 * dt;

      // cursor repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < MOUSE_R * MOUSE_R && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const k = 1 - d / MOUSE_R;
        const f = k * k * 0.18 * dt;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
        p.g = Math.max(p.g, k * 0.5);
      }

      // click ripples
      for (const r of ripples) {
        const age = now - r.t;
        const radius = age * RIPPLE_SPEED;
        const rx = p.x - r.x;
        const ry = p.y - r.y;
        const d = Math.hypot(rx, ry) || 0.01;
        const diff = Math.abs(d - radius);
        if (diff < RIPPLE_WIDTH) {
          const k = (1 - diff / RIPPLE_WIDTH) * (1 - age / RIPPLE_LIFE);
          const f = k * 0.3 * dt;
          p.vx += (rx / d) * f;
          p.vy += (ry / d) * f;
          p.g = Math.max(p.g, k * 0.9);
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.g *= Math.pow(0.94, dt);

      if (p.x < -20) p.x = W + 20;
      else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      else if (p.y > H + 20) p.y = -20;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = accent;
    for (const p of parts) {
      ctx.globalAlpha = Math.min(1, p.a + p.g);
      ctx.fillText(p.g > 0.5 ? "@" : p.c, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(32, now - last) / 16.67;
    last = now;
    update(now, dt);
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- pointer input ---------- */

  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("pointerdown", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    // no wave on controls, links, terminal or the photo
    if (e.target.closest("button, a, input, #terminal, #photo")) return;
    if (!reduce) ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  });
  const away = () => { mouse.x = mouse.y = -9999; };
  window.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") away(); });
  window.addEventListener("pointercancel", away);
  document.addEventListener("pointerleave", away);

  /* ================= INIT ================= */

  window.addEventListener("resize", resize);
  setTheme(store.get("theme", "green"));
  resize();
  renderLang(true);
  tickStatus();
  setInterval(tickStatus, 1000);
  if (!reduce) requestAnimationFrame(loop);
})();

/* Ensure Back from authentication cannot restore a stale pre-deploy landing. */
(function () {
  const RETURN_REFRESH_KEY = "freescale:refresh-landing-on-return";
  const resettingScroll = sessionStorage.getItem(RETURN_REFRESH_KEY) === "resetting";

  if (resettingScroll) {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    requestAnimationFrame(function () {
      window.scrollTo(0, 0);
      requestAnimationFrame(function () {
        window.scrollTo(0, 0);
        sessionStorage.removeItem(RETURN_REFRESH_KEY);
        history.scrollRestoration = "auto";
      });
    });
  }

  document.addEventListener("click", function (event) {
    const target = event.target;
    const link = target && target.closest ? target.closest('a[href^="/login"]') : null;
    if (link) {
      sessionStorage.setItem(RETURN_REFRESH_KEY, "pending");
      history.scrollRestoration = "manual";
    }
  });

  function refreshAfterAuthReturn() {
    if (sessionStorage.getItem(RETURN_REFRESH_KEY) !== "pending") return;
    if (window.location.pathname !== "/") return;
    sessionStorage.setItem(RETURN_REFRESH_KEY, "resetting");
    window.scrollTo(0, 0);
    window.location.reload();
  }

  window.addEventListener("pageshow", function (event) {
    const navigation = performance.getEntriesByType
      ? performance.getEntriesByType("navigation")[0]
      : null;
    if (event.persisted || (navigation && navigation.type === "back_forward")) {
      refreshAfterAuthReturn();
    }
  });
  window.addEventListener("popstate", refreshAfterAuthReturn);
})();

// Minimal mobile menu toggle
const burger = document.querySelector(".nav__burger");
const links = document.querySelector(".nav__links");

/* ── Floating collage parallax (subtle, follows the cursor) ───────── */
(function () {
  const collage = document.querySelector(".screen-collage");
  if (!collage) return;
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  let ticking = false;
  let mx = 0, my = 0;
  function apply() {
    const x = (window.innerWidth / 2 - mx) / 55;
    const y = (window.innerHeight / 2 - my) / 55;
    collage.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    ticking = false;
  }
  window.addEventListener(
    "mousemove",
    function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    },
    { passive: true }
  );
})();

/* ── Hero woman: gentle scroll parallax (she drifts down as you scroll) ── */
(function () {
  const visual = document.querySelector(".hero__visual");
  if (!visual) return;
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  let ticking = false;
  function apply() {
    ticking = false;
    // disabled on stacked mobile layout (woman is in the flow there)
    if (window.innerWidth < 900) {
      visual.style.transform = "";
      visual.style.opacity = "";
      return;
    }
    const y = window.scrollY;
    const vh = window.innerHeight || 800;
    // drift down…
    visual.style.transform = "translateY(" + (y * 0.14).toFixed(1) + "px)";
    // …and fade out EARLY in the scroll ("disparaît plus tôt encore")
    const fStart = vh * 0.16;
    const fEnd = vh * 0.46;
    const t = Math.max(0, Math.min(1, (y - fStart) / (fEnd - fStart)));
    visual.style.opacity = (1 - t * 0.82).toFixed(3); // fades to ~0.18
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  apply();
})();

if (burger) {
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    if (links) links.classList.toggle("is-open", !open);
  });
}

/* ── Nav hide on scroll-down, reveal on scroll-up ─────────────────── */
(function () {
  const nav = document.querySelector(".nav");
  const navBlur = document.querySelector(".nav-blur");
  if (!nav) return;

  // only the nav hides on scroll — the .nav-blur stays put (permanent top blur)
  function setHidden(hidden) {
    nav.classList.toggle("is-hidden", hidden);
    if (navBlur) navBlur.classList.toggle("is-hidden", hidden);
  }

  // toggle white-bg mode once past the hero
  const hero = document.querySelector(".hero");
  function updatePastHero(y) {
    if (!hero) return;
    const past = y > (hero.offsetHeight - 80);
    nav.classList.toggle("is-past-hero", past);
    if (navBlur) navBlur.classList.toggle("is-past-hero", past);
  }

  let lastY = window.scrollY;
  let accum = 0;                 // scroll distance accumulated in the current direction
  let ticking = false;
  let armed = false;            // grace period so we don't race the dropIn animation
  const HIDE_AT = 8;            // cumulative px scrolled DOWN before hiding
  const SHOW_AT = 6;            // cumulative px scrolled UP before revealing (eager)
  const TOP_LOCK = 80;          // always visible near top

  function update() {
    const y = Math.max(0, window.scrollY); // clamp negative (rubber-band)
    const delta = y - lastY;
    lastY = y;
    ticking = false;
    updatePastHero(y);

    if (y < TOP_LOCK) {           // always show near the top
      setHidden(false);
      accum = 0;
      return;
    }
    if (delta === 0) return;
    // reset the accumulator the moment direction flips → instant response
    if ((delta > 0) !== (accum > 0)) accum = 0;
    accum += delta;

    if (accum > HIDE_AT) {
      setHidden(true);
      if (links && links.classList.contains("is-open")) {
        links.classList.remove("is-open");
        if (burger) burger.setAttribute("aria-expanded", "false");
      }
    } else if (accum < -SHOW_AT) {
      setHidden(false);
    }
  }

  function onScroll() {
    if (!armed || ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  // let the dropIn entrance finish before reacting to scroll
  setTimeout(function () {
    armed = true;
    lastY = window.scrollY; // re-baseline in case the user already scrolled
  }, 850);

  updatePastHero(window.scrollY);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { updatePastHero(window.scrollY); });
})();

/* ── Testimonial slider (ported from the React component) ───────────── */
(function () {
  const tm = document.querySelector(".tm");
  if (!tm) return;

  const reviews = [
    {
      date: "Sept. 2024",
      quote:
        "« Avant Freescale, je jonglais entre WhatsApp, Insta et mes mails toute la journée. Aujourd'hui tout est au même endroit — je ne reviendrai jamais en arrière. »",
      name: "Camille Dubois",
      avatar: "/home/assets/avatar-1.jpg",
    },
    {
      date: "Août 2024",
      quote:
        "« Le copilote IA me fait gagner des heures chaque semaine. Mes clients me trouvent ultra réactive, et je n'écris presque plus rien moi-même. »",
      name: "Léa Moreau",
      avatar: "/home/assets/avatar-2.jpg",
    },
    {
      date: "Juil. 2024",
      quote:
        "« Je gère deux fois plus de clients sans stress. Freescale est devenu l'outil que je recommande à tous les freelances autour de moi. »",
      name: "Sophie Martin",
      avatar: "/home/assets/avatar-3.jpg",
    },
  ];

  const intervalMs = 5000;
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dateEl = tm.querySelector(".tm__date");
  const quoteEl = tm.querySelector(".tm__quote");
  const authorImg = tm.querySelector(".tm__author img");
  const authorName = tm.querySelector(".tm__author span");
  const bars = Array.prototype.slice.call(tm.querySelectorAll(".tm__bar i"));

  let idx = 0;
  let paused = false;
  let timer = null;

  function render(i) {
    const r = reviews[i];
    if (!r) return;
    dateEl.textContent = r.date;
    quoteEl.textContent = r.quote;
    if (authorImg) authorImg.setAttribute("src", r.avatar);
    if (authorName) authorName.textContent = r.name;
  }

  function cycle() {
    if (paused || reviews.length <= 1) return;
    bars.forEach(function (b) {
      b.style.transition = "none";
      b.style.width = "0%";
    });
    const cur = bars[idx];
    if (cur) {
      void cur.offsetWidth; // reflow so the bar restarts from 0
      if (reduce) {
        cur.style.width = "100%";
      } else {
        cur.style.transition = "width " + intervalMs + "ms linear";
        cur.style.width = "100%";
      }
    }
    timer = setTimeout(function () {
      idx = (idx + 1) % reviews.length;
      render(idx);
      cycle();
    }, intervalMs);
  }

  function pause() {
    paused = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  function resume() {
    if (!paused) return;
    paused = false;
    cycle();
  }

  tm.addEventListener("mouseenter", pause);
  tm.addEventListener("mouseleave", resume);
  tm.addEventListener("focusin", pause);
  tm.addEventListener("focusout", resume);

  render(0);

  if (reduce) {
    tm.classList.add("is-visible");
    cycle();
  } else {
    const io = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          tm.classList.add("is-visible");
          io.disconnect();
          cycle();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(tm);
  }
})();

/* ── Statement: first-appearance reveal — grey → CTA gradient → black (one-shot) ── */
(function () {
  const section = document.querySelector(".statement");
  if (!section) return;
  const textEl = section.querySelector(".statement__text");
  if (!textEl) return;

  // split into word spans, preserving any <em> accent as italic-serif words
  const spans = [];
  (function () {
    const nodes = Array.prototype.slice.call(textEl.childNodes);
    textEl.textContent = "";
    nodes.forEach(function (node) {
      const serif = node.nodeType === 1; // an <em> → serif-italic accent words
      node.textContent.split(/(\s+)/).forEach(function (chunk) {
        if (chunk === "") return;
        if (/^\s+$/.test(chunk)) { textEl.appendChild(document.createTextNode(chunk)); return; }
        const s = document.createElement("span");
        s.className = "statement__word" + (serif ? " statement__word--serif" : "");
        s.textContent = chunk;
        textEl.appendChild(s);
        spans.push(s);
      });
    });
  })();

  // sequence the wave LINE BY LINE (the phrase wraps, so lines = words sharing an offsetTop):
  // each rendered line's first word waits until the previous line is almost finished.
  function assignLineDelays() {
    const STAGGER = 0.07, GAP = 0.42; // seconds (GAP ≈ how "almost finished" the prev line is)
    let base = 0, wi = 0, lineTop = null, maxD = 0;
    spans.forEach(function (s) {
      const top = s.offsetTop;
      if (lineTop === null) { lineTop = top; }
      else if (Math.abs(top - lineTop) > 12) {       // wrapped to a new visual line (12px ignores serif/sans baseline jitter)
        base += Math.max(0, wi - 1) * STAGGER + GAP; // wait out the previous line
        lineTop = top; wi = 0;
      }
      const d = base + wi * STAGGER;
      if (d > maxD) maxD = d;
      s.style.setProperty("--d", d.toFixed(3) + "s");
      wi++;
    });
    // the logos slide in once the LAST word's reveal has (nearly) finished (.65s word dur)
    section.style.setProperty("--logos-delay", (maxD + 0.55).toFixed(3) + "s");
  }

  // make the CTA gradient span the WHOLE phrase (not per-word): each word gets the
  // full text-block-sized gradient, shifted to the word's own position → one continuous slice
  function sliceGradient() {
    const tw = textEl.clientWidth, th = textEl.clientHeight;
    spans.forEach(function (s) {
      s.style.backgroundSize = tw + "px " + th + "px";
      s.style.backgroundPosition = (-s.offsetLeft) + "px " + (-s.offsetTop) + "px";
    });
    assignLineDelays();
  }
  sliceGradient();
  window.addEventListener("resize", sliceGradient);
  window.addEventListener("load", sliceGradient);

  // play the reveal ONCE, the first time the phrase is meaningfully in view
  let played = false;
  function maybePlay() {
    if (played) return;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.72 && rect.bottom > vh * 0.12) {
      played = true;
      section.classList.add("is-in");
      window.removeEventListener("scroll", maybePlay);
    }
  }
  window.addEventListener("scroll", maybePlay, { passive: true });
  window.addEventListener("resize", maybePlay);
  maybePlay();
})();

/* ── Hero headline: first-paint reveal — grey → CTA gradient → black, word by word ── */
(function () {
  const headline = document.querySelector(".headline");
  if (!headline) return;
  const lines = Array.prototype.slice.call(headline.querySelectorAll(".line"));
  if (!lines.length) return;

  // wrap every word of every line in a .hl-word span (spaces kept as text nodes),
  // sequencing the wave LINE BY LINE: each line's first word waits until the previous
  // line is almost finished (base += that line's sweep + GAP) — the wave never jumps to
  // the next line before the current one has (nearly) resolved.
  const STAGGER = 0.07, GAP = 0.42, INIT = 0.1; // seconds (GAP ≈ how "almost finished" the prev line is)
  const spans = [];
  let base = INIT;
  lines.forEach(function (line) {
    const text = line.textContent;
    line.textContent = "";
    const lineWords = [];
    text.split(/(\s+)/).forEach(function (chunk) {
      if (chunk === "") return;
      if (/^\s+$/.test(chunk)) { line.appendChild(document.createTextNode(chunk)); return; }
      const s = document.createElement("span");
      s.className = "hl-word";
      s.textContent = chunk;
      line.appendChild(s);
      spans.push(s);
      lineWords.push(s);
    });
    lineWords.forEach(function (s, wi) {
      s.style.setProperty("--d", (base + wi * STAGGER).toFixed(3) + "s");
    });
    base += Math.max(0, lineWords.length - 1) * STAGGER + GAP;
  });

  // continuous CTA gradient across the WHOLE headline (each word carries a slice)
  function sliceGradient() {
    const tw = headline.clientWidth, th = headline.clientHeight;
    spans.forEach(function (s) {
      s.style.backgroundSize = tw + "px " + th + "px";
      s.style.backgroundPosition = (-s.offsetLeft) + "px " + (-s.offsetTop) + "px";
    });
  }
  sliceGradient();
  window.addEventListener("resize", sliceGradient);

  // play the reveal once the fonts have settled (so the slice lines up); fallback timer guards it
  let started = false;
  function start() {
    if (started) return;
    started = true;
    sliceGradient();
    headline.classList.add("is-in");
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { sliceGradient(); requestAnimationFrame(start); });
  }
  window.addEventListener("load", function () { sliceGradient(); start(); });
  setTimeout(start, 600); // hard fallback so the title never stays invisible
})();

/* ── Mue copilot: image appears CENTERED first, then slides right as the copy reveals left ── */
(function () {
  const section = document.querySelector(".mue");
  if (!section) return;
  const titleEl = section.querySelector(".mue__title");
  const eyebrowEl = section.querySelector(".mue__eyebrow");
  const copyEl = section.querySelector(".mue__copy");
  const visual = section.querySelector(".mue__visual");
  const png = visual ? visual.querySelector("img") : null;
  const pill = section.querySelector(".mue__pill");
  const lines = Array.prototype.slice.call(
    section.querySelectorAll(".mue__text, .mue__list li")
  );

  // how far to shift the image LEFT so it sits dead-centre of the viewport during phase 1.
  // measured from its natural grid slot (right column); horizontal → scroll-independent.
  let centerShift = 0, lastW = 0;
  function measure() {
    if (!visual) return;
    const prev = visual.style.transform;
    visual.style.transform = "none";
    const r = visual.getBoundingClientRect();
    centerShift = Math.round(window.innerWidth / 2 - (r.left + r.width / 2));
    visual.style.transform = prev;
    lastW = window.innerWidth;
  }

  // split the title into word spans, preserving the serif accent word(s) in <em>
  const spans = [];
  if (titleEl) {
    const nodes = Array.prototype.slice.call(titleEl.childNodes);
    titleEl.textContent = "";
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        // text node → one span per word, keep the whitespace between them
        node.textContent.split(/(\s+)/).forEach(function (chunk) {
          if (chunk === "") return;
          if (/^\s+$/.test(chunk)) {
            titleEl.appendChild(document.createTextNode(chunk));
            return;
          }
          const s = document.createElement("span");
          s.className = "mue__word";
          s.textContent = chunk;
          titleEl.appendChild(s);
          spans.push(s);
        });
      } else if (node.nodeType === 1) {
        // the <em> accent → one serif word span
        const s = document.createElement("span");
        s.className = "mue__word mue__word--serif";
        s.textContent = node.textContent;
        titleEl.appendChild(s);
        spans.push(s);
      }
    });
  }

  const N = spans.length;
  const SPREAD = 5, A_START = 0.18, A_END = 1;
  function paint(p) {
    for (let i = 0; i < N; i++) {
      const t = Math.max(0, Math.min(1, (p * (N + SPREAD) - i) / SPREAD));
      spans[i].style.color = "rgba(21, 23, 29, " + (A_START + (A_END - A_START) * t).toFixed(3) + ")";
    }
  }
  function sm(q) { q = Math.max(0, Math.min(1, q)); return q * q * (3 - 2 * q); } // smoothstep

  function finalState() {
    paint(1);
    if (copyEl) copyEl.style.opacity = "1";
    if (eyebrowEl) { eyebrowEl.style.opacity = "1"; eyebrowEl.style.transform = "none"; }
    lines.forEach(function (l) { l.style.opacity = "1"; l.style.transform = "none"; });
    if (visual) { visual.style.opacity = "1"; visual.style.transform = "none"; }
    if (png) png.style.transform = "none";
    if (pill) { pill.style.opacity = "1"; pill.style.transform = "none"; }
  }

  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { finalState(); return; }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      // stacked mobile layout → everything visible, no transforms
      if (window.innerWidth < 900) { finalState(); return; }

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom < -40 || rect.top > vh + 40) return;

      if (window.innerWidth !== lastW) measure();

      const total = section.offsetHeight - vh;
      const prog = Math.max(0, Math.min(1, total > 0 ? -rect.top / total : 0));

      // PHASE 1 — the IMAGE is simply PRESENT and CENTERED (no fade / scale apparition).
      // PHASE 2 — it slides from the centre to its right slot while the copy reveals left.
      const move = sm((prog - 0.46) / 0.40);  // 0→1 : centre → right slot
      if (visual) {
        visual.style.transform = "translateX(" + (centerShift * (1 - move)).toFixed(1) + "px)";
      }

      // copy block stays hidden during phase 1 (nothing sits under the centred image),
      // then fades in as the image starts moving to the right
      const copyReveal = sm((prog - 0.46) / 0.12);
      if (copyEl) copyEl.style.opacity = copyReveal.toFixed(3);

      // THEN THE TEXT — eyebrow, title word-fill, then the lines stagger from the LEFT
      if (eyebrowEl) {
        const e = sm((prog - 0.48) / 0.12);
        eyebrowEl.style.opacity = e.toFixed(3);
        eyebrowEl.style.transform = "translateY(" + ((1 - e) * 12).toFixed(1) + "px)";
      }
      paint(Math.max(0, Math.min(1, (prog - 0.5) / 0.34)));
      lines.forEach(function (l, i) {
        const e = sm((prog - 0.6) / 0.34 - i * 0.1);
        l.style.opacity = e.toFixed(3);
        l.style.transform =
          "translateX(" + (-(1 - e) * 44).toFixed(1) + "px) translateY(" + ((1 - e) * 14).toFixed(1) + "px)";
      });

      // pill "Mue a rédigé une réponse" — fades in at the very end
      if (pill) {
        const r = sm((prog - 0.82) / 0.16);
        pill.style.opacity = r.toFixed(3);
        pill.style.transform = "translateY(" + ((1 - r) * 10).toFixed(1) + "px)";
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();

/* ── Inbox "screen": constant mini 3D tilt + a very subtle upward scroll parallax ── */
(function () {
  const screen = document.querySelector(".inbox");
  if (!screen) return;
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;
  function apply() {
    ticking = false;
    if (window.innerWidth < 820) { screen.style.transform = ""; return; } // stacked → flat
    const rect = screen.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // very subtle upward parallax + a constant MINI 3D tilt (top leans back a touch)
    let q = (vh - rect.top) / (vh + rect.height);
    q = Math.max(0, Math.min(1, q));
    screen.style.transform = "translateY(" + (-q * 34).toFixed(1) + "px) rotateX(5deg)";
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }
  if (reduce) { screen.style.transform = ""; return; }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  apply();
})();

/* ── Dark-card rows = checkable tasks: only the checkbox toggles (strike + check) ── */
(function () {
  const rows = document.querySelectorAll(".dcard .drow");
  if (!rows.length) return;
  const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
  rows.forEach(function (row) {
    const box = document.createElement("button");
    box.type = "button";
    box.className = "dcheck";
    box.setAttribute("aria-label", "Cocher la tâche");
    box.setAttribute("aria-pressed", "false");
    box.innerHTML = CHECK;
    box.addEventListener("click", function (e) {
      e.stopPropagation(); // clicking the row itself does nothing — only the checkbox
      const done = row.classList.toggle("is-done");
      box.setAttribute("aria-pressed", done ? "true" : "false");
    });
    row.insertBefore(box, row.firstChild);
  });
})();

/* ── Steps section: curved black arc at the top that extends & inverts on scroll ── */
(function () {
  const section = document.querySelector(".steps");
  const path = section && section.querySelector(".steps__arc path");
  if (!path) return;
  // amplitude stays NEGATIVE the whole time → the arc never flips: it just flattens.
  const EDGE = 72, START = -68, END = -5; // pronounced convex → almost straight (still convex)
  function draw(amp) {
    const cy = (EDGE + 2 * amp).toFixed(1);
    path.setAttribute("d", "M0 0 H1200 V" + EDGE + " Q600 " + cy + " 0 " + EDGE + " Z");
  }
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { draw(START); return; }
  let ticking = false;
  function apply() {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // p: 0 as the section top reaches the viewport bottom → 1 as it reaches the top
    let p = (vh - rect.top) / vh;
    p = Math.max(0, Math.min(1, p));
    draw(START + p * (END - START)); // stretches from curved → almost flat, same direction
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(apply); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  apply();
})();

/* ── Steps: ONE sticky 3D icon that SPINS on itself and transforms between steps ── */
(function () {
  var list = document.querySelector(".steps__list");
  var steps = list ? Array.prototype.slice.call(list.querySelectorAll(".step")) : [];
  var spin = document.querySelector(".morph__spin");
  var icons = spin ? Array.prototype.slice.call(spin.querySelectorAll(".morph__icon")) : [];
  if (!spin || steps.length < 2 || icons.length !== steps.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var shown = 0, target = 0, animating = false;
  function face(i) {
    icons.forEach(function (ic, k) { ic.classList.toggle("is-active", k === i); });
  }
  face(0);

  // ONE half-turn on the vertical axis per step change: the incoming face is swapped in
  // edge-on (at 90° the object is invisible), pre-counter-rotated 180° so it lands
  // front-facing — reads as "the object turns on itself and transforms".
  function flip() {
    if (animating || target === shown) return;
    if (reduce) { shown = target; face(shown); return; }
    animating = true;
    var next = target;
    var dir = next > shown ? 1 : -1;        // scroll down → spin one way, up → the other
    spin.style.transition = "transform .85s cubic-bezier(.5, .05, .15, 1)";
    void spin.offsetWidth;                  // commit the transition before the transform
    spin.style.transform = "rotateY(" + dir * 180 + "deg)";
    setTimeout(function () {
      icons[next].style.transform = "rotateY(180deg)";  // counter-rotate the incoming face
      face(next);
    }, 425);
    var fired = false;
    var done = function () {
      if (fired) return;
      fired = true;
      spin.removeEventListener("transitionend", done);
      // (spin 180° + face 180°) is visually identical to (0 + 0) → invisible reset
      spin.style.transition = "none";
      spin.style.transform = "rotateY(0deg)";
      icons[next].style.transform = "";
      shown = next;
      requestAnimationFrame(function () { requestAnimationFrame(function () { animating = false; flip(); }); });
    };
    spin.addEventListener("transitionend", done);
    setTimeout(done, 1000);                 // safety: transitionend can be missed in hidden tabs
  }

  var ticking = false;
  function update() {
    ticking = false;
    var mid = (window.innerHeight || document.documentElement.clientHeight) / 2;
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < steps.length; i++) {
      var r = steps[i].getBoundingClientRect();
      var c = r.top + r.height / 2;
      var d = Math.abs(c - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    target = best;
    flip();
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(update); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

/* ── Social icons fly from the hero and dock at the screen's top-right on scroll ── */
(function () {
  var dockEl = document.querySelector(".dock");
  /* Sortie du contexte du hero : on déplace .dock à la racine du body pour
     qu'il ne soit plus enfant du .hero__visual (qui a will-change: transform,
     créant un containing block qui neutraliserait position: fixed). */
  if (dockEl && dockEl.parentNode !== document.body) {
    document.body.appendChild(dockEl);
  }
  var flies = Array.prototype.slice.call(document.querySelectorAll(".dock .fly"));
  if (!flies.length) return;
  var HERO_SIZE = 84; // px diameter while floating in the hero
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tuile 3D avec bord biseauté : chaque slab arrière est légèrement rétréci vers le centre,
  // ce qui arrondit la silhouette (bord doux/bombé) plutôt que de laisser un cube tranché.
  var DEPTH = 5, STEP = .8;
  flies.forEach(function (el) {
    var face = el.querySelector("img");
    if (!face || el.querySelector(".fly__tile")) return;
    /* Certaines icônes source (Teams) ont un padding interne trop généreux
       et paraissent plus petites que les autres à taille égale. Un boost. */
    var extra = (el.dataset.target === "teams") ? 1.15 : 1;
    face.className = "fly__face";
    face.style.transform = "translateZ(.5px) scale(" + extra + ")";
    var tile = document.createElement("span");
    tile.className = "fly__tile";
    for (var k = DEPTH; k >= 1; k--) {                 // back → front so the face ends on top
      var edge = face.cloneNode(false);
      edge.className = "fly__edge";
      edge.removeAttribute("alt");
      var scale = (1 - (k * 0.045)) * extra;           // bevel × extra boost
      edge.style.transform = "translateZ(" + (-k * STEP).toFixed(2) + "px) scale(" + scale.toFixed(3) + ")";
      tile.appendChild(edge);
    }
    tile.appendChild(face);
    el.appendChild(tile);
  });

  var screen = document.querySelector(".screen");
  var chans = document.querySelector(".appbar__chans");
  // Anchor the docked vertical centre on the *row*, not on the slot box.
  // Reason: the static neighbours (.ctile--video/--li/--slack) sit on the
  // flex baseline and may render slightly above the empty slot's box
  // centre (rounding, line-box). Using a non-slot tile as the reference
  // keeps the flies on the exact same horizontal line as the others.
  function rowCenterY(sr) {
    var ref = chans.querySelector(".ctile:not(.ctile--slot)");
    if (ref) {
      var r = ref.getBoundingClientRect();
      return r.top - sr.top + r.height / 2;
    }
    return null;
  }
  var data = [];
  function measure() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var sr = screen.getBoundingClientRect();           // .screen is NOT transformed (anchor frame)
    var rowCy = rowCenterY(sr);
    data = flies.map(function (el) {
      var slot = chans.querySelector('[data-chan="' + el.dataset.target + '"]');
      var tr = slot.getBoundingClientRect();
      var w = (tr.width || 30) * 0.82;                 // dock légèrement plus petit que le slot (icônes plus discrètes à l'arrivée)
      // docked centre, relative to .screen → the fly's resting (left/top) position.
      // x stays on the slot column, y is locked to the row baseline.
      /* .dock est maintenant position: fixed enfant du body → coords
         viewport-relatives. On convertit les valeurs screen-relatives
         (cx/cy/rowCy) en viewport en ajoutant sr.left/sr.top. */
      var cx = tr.left + tr.width / 2;                                 /* déjà viewport (tr from getBoundingClientRect) */
      var cy = rowCy != null ? (rowCy + sr.top) : (tr.top + tr.height / 2);
      el.style.width = w + "px";
      el.style.left = (cx - w / 2).toFixed(1) + "px";
      el.style.top = (cy - w / 2 - 8).toFixed(1) + "px";   /* -8px : uplift optique du dock final */
      var hx = parseFloat(el.dataset.hx) * vw;                          /* hero spot viewport */
      var hy = parseFloat(el.dataset.hy) * vh;
      return {
        el: el,
        tile: el.querySelector(".fly__tile"),
        rx: parseFloat(el.dataset.rx) || 0,            // hero 3D tilt (straightens on scroll)
        ry: parseFloat(el.dataset.ry) || 0,
        rz: parseFloat(el.dataset.rz) || 0,
        dx: hx - cx,                                   // hero spot − docked slot (x)
        dy: hy - cy,                                   // hero spot − docked slot (y)
        scale: (parseFloat(el.dataset.hs) || HERO_SIZE) / w   // per-icon hero size
      };
    });
  }
  function paint(p) {
    var q = 1 - p;
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      d.el.style.transform =
        "translate(" + (d.dx * q).toFixed(1) + "px," + (d.dy * q).toFixed(1) + "px) scale(" +
        (1 + (d.scale - 1) * q).toFixed(3) + ")";
      // 3D tilt is full in the hero (q=1) and straightens to flat as it docks (q→0)
      if (d.tile) d.tile.style.transform =
        "rotateX(" + (d.rx * q).toFixed(2) + "deg) rotateY(" + (d.ry * q).toFixed(2) +
        "deg) rotateZ(" + (d.rz * q).toFixed(2) + "deg)";
    }
  }
  var ticking = false, lastW = -1;
  function apply() {
    ticking = false;
    if (window.innerWidth < 820) { flies.forEach(function (el) { el.style.transform = "none"; var t = el.querySelector(".fly__tile"); if (t) t.style.transform = "none"; }); return; }
    // Re-measure on EVERY frame: the .inbox gets a scroll-driven
    // translateY/rotateX (see the "Inbox screen" parallax block above),
    // so the slot's on-screen position drifts as the user scrolls.
    // Without re-measuring, the flies land on the slot's *initial*
    // position and end up visually below the live tiles by ~34px when
    // fully docked.
    if (window.innerWidth !== lastW) lastW = window.innerWidth;
    measure();
    var vh = window.innerHeight || 800;
    // Course courte : les icônes atteignent leur position dockée à 130% du
    // viewport scrollé (avant 220%) → arrivée plus tôt, plus percutante.
    var raw = Math.max(0, Math.min(1, window.scrollY / (vh * 0.7)));
    // Smootherstep (quintique Hermite) : accélération ET décélération douces
    // → courbe symétrique sans à-coups, aucun double-easing.
    var p = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
    paint(p);
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(apply); }
  if (reduce) { flies.forEach(function (el) { el.style.transform = "none"; }); return; }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", function () { lastW = -1; apply(); });
  apply();
})();

/* ── FAQ: category tabs + single-open accordion with smooth open/close ── */
(function () {
  var faq = document.querySelector(".faq");
  if (!faq) return;
  var tabs = Array.prototype.slice.call(faq.querySelectorAll(".faq__tab"));
  var items = Array.prototype.slice.call(faq.querySelectorAll(".faq__item"));
  if (!tabs.length || !items.length) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUR = 320;                                                // ms — same feel as our other reveals

  // Wrap each <p> in a .faq__body div so we can animate its height
  items.forEach(function (it) {
    var p = it.querySelector("p");
    if (!p || p.parentNode.classList.contains("faq__body")) return;
    var body = document.createElement("div");
    body.className = "faq__body";
    p.parentNode.insertBefore(body, p);
    body.appendChild(p);
  });

  function openItem(it) {
    if (it.open) return;
    it.open = true;
    var body = it.querySelector(".faq__body");
    if (!body || reduce) return;
    var end = body.scrollHeight;
    body.style.height = "0px";
    // force reflow so the height:0 is committed before we set the target
    void body.offsetHeight;
    body.style.height = end + "px";
    var onEnd = function (e) {
      if (e.propertyName !== "height") return;
      body.style.height = "";
      body.removeEventListener("transitionend", onEnd);
    };
    body.addEventListener("transitionend", onEnd);
  }

  function closeItem(it) {
    if (!it.open) return;
    var body = it.querySelector(".faq__body");
    if (!body || reduce) { it.open = false; return; }
    var start = body.scrollHeight;
    body.style.height = start + "px";
    void body.offsetHeight;
    body.style.height = "0px";
    var onEnd = function (e) {
      if (e.propertyName !== "height") return;
      it.open = false;
      body.style.height = "";
      body.removeEventListener("transitionend", onEnd);
    };
    body.addEventListener("transitionend", onEnd);
  }

  // Intercept clicks on <summary> to run our animated toggle
  items.forEach(function (it) {
    var sm = it.querySelector("summary");
    if (!sm) return;
    sm.addEventListener("click", function (e) {
      e.preventDefault();
      if (it.open) {
        closeItem(it);
      } else {
        // single-open: animate-close any currently open sibling in the same tab
        items.forEach(function (o) {
          if (o !== it && o.open && !o.hidden) closeItem(o);
        });
        openItem(it);
      }
    });
  });

  function show(cat) {
    tabs.forEach(function (t) { t.classList.toggle("is-on", t.dataset.cat === cat); });
    var first = true;
    items.forEach(function (it) {
      var on = it.dataset.cat === cat;
      it.hidden = !on;
      // programmatic tab switch: reset instantly (no animation), first item open
      var body = it.querySelector(".faq__body");
      if (body) body.style.height = "";
      if (on) { it.open = first; first = false; }
      else { it.open = false; }
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { show(t.dataset.cat); });
  });

  show("general");
})();

/* ── WAVE reveal for every section title (same effect as the hero/statement) ── */
(function () {
  var titles = document.querySelectorAll(".why__title, .pricing__title, .faq__title, .closer__title");
  if (!titles.length) return;

  Array.prototype.forEach.call(titles, function (el) {
    el.style.position = "relative";   // offsetParent for the continuous gradient slicing

    // split into word spans, preserving <em> accents as serif-italic words
    var spans = [];
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.textContent = "";
    nodes.forEach(function (node) {
      var serif = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach(function (chunk) {
        if (chunk === "") return;
        if (/^\s+$/.test(chunk)) { el.appendChild(document.createTextNode(chunk)); return; }
        var s = document.createElement("span");
        s.className = "wv-word" + (serif ? " wv-word--serif" : "");
        s.textContent = chunk;
        el.appendChild(s);
        spans.push(s);
      });
    });

    // line-by-line sequencing (rendered lines = words sharing an offsetTop)
    function assignLineDelays() {
      var STAGGER = 0.07, GAP = 0.42;
      var base = 0, wi = 0, lineTop = null;
      spans.forEach(function (s) {
        var top = s.offsetTop;
        if (lineTop === null) { lineTop = top; }
        else if (Math.abs(top - lineTop) > 12) {
          base += Math.max(0, wi - 1) * STAGGER + GAP;
          lineTop = top; wi = 0;
        }
        s.style.setProperty("--d", (base + wi * STAGGER).toFixed(3) + "s");
        wi++;
      });
    }
    // one continuous gradient across the whole title
    function sliceGradient() {
      var tw = el.clientWidth, th = el.clientHeight;
      spans.forEach(function (s) {
        s.style.backgroundSize = tw + "px " + th + "px";
        s.style.backgroundPosition = (-s.offsetLeft) + "px " + (-s.offsetTop) + "px";
      });
      assignLineDelays();
    }
    sliceGradient();
    window.addEventListener("resize", sliceGradient);
    window.addEventListener("load", sliceGradient);

    // play once, the first time the title is meaningfully in view
    var played = false;
    function maybePlay() {
      if (played) return;
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh * 0.82 && rect.bottom > 0) {
        played = true;
        el.classList.add("is-in");
        window.removeEventListener("scroll", maybePlay);
      }
    }
    window.addEventListener("scroll", maybePlay, { passive: true });
    maybePlay();
  });
})();

/* ── WHY: the sticky cut-out visual SPINS on itself and transforms between steps ── */
(function () {
  var list = document.querySelector(".why__list");
  var steps = list ? Array.prototype.slice.call(list.querySelectorAll(".wstep")) : [];
  var spin = document.querySelector(".wmorph__spin");
  var icons = spin ? Array.prototype.slice.call(spin.querySelectorAll(".wmorph__icon")) : [];
  if (!spin || steps.length < 2 || icons.length !== steps.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var shown = 0, target = 0, animating = false;
  function face(i) {
    icons.forEach(function (ic, k) { ic.classList.toggle("is-active", k === i); });
  }
  face(0);

  // ONE half-turn on the vertical axis per step change: the incoming face is swapped in
  // edge-on (at 90° the flat visual is invisible), pre-counter-rotated 180° so it lands
  // front-facing — reads as "the object turns on itself and transforms".
  function flip() {
    if (animating || target === shown) return;
    if (reduce) { shown = target; face(shown); return; }
    animating = true;
    var next = target;
    var dir = next > shown ? 1 : -1;        // scroll down → spin one way, up → the other
    spin.style.transition = "transform .85s cubic-bezier(.5, .05, .15, 1)";
    void spin.offsetWidth;                  // commit the transition before the transform
    spin.style.transform = "rotateY(" + dir * 180 + "deg)";
    setTimeout(function () {
      icons[next].style.transform = "rotateY(180deg)";  // counter-rotate the incoming face
      face(next);
    }, 425);
    var fired = false;
    var done = function () {
      if (fired) return;
      fired = true;
      spin.removeEventListener("transitionend", done);
      // (spin 180° + face 180°) is visually identical to (0 + 0) → invisible reset
      spin.style.transition = "none";
      spin.style.transform = "rotateY(0deg)";
      icons[next].style.transform = "";
      shown = next;
      requestAnimationFrame(function () { requestAnimationFrame(function () { animating = false; flip(); }); });
    };
    spin.addEventListener("transitionend", done);
    setTimeout(done, 1000);                 // safety: transitionend can be missed in hidden tabs
  }

  var ticking = false;
  function update() {
    ticking = false;
    var mid = (window.innerHeight || document.documentElement.clientHeight) / 2;
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < steps.length; i++) {
      var r = steps[i].getBoundingClientRect();
      var c = r.top + r.height / 2;
      var d = Math.abs(c - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    target = best;
    flip();
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(update); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", update);   // re-detect once images/layout settle
  update();
})();


/* ── Sprawl : animation scroll-driven (fil → nœuds) ─────────────────
   La section .sprawl démarre avec un fil simple horizontal. Quand
   30% de sa hauteur est visible, on lui ajoute .is-tangled et les
   nœuds + icônes + bulles se forment en cascade via les transitions
   CSS. Une fois activée, on ne la retire pas — pas de "défaire" au
   re-scroll up, c'est plus propre que ce yo-yo. */
(function () {
  var sprawl = document.querySelector(".sprawl");
  if (!sprawl) return;
  /* La section est révélée immédiatement (nœuds, icônes, bulles visibles
     dès le rendu) — pas d'attente de scroll. Les transitions CSS jouent
     quand même au load, donc on garde l'effet "ça se forme" sans
     dépendre du scroll. */
  requestAnimationFrame(function () {
    sprawl.classList.add("is-tangled");
  });
})();


/* ── Centra : tabs métiers freelance — swap titre/texte/quote au clic ─ */
(function () {
  var section = document.querySelector(".centra");
  if (!section) return;
  var tabs = Array.prototype.slice.call(section.querySelectorAll(".ctab"));
  if (!tabs.length) return;

  // Couleurs par persona — background gradient + text ink
  var PALETTE = {
    designer: { color: "#DF2153", colorDark: "#8f0e30", ink: "#fff" },
    dev:      { color: "#191542", colorDark: "#0a0725", ink: "#fff" },
    nocode:   { color: "#621040", colorDark: "#3a0824", ink: "#fff" },
    data:     { color: "#99C5CD", colorDark: "#6ba1ab", ink: "#0f1420" },
    growth:   { color: "#EFDAC7", colorDark: "#c8a882", ink: "#3d2a18" },
  };

  // Contenu par persona — clé = data-tab, valeurs = textes à injecter
  var DATA = {
    designer: {
      shot: "shot-tasks.png",
      role: "designer",
      title: "Des retours clients enfin exploitables.",
      text: "Tes clients commentent sur Figma, t'écrivent sur WhatsApp, valident en visio puis ajoutent un détail par mail. Freescale rassemble les feedbacks, repère les vraies décisions et transforme les retours dispersés en prochaines actions claires.",
      clientBrand: "Maison Oria",
      metric: "+3 h récupérées",
      metricSub: "par semaine sur la consolidation des retours",
      quote: "« Avant Freescale, je passais mes fins de journée à relire Figma, WhatsApp et mes mails pour être sûre de ne rien oublier. Maintenant, les prochaines actions ressortent toutes seules. »",
      quoteInitials: "CD",
      quoteName: "Camille D.",
      quoteRole: "Product Designer freelance",
    },
    dev: {
      shot: "shot-inbox.png",
      role: "développeur·se",
      title: "Code plus, coordonne moins.",
      text: "Entre Slack, GitHub, Notion, les mails et les tickets, les demandes clients se mélangent vite. Freescale regroupe les échanges, repère les bugs, les validations et les blocages, puis t'aide à garder le fil sans couper ta concentration.",
      clientBrand: "Studio Nova",
      metric: "+2,5 h récupérées",
      metricSub: "par semaine sur le suivi client et les relances",
      quote: "« Mon problème, ce n'était pas d'avoir une to-do list. C'était de retrouver les bons retours clients entre GitHub, Slack et mes mails. Freescale me remet le contexte au bon endroit. »",
      quoteInitials: "AR",
      quoteName: "Alex R.",
      quoteRole: "Développeur full-stack freelance",
    },
    nocode: {
      shot: "shot-calendar.png",
      role: "no-code builder",
      title: "Chaque workflow garde son fil.",
      text: "Tes projets avancent entre Make, Zapier, Airtable, Notion ou HubSpot, avec beaucoup d'accès, de tests et de validations à suivre. Freescale repère ce qui manque, ce qui bloque et ce qu'il faut relancer avant que le projet ne ralentisse.",
      clientBrand: "Ops Factory",
      metric: "+3 h récupérées",
      metricSub: "par semaine sur les tests, validations et relances d'accès",
      quote: "« Dans mes missions, il y a toujours dix petites choses à ne pas oublier : un accès, un test, une validation, une relance. Freescale m'aide à garder tout ça propre. »",
      quoteInitials: "SL",
      quoteName: "Sarah L.",
      quoteRole: "No-code Builder freelance",
    },
    data: {
      shot: "shot-analytics.png",
      role: "data analyst",
      title: "Des demandes data mieux cadrées.",
      text: "Tes clients demandent un dashboard, une analyse ou « des chiffres », mais les objectifs, les exports et les accès ne sont pas toujours clairs. Freescale centralise les demandes, suit les informations manquantes et t'aide à transformer les besoins flous en actions concrètes.",
      clientBrand: "Retail Lab",
      metric: "+2 h récupérées",
      metricSub: "par semaine sur le cadrage et la collecte d'informations",
      quote: "« Je perdais beaucoup de temps à courir après les bons exports, les bons accès et la vraie question business derrière la demande. Freescale m'aide à cadrer plus vite. »",
      quoteInitials: "YM",
      quoteName: "Yanis M.",
      quoteRole: "Data Analyst freelance",
    },
    growth: {
      shot: "shot-clients.png",
      role: "growth",
      title: "Tes recommandations ne restent plus en attente.",
      text: "Entre audits, campagnes, contenus, reportings et optimisations, les actions client s'accumulent vite. Freescale rassemble les échanges, suit les décisions, repère les recommandations en attente et t'aide à relancer au bon moment.",
      clientBrand: "Scale Studio",
      metric: "+2,5 h récupérées",
      metricSub: "par semaine sur le reporting, les suivis et les relances",
      quote: "« J'avais des recommandations validées dans un mail, des retours dans Notion et des deadlines dans mon agenda. Freescale me donne une vue claire de ce qui doit avancer. »",
      quoteInitials: "LB",
      quoteName: "Lina B.",
      quoteRole: "Consultante Growth freelance",
    },
  };

  var swapTimer = null;
  function setTab(key) {
    var d = DATA[key];
    if (!d) return;
    /* 1. Tab actif + palette : instantané (les CSS transitions du fond gèrent le fade). */
    tabs.forEach(function (t) {
      var on = t.dataset.tab === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    var p = PALETTE[key];
    if (p) {
      section.style.setProperty("--persona-color", p.color);
      section.style.setProperty("--persona-color-dark", p.colorDark);
      section.style.setProperty("--persona-ink", p.ink);
    }
    /* 2. Contenu (texte + image) : fade out → swap → fade in. */
    section.classList.add("is-swapping");
    if (swapTimer) clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      section.querySelectorAll("[data-fill]").forEach(function (el) {
        var k = el.getAttribute("data-fill");
        if (k in d) el.textContent = d[k];
      });
      section.querySelectorAll("[data-fill-src]").forEach(function (el) {
        var k = el.getAttribute("data-fill-src");
        if (k in d) el.setAttribute("src", "/home/assets/" + d[k]);
      });
      section.classList.remove("is-swapping");
    }, 200);
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { setTab(t.dataset.tab); });
  });
  /* Applique la palette Designer au chargement (le tab is-active dans le HTML). */
  setTab("designer");
})();


/* ── Sprawl knot drawing : scroll-driven via --knot-offset.
   La CSS définit stroke-dashoffset: var(--knot-offset, 6000). Le JS
   met à jour cette var en fonction de la position de scroll dans la
   section. De 6000 (invisible) à 0 (entièrement dessiné). */
/* Path drawing : scroll-driven. À chaque frame, on calcule la position
   relative de .sprawl dans le viewport et on met à jour stroke-dashoffset
   sur chaque path du nœud. De 6000 (invisible) à 0 (entièrement dessiné). */
(function () {
  var sprawl = document.querySelector(".sprawl");
  if (!sprawl) return;
  console.log("[knot draw] init step-class");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { sprawl.classList.add("p100"); return; }
  /* 40 paliers (2.5%) pour une transition très smooth */
  var lastClass = "";
  var ticking = false;
  function apply() {
    ticking = false;
    var rect = sprawl.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    /* Plage : commence quand le haut de sprawl est à 30% du viewport
       (section bien plus visible), termine quand son haut a dépassé
       le top de 50% (sprawl bien remontée). */
    var raw = (vh * 0.3 - rect.top) / (vh * 0.8);
    var p = Math.max(0, Math.min(1, raw));
    /* Arrondi au palier 2.5% le plus proche → 40 paliers possibles.
       On utilise Math.floor pour avoir des pas entiers : 0, 2, 5, 7, 10, 12, ... */
    var step = Math.round(p * 40);
    var pct = Math.floor(step * 2.5);
    var cls = pct > 0 ? "p" + pct : "";
    if (cls !== lastClass) {
      if (lastClass) sprawl.classList.remove(lastClass);
      if (cls) sprawl.classList.add(cls);
      lastClass = cls;
    }
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(apply); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", apply);
  window.addEventListener("load", apply);
  apply();
})();

/* ── Reach : anime --reach-p (0 → 1) au fil du scroll dans la section.
   Utilise le sticky stage : progrès = distance scrollée dans la section /
   hauteur "utile" (section.height - viewport.height). */
(function () {
  var reach = document.querySelector(".reach");
  if (!reach) return;
  var ticking = false;
  function apply() {
    var rect = reach.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    /* Départ AVANT que la section colle : p = 0 quand rect.top est à 80% du viewport
       (section déjà 20% visible en bas de l'écran) → l'anim démarre pendant l'entrée.
       Fin de l'anim quand on a scrollé la moitié de la zone sticky → hands jointes
       avant la fin de la section, elles restent scellées le temps du scroll restant. */
    /* Course : démarre à l'entrée (top à 80% VH), finit tôt (à 25% du sticky)
       pour éviter le vide après l'animation. */
    var startAt = vh * 0.8;
    var endAt = -(rect.height - vh) * 0.55;
    var range = startAt - endAt;
    var raw = Math.max(0, Math.min(1, (startAt - rect.top) / Math.max(range, 1)));
    /* Smootherstep (quintique Hermite) : accélération + décélération douces
       aux deux extrémités → animation ultra-fluide, sans à-coups. */
    var p = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
    reach.style.setProperty("--reach-p", p.toFixed(3));
    ticking = false;
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(apply); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", apply);
  window.addEventListener("load", apply);
  apply();
})();

/* ── Teams : les vidéos témoignage jouent au hover, se remettent à zéro
   quand on quitte. Support touch : play au tap, pause au tap suivant. */
(function () {
  var cards = document.querySelectorAll(".tvid");
  if (!cards.length) return;
  cards.forEach(function (card) {
    var video = card.querySelector(".tvid__video");
    if (!video) return;
    /* Frame de preview : on force à t=0 sans jouer */
    video.pause();
    var playing = false;
    function play() {
      if (playing) return;
      var p = video.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
      playing = true;
    }
    function pause() {
      if (!playing) return;
      video.pause();
      video.currentTime = 0;
      playing = false;
    }
    card.addEventListener("mouseenter", play);
    card.addEventListener("mouseleave", pause);
    card.addEventListener("focusin", play);
    card.addEventListener("focusout", pause);
    /* Touch : premier tap = play, tap suivant = pause */
    card.addEventListener("touchstart", function () {
      if (playing) pause(); else play();
    }, { passive: true });
  });
})();

/* ── Darkblock : le wrapper qui contient Anywhere + Reach démarre avec
   des marges latérales + bord arrondi, puis s'étend en pleine largeur
   au fil du scroll. On pilote --dark-p (0 → 1). */
(function () {
  var block = document.querySelector(".darkblock");
  if (!block) return;
  var ticking = false;
  function apply() {
    var rect = block.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    /* ── Phase ENTRÉE (basée sur rect.top) : 0 → 1 quand la section arrive ──
       p_in = 0 quand rect.top est encore à 50% du viewport
       p_in = 1 quand rect.top a dépassé -20% du viewport (bien engagé). */
    var inStart = vh * 0.9;   /* démarre plus tôt : le grow commence dès que le haut du bloc entre par le bas du viewport */
    var inEnd   = vh * -0.2;
    var pIn = Math.max(0, Math.min(1, (inStart - rect.top) / Math.max(inStart - inEnd, 1)));
    /* ── Phase SORTIE (basée sur rect.bottom) : 1 → 0 quand on quitte ──
       p_out = 1 tant que le bas du bloc est encore bien sous le viewport
       p_out = 0 quand le bas du bloc approche du haut du viewport. */
    var outStart = vh * 0.5;                              /* rétrécissement démarre quand le bas est déjà à 50% du viewport */
    var outEnd   = vh * -0.1;                             /* redevient bordée quand le bas est juste au-dessus du haut */
    var pOut = Math.max(0, Math.min(1, (rect.bottom - outEnd) / Math.max(outStart - outEnd, 1)));
    /* Résultat : min des deux → pleine largeur uniquement au milieu du scroll. */
    var p = Math.min(pIn, pOut);
    block.style.setProperty("--dark-p", p.toFixed(3));
    /* Progression de sortie (0 tant qu'on est dans la section, 1 en fin de sortie)
       → sert à faire virer le halo #f4f5f9 → #fff sur la deuxième moitié. */
    block.style.setProperty("--dark-exit-p", (1 - pOut).toFixed(3));
    ticking = false;
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(apply); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", apply);
  window.addEventListener("load", apply);
  apply();
})();

/* ── Agents : clic sur une catégorie à gauche → swap l'image à droite
   + les 3 tags flottants au-dessus. Similaire à la logique Centra. */
(function () {
  var section = document.querySelector(".agents");
  if (!section) return;
  var items = Array.prototype.slice.call(section.querySelectorAll(".agent"));
  var shot = section.querySelector(".agents__shot");
  var demo = section.querySelector(".agents__demo");
  if (!items.length || !shot || !demo) return;
  var tagEls = [
    section.querySelector(".agents__tag--1"),
    section.querySelector(".agents__tag--2"),
    section.querySelector(".agents__tag--3"),
  ];
  var txtEls = tagEls.map(function (t) { return t ? t.querySelector(".agents__tag-txt") : null; });

  /* Contenu + position des 3 pins par persona/agent. Position = {top, left,
     right, bottom} (strings CSS ; les non-définis sont retirés). */
  var TAGS = {
    /* 1 · Vos messages triés avant vous — Brief + priorisation */
    "shot-inbox.png": [
      { txt: "Brief : ce qui compte aujourd'hui", pos: { top: "-14px", left: "-30px" } },
      { txt: "22 messages · 19 à traiter",         pos: { top: "44%",   left: "-50px" } },
      { txt: "Priorisation par urgence",           pos: { bottom: "12%", left: "30%" } },
    ],
    /* 2 · Répondez en un clic — brouillon dans votre ton */
    "shot-analytics.png": [
      { txt: "Brouillon prêt en 2 secondes",       pos: { top: "-18px", left: "18%" } },
      { txt: "Style appris sur vos 200 derniers envois", pos: { top: "34%", right: "-50px" } },
      { txt: "Un clic pour envoyer",               pos: { bottom: "10%", left: "-30px" } },
    ],
    /* 3 · Vos fils convertis en to-do — extraction de tâches */
    "shot-tasks.png": [
      { txt: "Tâches extraites automatiquement",   pos: { top: "4%",  left: "32%" } },
      { txt: "Priorité détectée",                  pos: { top: "40%", right: "-40px" } },
      { txt: "Deadline lue dans le message",       pos: { bottom: "22%", left: "-20px" } },
    ],
    /* 4 · Aucun silence ne passe — relances automatiques */
    "shot-clients.png": [
      { txt: "Silence de 12 jours détecté",        pos: { top: "6%",  right: "-40px" } },
      { txt: "Relance suggérée aujourd'hui",       pos: { top: "42%", left:  "-60px" } },
      { txt: "Score de santé de la relation",      pos: { bottom: "16%", left: "22%" } },
    ],
    /* 5 · Ask Mue — historique interrogeable */
    "shot-calendar.png": [
      { txt: "Ask Mue : votre historique interrogeable", pos: { top: "-18px", right: "18%" } },
      { txt: "Réponse sourcée (emails cités)",     pos: { top: "52%",   left: "-40px" } },
      { txt: "Résumé en 3 puces",                  pos: { bottom: "6%", left: "42%" } },
    ],
  };

  function applyPos(el, pos) {
    if (!el) return;
    /* Un seul côté par axe pour ne pas stretcher le pin.
       On force "auto" sur l'axe opposé pour surcharger les valeurs CSS
       (.agents__tag--1/2/3 fixent des left/top par défaut). */
    if (pos.left !== undefined) { el.style.left = pos.left; el.style.right = "auto"; }
    else if (pos.right !== undefined) { el.style.right = pos.right; el.style.left = "auto"; }
    if (pos.top !== undefined) { el.style.top = pos.top; el.style.bottom = "auto"; }
    else if (pos.bottom !== undefined) { el.style.bottom = pos.bottom; el.style.top = "auto"; }
  }

  var swapTimer = null;
  function setAgent(target) {
    if (target.classList.contains("is-active")) return;
    items.forEach(function (it) { it.classList.remove("is-active"); });
    target.classList.add("is-active");
    var next = target.getAttribute("data-shot");
    if (!next) return;
    demo.classList.add("is-swapping");
    if (swapTimer) clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      shot.setAttribute("src", "/home/assets/" + next);
      var pins = TAGS[next];
      if (pins) {
        pins.forEach(function (pin, i) {
          if (txtEls[i]) txtEls[i].textContent = pin.txt;
          applyPos(tagEls[i], pin.pos);
        });
      }
      demo.classList.remove("is-swapping");
    }, 180);
  }

  items.forEach(function (it) {
    it.addEventListener("click", function () { setAgent(it); });
    it.setAttribute("tabindex", "0");
    it.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAgent(it); }
    });
  });
})();

/* ── Anywhere : même reveal word-by-word que Statement, mais l'animation
   se pose en BLANC (fond noir du darkblock). */
(function () {
  var section = document.querySelector(".anywhere");
  if (!section) return;
  var textEl = section.querySelector(".anywhere__title");
  if (!textEl) return;

  var spans = [];
  (function () {
    var nodes = Array.prototype.slice.call(textEl.childNodes);
    textEl.textContent = "";
    nodes.forEach(function (node) {
      var serif = node.nodeType === 1;                                 // <em> → serif italique
      node.textContent.split(/(\s+)/).forEach(function (chunk) {
        if (chunk === "") return;
        if (/^\s+$/.test(chunk)) { textEl.appendChild(document.createTextNode(chunk)); return; }
        var s = document.createElement("span");
        s.className = "anywhere__word" + (serif ? " anywhere__word--serif" : "");
        s.textContent = chunk;
        textEl.appendChild(s);
        spans.push(s);
      });
    });
  })();

  function assignLineDelays() {
    var STAGGER = 0.07, GAP = 0.42;
    var base = 0, wi = 0, lineTop = null;
    spans.forEach(function (s) {
      var top = s.offsetTop;
      if (lineTop === null) lineTop = top;
      else if (Math.abs(top - lineTop) > 12) {
        base += Math.max(0, wi - 1) * STAGGER + GAP;
        lineTop = top; wi = 0;
      }
      s.style.setProperty("--d", (base + wi * STAGGER).toFixed(3) + "s");
      wi++;
    });
  }
  function sliceGradient() {
    var tw = textEl.clientWidth, th = textEl.clientHeight;
    spans.forEach(function (s) {
      s.style.backgroundSize = tw + "px " + th + "px";
      s.style.backgroundPosition = (-s.offsetLeft) + "px " + (-s.offsetTop) + "px";
    });
    assignLineDelays();
  }
  sliceGradient();
  window.addEventListener("resize", sliceGradient);
  window.addEventListener("load", sliceGradient);

  /* Rejoue l'animation à chaque entrée dans le viewport (contrairement au
     Statement qui ne joue qu'une fois). */
  var currentlyIn = false;
  function maybePlay() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var inView = (rect.top < vh && rect.bottom > 0);
    if (inView && !currentlyIn) {
      currentlyIn = true;
      section.classList.remove("is-in");
      void section.offsetWidth;                              /* force reflow → l'animation restart */
      section.classList.add("is-in");
    } else if (!inView && currentlyIn) {
      currentlyIn = false;
      section.classList.remove("is-in");                    /* reset : les mots reprennent leur état initial */
    }
  }
  window.addEventListener("scroll", maybePlay, { passive: true });
  window.addEventListener("resize", maybePlay);
  maybePlay();
})();

/* ── Kickoff : même reveal word-by-word que Anywhere (fond noir, gradient sweep → blanc). */
(function () {
  var section = document.querySelector(".kickoff");
  if (!section) return;
  var textEl = section.querySelector(".kickoff__title");
  if (!textEl) return;

  var spans = [];
  (function () {
    var nodes = Array.prototype.slice.call(textEl.childNodes);
    textEl.textContent = "";
    nodes.forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "BR") { textEl.appendChild(node); return; }
      var serif = node.nodeType === 1;
      var txt = node.textContent;
      txt.split(/(\s+)/).forEach(function (chunk) {
        if (chunk === "") return;
        if (/^\s+$/.test(chunk)) { textEl.appendChild(document.createTextNode(chunk)); return; }
        var s = document.createElement("span");
        s.className = "kickoff__word" + (serif ? " kickoff__word--serif" : "");
        s.textContent = chunk;
        textEl.appendChild(s);
        spans.push(s);
      });
    });
  })();

  function assignLineDelays() {
    var STAGGER = 0.07, GAP = 0.42;
    var base = 0, wi = 0, lineTop = null;
    spans.forEach(function (s) {
      var top = s.offsetTop;
      if (lineTop === null) lineTop = top;
      else if (Math.abs(top - lineTop) > 12) {
        base += Math.max(0, wi - 1) * STAGGER + GAP;
        lineTop = top; wi = 0;
      }
      s.style.setProperty("--d", (base + wi * STAGGER).toFixed(3) + "s");
      wi++;
    });
  }
  function sliceGradient() {
    var tw = textEl.clientWidth, th = textEl.clientHeight;
    spans.forEach(function (s) {
      s.style.backgroundSize = tw + "px " + th + "px";
      s.style.backgroundPosition = (-s.offsetLeft) + "px " + (-s.offsetTop) + "px";
    });
    assignLineDelays();
  }
  sliceGradient();
  window.addEventListener("resize", sliceGradient);
  window.addEventListener("load", sliceGradient);

  var currentlyIn = false;
  function maybePlay() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var inView = (rect.top < vh && rect.bottom > 0);
    if (inView && !currentlyIn) {
      currentlyIn = true;
      section.classList.remove("is-in");
      void section.offsetWidth;
      section.classList.add("is-in");
    } else if (!inView && currentlyIn) {
      currentlyIn = false;
      section.classList.remove("is-in");
    }
  }
  window.addEventListener("scroll", maybePlay, { passive: true });
  window.addEventListener("resize", maybePlay);
  maybePlay();
})();

/* ── Feature fade : la section sticky sous le hero s'estompe au scroll
   pour révéler la section Sprawl derrière elle. --feature-fade (1 → 0). */
(function () {
  var feature = document.querySelector(".feature");
  var sprawl = document.querySelector(".sprawl");
  if (!feature || !sprawl) return;
  var ticking = false;
  function apply() {
    var rect = feature.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    /* Feature reste opaque tant que son bas est bien en-dessous du viewport.
       Elle commence à s'estomper quand son bas remonte, et disparaît quand
       son bas passe en dessous du top du viewport. */
    var startAt = vh * 0.9;                              /* bottom à 90% viewport → début du fondu */
    var endAt = vh * 0.1;                                /* bottom à 10% viewport → complètement disparue */
    var raw = (startAt - rect.bottom) / Math.max(startAt - endAt, 1);
    var p = Math.max(0, Math.min(1, raw));
    feature.style.setProperty("--feature-fade", (1 - p).toFixed(3));
    ticking = false;
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(apply); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", apply);
  window.addEventListener("load", apply);
  apply();
})();

/* ── Feature parallax : le titre monte plus vite que le scroll, le mockup
   monte plus lentement → effet de profondeur foreground/background. */
(function () {
  var feature = document.querySelector(".feature");
  if (!feature) return;
  var head = feature.querySelector(".feature__head");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  var ticking = false;
  function apply() {
    ticking = false;
    if (window.innerWidth < 900) {
      if (head) head.style.transform = "";
      return;
    }
    var rect = feature.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    /* progression 0→1 pendant que Feature traverse le viewport */
    var p = Math.max(0, Math.min(1, (vh - rect.top) / (rect.height + vh)));
    /* Titre : translate vers le HAUT à 40% de plus que le scroll → apparaît plus vite */
    if (head) head.style.transform = "translateY(" + (-p * 60).toFixed(1) + "px)";
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(apply); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", apply);
  window.addEventListener("load", apply);
  apply();
})();

/* ── Impactful : reveal word-by-word (même mécanique qu'Anywhere).
   Rejoue à chaque entrée dans le viewport. */
(function () {
  var section = document.querySelector(".impactful");
  if (!section) return;
  var textEl = section.querySelector(".impactful__title");
  if (!textEl) return;

  var spans = [];
  (function () {
    var nodes = Array.prototype.slice.call(textEl.childNodes);
    textEl.textContent = "";
    nodes.forEach(function (node) {
      var serif = node.nodeType === 1;                                 // <em> → serif italique
      node.textContent.split(/(\s+)/).forEach(function (chunk) {
        if (chunk === "") return;
        if (/^\s+$/.test(chunk)) { textEl.appendChild(document.createTextNode(chunk)); return; }
        var s = document.createElement("span");
        s.className = "impactful__word" + (serif ? " impactful__word--serif" : "");
        s.textContent = chunk;
        textEl.appendChild(s);
        spans.push(s);
      });
    });
  })();

  function assignLineDelays() {
    var STAGGER = 0.07, GAP = 0.42;
    var base = 0, wi = 0, lineTop = null;
    spans.forEach(function (s) {
      var top = s.offsetTop;
      if (lineTop === null) lineTop = top;
      else if (Math.abs(top - lineTop) > 12) {
        base += Math.max(0, wi - 1) * STAGGER + GAP;
        lineTop = top; wi = 0;
      }
      s.style.setProperty("--d", (base + wi * STAGGER).toFixed(3) + "s");
      wi++;
    });
  }
  function sliceGradient() {
    var tw = textEl.clientWidth, th = textEl.clientHeight;
    spans.forEach(function (s) {
      s.style.backgroundSize = tw + "px " + th + "px";
      s.style.backgroundPosition = (-s.offsetLeft) + "px " + (-s.offsetTop) + "px";
    });
    assignLineDelays();
  }
  sliceGradient();
  window.addEventListener("resize", sliceGradient);
  window.addEventListener("load", sliceGradient);

  var currentlyIn = false;
  function maybePlay() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var inView = (rect.top < vh && rect.bottom > 0);
    if (inView && !currentlyIn) {
      currentlyIn = true;
      section.classList.remove("is-in");
      void section.offsetWidth;
      section.classList.add("is-in");
    } else if (!inView && currentlyIn) {
      currentlyIn = false;
      section.classList.remove("is-in");
    }
  }
  window.addEventListener("scroll", maybePlay, { passive: true });
  window.addEventListener("resize", maybePlay);
  maybePlay();
})();

/* ── Hero blur → sharp au scroll : hero pinné pendant que le flou se dissipe ── */
(function () {
  var hero = document.querySelector(".fxhero, .hero");
  if (!hero) return;
  var wrap = document.querySelector(".fxhero-scroll");           // wrapper qui donne la hauteur de scroll
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { hero.style.setProperty("--hb", "0"); return; }

  var raf = 0;
  function update() {
    raf = 0;
    var vh = window.innerHeight;
    var y = window.scrollY || window.pageYOffset || 0;
    var t;
    if (wrap) {
      var wrapTop = wrap.getBoundingClientRect().top + y;
      var wrapH = wrap.offsetHeight;
      // Progression : 0 quand wrap arrive en haut, 1 quand on a scrollé (wrapH - vh) c-à-d fin du pin
      // On termine le flou dans les 65 premiers % du pin pour laisser du temps net avant que ça défile.
      var pinRange = Math.max(1, wrapH - vh);
      var scrolled = Math.max(0, y - wrapTop);
      var raw = scrolled / pinRange;                             // 0..1 sur toute la durée pinnée
      t = Math.min(1, raw / 0.55);                               // le flou finit à 55% du pin
    } else {
      t = Math.min(1, Math.max(0, y / (vh * 0.55)));
    }
    var eased = 1 - Math.pow(1 - t, 1.8);                        // ease-out
    hero.style.setProperty("--hb", (1 - eased).toFixed(3));
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();

/* ── Reveal animations : sections/grids révélées quand elles entrent dans la viewport ── */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  // Cible : sections/grids qui déclenchent leur stagger interne
  var targets = document.querySelectorAll([
    ".fx-steps__grid",
    ".fx-split",
    ".fx-compare__grid",
    ".fx-testi__grid",
    ".fx-privacy__grid",
    ".fx-pricing__grid",
    ".fx-faq__grid",
    ".fxbridge",
    ".agents",
    ".reach",
    ".kickoff"
  ].join(","));

  if (!targets.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("fx-reveal");
        io.unobserve(e.target);
      }
    });
  }, {
    threshold: 0.12,                             // se déclenche quand 12% du bloc est visible
    rootMargin: "0px 0px -8% 0px"                // avec un tout petit offset : arrive juste avant le milieu du viewport
  });

  targets.forEach(function (el) { io.observe(el); });
})();

/* ═════════════════════════════════════════════════════════════════════════
   ANIMATIONS CONTEMPORAINES : tilt 3D, word-split reveals, parallax hero
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // ── 1) TILT 3D sur les cards au mouvement souris ─────────────────────────
  var tiltSelectors = [
    ".fx-step", ".fx-comp-card", ".fx-t-card", ".fx-pt", ".fx-faq__item"
  ].join(",");
  document.querySelectorAll(tiltSelectors).forEach(function (el) {
    el.setAttribute("data-tilt", "");
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var cx = (e.clientX - r.left) / r.width - 0.5;         // -0.5..0.5
      var cy = (e.clientY - r.top) / r.height - 0.5;
      var rx = (cy * -8).toFixed(2) + "deg";                 // max ±8°
      var ry = (cx * 10).toFixed(2) + "deg";                 // max ±10°
      el.style.setProperty("--tx", rx);
      el.style.setProperty("--ty", ry);
    });
    el.addEventListener("mouseleave", function () {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    });
  });

  // ── 2) WORD-SPLIT reveal pour les H2 principaux ──────────────────────────
  var titleSelectors = ".fx-h2, .fxbridge__title, .fx-final__title";
  document.querySelectorAll(titleSelectors).forEach(function (h) {
    if (h.dataset.split) return;
    h.dataset.split = "1";
    // Split par mots mais respecte les <em>, <strong>, <span> déjà présents
    var walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null);
    var texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(function (tn) {
      var frag = document.createDocumentFragment();
      var words = tn.nodeValue.split(/(\s+)/);
      words.forEach(function (w) {
        if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
        var span = document.createElement("span");
        span.className = "fx-word";
        span.textContent = w;
        frag.appendChild(span);
      });
      tn.parentNode.replaceChild(frag, tn);
    });
    // Delay staggered par mot
    h.querySelectorAll(".fx-word").forEach(function (w, i) {
      w.style.transitionDelay = (i * 60) + "ms";
    });
  });

  // IntersectionObserver pour révéler les titres split
  if ("IntersectionObserver" in window) {
    var titleIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("fx-reveal-text");
          titleIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll(titleSelectors).forEach(function (h) { titleIO.observe(h); });
  }

  // ── 3) PARALLAX subtil : hero__woman se déplace verticalement au scroll ──
  var woman = document.querySelector(".hero__woman");
  if (woman) {
    var rafP = 0;
    function updP() {
      rafP = 0;
      var y = window.scrollY || 0;
      var vh = window.innerHeight;
      var p = Math.max(-1, Math.min(1, y / vh));
      woman.style.setProperty("--pfx", p.toFixed(3));
    }
    updP();
    window.addEventListener("scroll", function () { if (!rafP) rafP = requestAnimationFrame(updP); }, { passive: true });
  }
})();

/* ── ORB SECTION : scroll-driven, mains qui convergent + boule qui naît ── */
(function () {
  var wrap = document.querySelector(".orb-scroll");
  var orb  = document.querySelector(".orb");
  if (!wrap || !orb) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { orb.style.setProperty("--op", "1"); return; }

  var raf = 0;
  function update() {
    raf = 0;
    var vh = window.innerHeight;
    var y = window.scrollY || 0;
    var top = wrap.getBoundingClientRect().top + y;
    var h = wrap.offsetHeight;
    var pinRange = Math.max(1, h - vh);
    var scrolled = Math.max(0, y - top);
    var raw = scrolled / pinRange;                   // 0..1 sur toute la zone pinnée
    // On termine la convergence à 75% du pin pour laisser du temps de contemplation à la fin
    var t = Math.min(1, Math.max(0, raw / 0.75));
    // Ease-in-out pour un mouvement plus organique
    var eased = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    orb.style.setProperty("--op", eased.toFixed(3));
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();

/* ============================================================
   Parallax léger sur cards + images (pas sur les textes).
   Chaque élément se translate en Y en fonction de sa position dans le
   viewport, à vitesse < scroll. Effet doux (±14 px max) via rAF.
   ============================================================ */
(function initVisualParallax(){
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var selectors = [
    ".fx-shot",
    ".fx-viz-dash",
    ".fx-viz-spaces",
    ".hero__woman",
    ".feature__icon"
  ];
  var els = Array.prototype.slice.call(document.querySelectorAll(selectors.join(",")));
  if (!els.length) return;
  var MAX = 14;                                    /* amplitude max en px (léger) */
  var SPEED = 0.08;                                /* facteur de parallax */
  var ticking = false;
  function paint(){
    var vh = window.innerHeight || 800;
    var mid = vh / 2;
    for (var i = 0; i < els.length; i++){
      var el = els[i];
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) {
        /* Reset transform quand l'élément quitte le viewport → évite que
           d'anciens offsets restent bloqués et créent des bugs de scroll. */
        if (el.style.transform) el.style.transform = "";
        continue;
      }
      var elMid = rect.top + rect.height / 2;
      var delta = (mid - elMid) * SPEED;
      if (delta > MAX) delta = MAX;
      else if (delta < -MAX) delta = -MAX;
      el.style.transform = "translate3d(0," + delta.toFixed(2) + "px,0)";
    }
    ticking = false;
  }
  function onScroll(){ if (ticking) return; ticking = true; requestAnimationFrame(paint); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  paint();
})();

/* ============================================================
   FEATURE VIDEO — click play button to launch demo video
   ============================================================ */
(function initFeatureVideo(){
  var container = document.querySelector(".inbox--shot");
  if (!container) return;
  var btn = container.querySelector(".inbox__play");
  var video = container.querySelector(".inbox__video");
  if (!btn || !video) return;
  btn.addEventListener("click", function(){
    container.classList.add("is-playing");
    var screen = container.closest(".screen");
    if (screen) screen.classList.add("is-playing");
    document.body.classList.add("is-video-playing");
    var dock = document.querySelector(".dock");
    if (dock) dock.style.display = "none";
    video.muted = false;
    video.controls = true;
    var p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(function(){
        video.muted = true;
        video.play();
      });
    }
  });
})();

/* ============================================================
   COOKIE CONSENT BANNER — RGPD-compatible, léger, sans tracker
   ============================================================ */
(function initCookieConsent(){
  var KEY = 'freescale_cookie_consent';
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch(e) {}
  if (stored === 'accepted' || stored === 'refused') return;

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = [
    /* ancré en bas à gauche, compact, avec bordure gradient Free Horizon */
    '.cc-banner{position:fixed;bottom:24px;left:24px;transform:translateY(30px) scale(.98);opacity:0;',
    'width:360px;max-width:calc(100vw - 32px);z-index:9999;color:#14151a;',
    'background:#fff;border-radius:22px;isolation:isolate;',
    'box-shadow:0 24px 60px -20px rgba(20,22,30,.22),0 4px 14px -6px rgba(20,22,30,.08);',
    'font-family:Inter,system-ui,sans-serif;font-size:.86rem;line-height:1.55;',
    'transition:transform .5s cubic-bezier(.22,1,.36,1),opacity .4s ease;pointer-events:none;}',
    '.cc-banner.is-open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto;}',
    /* bordure gradient Free Horizon en padding-box mask */
    '.cc-banner::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;',
    'background:linear-gradient(140deg,rgba(251,163,196,.55),rgba(199,184,246,.55),rgba(169,216,255,.55));',
    '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
    'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
    '-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;z-index:1;}',
    /* halo pastel discret en fond */
    '.cc-banner::after{content:"";position:absolute;top:-30%;right:-15%;width:220px;height:220px;',
    'border-radius:50%;background:radial-gradient(circle,rgba(251,163,196,.14) 0%,transparent 65%);',
    'pointer-events:none;z-index:0;}',
    '.cc-banner__body{position:relative;z-index:2;padding:22px 22px 18px;display:flex;flex-direction:column;gap:16px;}',
    '.cc-banner__head{display:flex;align-items:center;gap:12px;}',
    /* icône bouclier avec bordure gradient */
    '.cc-banner__ic{width:38px;height:38px;border-radius:999px;flex:none;',
    'background:linear-gradient(#fff,#fff) padding-box,var(--cta-grad,linear-gradient(120deg,#FBA3C4 0%,#FFF4C8 33%,#C7B8F6 66%,#A9D8FF 100%)) border-box;',
    'border:1.5px solid transparent;color:#0C1E5A;display:flex;align-items:center;justify-content:center;}',
    '.cc-banner__ic svg{width:18px;height:18px;}',
    '.cc-banner__title{font-family:var(--sans,Inter);font-weight:600;color:#0C1E5A;font-size:.98rem;letter-spacing:-.01em;margin:0;}',
    '.cc-banner__title em{font-family:var(--serif,"Instrument Serif",serif);font-style:italic;font-weight:400;color:#0C1E5A;}',
    '.cc-banner__txt{color:#5b6275;margin:0;font-size:.84rem;line-height:1.55;}',
    '.cc-banner__txt a{color:#1E40FF;text-decoration:underline;text-decoration-color:rgba(30,64,255,.35);text-underline-offset:3px;}',
    '.cc-banner__txt a:hover{text-decoration-color:currentColor;}',
    '.cc-banner__actions{display:flex;gap:8px;}',
    '.cc-banner__btn{flex:1;display:inline-flex;align-items:center;justify-content:center;',
    'padding:11px 16px;border-radius:12px;font-family:inherit;font-weight:600;font-size:.85rem;',
    'letter-spacing:-.005em;cursor:pointer;border:0;text-decoration:none;',
    'transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease,background .2s ease,border-color .2s ease;}',
    '.cc-banner__btn--primary{background:linear-gradient(180deg,#607EF6,#4666EE);color:#fff;',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 3px 10px -4px rgba(70,102,238,.3);}',
    '.cc-banner__btn--primary:hover{transform:scale(1.035);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 6px 16px -4px rgba(70,102,238,.42);}',
    '.cc-banner__btn--ghost{background:#f5f7fb;color:#0C1E5A;border:1px solid rgba(20,22,30,.06);}',
    '.cc-banner__btn--ghost:hover{background:#eef1f7;border-color:rgba(20,22,30,.12);}',
    /* close subtle top-right */
    '.cc-banner__close{position:absolute;top:14px;right:14px;width:26px;height:26px;border-radius:8px;',
    'background:transparent;border:0;cursor:pointer;color:#8b93a4;z-index:3;',
    'display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s;}',
    '.cc-banner__close:hover{background:rgba(20,22,30,.05);color:#0C1E5A;}',
    '.cc-banner__close svg{width:14px;height:14px;}',
    /* responsive */
    '@media (max-width:520px){.cc-banner{bottom:16px;left:16px;right:16px;width:auto;}}',
  ].join('');
  document.head.appendChild(style);

  // Inject HTML
  var banner = document.createElement('div');
  banner.className = 'cc-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Bandeau cookies');
  banner.innerHTML = [
    '<button type="button" class="cc-banner__close" data-cc="refuse" aria-label="Fermer">',
    '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    '</button>',
    '<div class="cc-banner__body">',
    '  <div class="cc-banner__head">',
    '    <span class="cc-banner__ic" aria-hidden="true">',
    '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10c0-.5-.05-1-.14-1.5a3 3 0 0 1-3.86-3.86A10 10 0 0 0 12 2z"/><circle cx="8.5" cy="10.5" r="1" fill="currentColor"/><circle cx="14" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="9" r="1" fill="currentColor"/></svg>',
    '    </span>',
    '    <h3 class="cc-banner__title">Cookies <em>essentiels.</em></h3>',
    '  </div>',
    '  <p class="cc-banner__txt">',
    '    Freescale n\'utilise que des cookies nécessaires au fonctionnement du site. Aucun tracker publicitaire. <a href="/home/confidentialite.html">En savoir plus</a>.',
    '  </p>',
    '  <div class="cc-banner__actions">',
    '    <button type="button" class="cc-banner__btn cc-banner__btn--ghost" data-cc="refuse">Refuser</button>',
    '    <button type="button" class="cc-banner__btn cc-banner__btn--primary" data-cc="accept">Accepter</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(banner);

  requestAnimationFrame(function(){
    banner.classList.add('is-open');
  });

  function close(choice){
    try { localStorage.setItem(KEY, choice); } catch(e) {}
    banner.classList.remove('is-open');
    setTimeout(function(){
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 500);
  }

  banner.querySelector('[data-cc="accept"]').addEventListener('click', function(){ close('accepted'); });
  banner.querySelectorAll('[data-cc="refuse"]').forEach(function(b){
    b.addEventListener('click', function(){ close('refused'); });
  });
})();

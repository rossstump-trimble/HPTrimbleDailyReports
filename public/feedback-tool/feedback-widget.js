(function (global) {
  const DEFAULTS = {
    apiBase: "http://127.0.0.1:8787", hotkey: "b", targetAgent: "composer-2.5-fast",
    icon: "bug", category: "general", title: "Feedback Tool", getCurrentUser: null,
    mount: null, captureScreenshots: true,
    html2canvasSrc: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
  };

  const SVG_H = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"';
  const s = (w, h, b) => `<svg width="${w}" height="${h}" ${SVG_H}>${b}</svg>`;
  const SVG = {
    grip: s(14, 14, '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>'),
    bug: s(16, 16, '<path d="M12 20v-9M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4zM14.12 3.88 16 2M21 21a4 4 0 0 0-3.81-4M21 5a4 4 0 0 1-3.55 3.97M22 13h-4M3 21a4 4 0 0 1 3.81-4M3 5a4 4 0 0 0 3.55 3.97M6 13H2m6-11 1.88 1.88M9 7.13V6a3 3 0 1 1 6 0v1.13"/>'),
    question: s(16, 16, '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>'),
    pointer: s(14, 14, '<path d="m4 4 7.07 17 2.51-7.39L21 11.07z"/>'),
    square: s(14, 14, '<rect x="3" y="3" width="18" height="18" rx="2"/>'),
    x: s(16, 16, '<path d="m18 6-12 12M6 6l12 12"/>'),
    xSm: s(12, 12, '<path d="m18 6-12 12M6 6l12 12"/>'),
    trash: s(16, 16, '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
    send: s(14, 14, '<path d="m22 2-7 20-4-9-9-4z"/>'),
  };

  function cssPath(el) {
    if (!(el instanceof Element)) return "";
    const parts = [];
    let curr = el;
    while (curr && curr.nodeType === 1 && curr !== document.body) {
      let part = curr.tagName.toLowerCase();
      if (curr.id) { parts.unshift(`${part}#${curr.id}`); break; }
      const p = curr.parentElement;
      if (p) {
        const sibs = [...p.children].filter((c) => c.tagName === curr.tagName);
        if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(curr) + 1})`;
      }
      parts.unshift(part);
      curr = curr.parentElement;
    }
    return parts.join(" > ");
  }

  function snippet(el) { return el instanceof Element ? el.outerHTML.slice(0, 2000) : ""; }

  function visibleText(el) {
    if (!(el instanceof Element)) return "";
    return String(el.innerText || el.textContent || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 8000);
  }

  function visibleTextFromRect(rect, excludeRoot) {
    const texts = [], seen = new Set();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const el = document.elementsFromPoint(rect.x + (rect.width * (i + 0.5)) / 4, rect.y + (rect.height * (j + 0.5)) / 4)[0];
        if (!el || !(el instanceof Element) || (excludeRoot && excludeRoot.contains(el)) || el === document.documentElement || el === document.body) continue;
        const t = visibleText(el);
        if (t && t.length >= 2 && !seen.has(t)) { seen.add(t); texts.push(t); }
      }
    }
    return texts.join("\n---\n").slice(0, 8000);
  }

  async function captureScreenshot({ element, rect, html2canvasSrc, hideRoots }) {
    if (typeof global.html2canvas !== "function" && html2canvasSrc) {
      try {
        await new Promise((res, rej) => {
          let s = document.querySelector(`script[data-feedback-capture="${html2canvasSrc}"]`);
          if (!s) {
            s = document.createElement("script"); s.src = html2canvasSrc; s.async = true; s.dataset.feedbackCapture = html2canvasSrc;
            document.head.appendChild(s);
          }
          if (global.html2canvas) res(); else { s.onload = res; s.onerror = rej; }
        });
      } catch {}
    }
    const h2c = typeof global.html2canvas === "function" ? global.html2canvas : null;
    if (!h2c) return null;
    const hidden = (hideRoots || []).filter(Boolean).map((r) => [r, r.style.visibility]);
    hidden.forEach(([r]) => { r.style.visibility = "hidden"; });
    try {
      const scale = Math.min(2, window.devicePixelRatio || 1);
      const canvas = element instanceof Element
        ? await h2c(element, { useCORS: true, allowTaint: true, logging: false, backgroundColor: "#fff", scale })
        : (rect && rect.width >= 8 && rect.height >= 8
          ? await h2c(document.body, { useCORS: true, allowTaint: true, logging: false, backgroundColor: "#fff", scale, x: window.scrollX + rect.x, y: window.scrollY + rect.y, width: rect.width, height: rect.height, windowWidth: document.documentElement.clientWidth, windowHeight: document.documentElement.clientHeight })
          : null);
      return canvas ? canvas.toDataURL("image/png") : null;
    } catch { return null; }
    finally { hidden.forEach(([r, prev]) => { r.style.visibility = prev; }); }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function makeDraggable(el, handle) {
    let dragging = false, offsetX = 0, offsetY = 0, pid = null;
    handle.classList.add("feedback-widget-drag-handle");
    handle.setAttribute("data-drag-handle", "true");
    handle.title = handle.title || "Drag to move";

    handle.addEventListener("pointerdown", (e) => {
      if ((e.button !== 0 && e.pointerType === "mouse") || e.target.closest("button,a,input,textarea,select,label,[data-no-drag]")) return;
      const r = el.getBoundingClientRect();
      dragging = true; pid = e.pointerId;
      offsetX = e.clientX - r.left; offsetY = e.clientY - r.top;
      el.style.left = `${r.left}px`; el.style.top = `${r.top}px`;
      el.style.right = "auto"; el.style.bottom = "auto";
      el.classList.add("is-dragging");
      try { handle.setPointerCapture(pid); } catch {}
      e.preventDefault();
    });

    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const w = el.offsetWidth || 320, h = el.offsetHeight || 200;
      el.style.left = `${Math.min(Math.max(8, global.innerWidth - w - 8), Math.max(8, e.clientX - offsetX))}px`;
      el.style.top = `${Math.min(Math.max(8, global.innerHeight - h - 8), Math.max(8, e.clientY - offsetY))}px`;
    });

    const stop = () => {
      if (!dragging) return;
      dragging = false; el.classList.remove("is-dragging");
      if (pid !== null) { try { handle.releasePointerCapture(pid); } catch {} pid = null; }
    };
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  }

  function clearPos(el) {
    el.style.left = ""; el.style.top = ""; el.style.right = ""; el.style.bottom = "";
    el.classList.remove("is-dragging");
  }

  function placeBox(box, rect) {
    box.style.left = `${rect.left ?? rect.x}px`; box.style.top = `${rect.top ?? rect.y}px`;
    box.style.width = `${rect.width}px`; box.style.height = `${rect.height}px`;
  }

  let activeInstance = null;

  function init(options = {}) {
    const cfg = { ...DEFAULTS, ...options };
    if (activeInstance) {
      activeInstance.remount(cfg.mount);
      return activeInstance;
    }

    const root = createEl("div", "feedback-widget-root");
    const canvas = createEl("div", "feedback-widget-canvas");
    const domHighlight = createEl("div", "feedback-widget-dom-highlight");
    const marks = createEl("div", "feedback-widget-marks");
    const inlineHost = createEl("div", "feedback-widget-inline-host");

    const launcher = createEl("div", "feedback-widget-launcher");
    const launcherBtn = createEl("button", "feedback-widget-launcher-btn");
    launcherBtn.type = "button";
    launcherBtn.title = `${cfg.title} (Alt+${cfg.hotkey.toUpperCase()})`;
    launcherBtn.setAttribute("aria-label", cfg.title);
    launcherBtn.setAttribute("aria-pressed", "false");
    launcherBtn.innerHTML = SVG[cfg.icon] ?? SVG.bug;
    launcher.appendChild(launcherBtn);

    function remount(targetMount) {
      const mountSelector = targetMount || cfg.mount;
      const mountEl = typeof mountSelector === "string" ? document.querySelector(mountSelector) : (mountSelector instanceof Element ? mountSelector : null);
      if (mountEl) {
        launcher.classList.add("is-mounted");
        if (!mountEl.contains(launcher)) {
          mountEl.appendChild(launcher);
        }
      } else {
        launcher.classList.remove("is-mounted");
        if (!document.body.contains(launcher)) {
          document.body.appendChild(launcher);
        }
      }
    }

    remount(cfg.mount);

    // Watch for DOM changes so launcher stays securely mounted during route changes
    let observer = null;
    try {
      observer = new MutationObserver(() => {
        remount(cfg.mount);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch {}

    const panel = createEl("div", "feedback-widget-panel");
    panel.innerHTML = `
      <div class="feedback-widget-panel-header" data-drag-handle>
        <div class="feedback-widget-header-title-wrap">
          <span class="feedback-widget-grip">${SVG.grip}</span>
          <div class="feedback-widget-header-text">
            <span class="feedback-widget-panel-title">${cfg.title}</span>
            <span class="feedback-widget-panel-subtitle">Drag to move · mark up the UI</span>
          </div>
        </div>
        <button type="button" class="feedback-widget-close" data-no-drag aria-label="Close">${SVG.x}</button>
      </div>
      <div class="feedback-widget-tabs" data-no-drag>
        <button type="button" class="feedback-widget-tab is-active" data-mode="dom">${SVG.pointer} DOM Selector</button>
        <button type="button" class="feedback-widget-tab" data-mode="box">${SVG.square} Box Selector</button>
      </div>
      <div class="feedback-widget-field" data-no-drag>
        <label class="feedback-widget-label" for="fw-notes">General Notes / Global Instruction</label>
        <textarea id="fw-notes" rows="3" placeholder="Describe context or general notes..."></textarea>
      </div>
      <div class="feedback-widget-footer" data-no-drag>
        <button type="button" class="feedback-widget-icon-btn" id="fw-clear" aria-label="Clear" title="Clear Annotations" disabled>${SVG.trash}</button>
        <button type="button" class="feedback-widget-submit-btn" id="fw-submit" disabled>${SVG.send} Submit Queue Task</button>
      </div>
      <div class="feedback-widget-status" id="fw-status" data-no-drag>Overlay ready.</div>
      <div class="feedback-widget-captured" id="fw-captured" data-no-drag hidden>
        <span class="feedback-widget-label">Captured Annotations (<span id="fw-count">0</span>)</span>
        <div id="fw-list"></div>
      </div>
    `;
    makeDraggable(panel, panel.querySelector(".feedback-widget-panel-header"));

    root.append(canvas, domHighlight, marks, inlineHost, panel);
    document.body.appendChild(root);

    const closeBtn = panel.querySelector(".feedback-widget-close");
    const domTab = panel.querySelector('.feedback-widget-tab[data-mode="dom"]');
    const boxTab = panel.querySelector('.feedback-widget-tab[data-mode="box"]');
    const listEl = panel.querySelector("#fw-list");
    const capturedEl = panel.querySelector("#fw-captured");
    const capturedCountEl = panel.querySelector("#fw-count");
    const statusEl = panel.querySelector("#fw-status");
    const globalEl = panel.querySelector("#fw-notes");
    const clearBtn = panel.querySelector("#fw-clear");
    const submitBtn = panel.querySelector("#fw-submit");

    let active = false, mode = "dom", start = null, draft = null, pending = null;
    const annotations = [];

    function setStatus(msg) { statusEl.textContent = msg; }

    function syncActions() {
      const has = annotations.length > 0;
      clearBtn.disabled = !has;
      submitBtn.disabled = !has && !globalEl.value.trim();
      capturedEl.hidden = !has;
      capturedCountEl.textContent = String(annotations.length);
    }

    function renderList() {
      listEl.innerHTML = "";
      annotations.forEach((ann, idx) => {
        const row = createEl("div", "feedback-widget-annotation");
        const head = createEl("div", "feedback-widget-annotation-head");
        head.append(
          createEl("span", null, `Annotation ${idx + 1}`),
          createEl("span", "feedback-widget-annotation-kind", [
            ann.selector ? "Element" : "Region",
            ann.screenshot_data_url || ann.screenshot_path ? "· shot" : null,
            ann.visible_text ? "· text" : null,
          ].filter(Boolean).join(" "))
        );
        row.append(head, createEl("p", "feedback-widget-annotation-note", ann.note || "(no note)"));
        listEl.appendChild(row);
      });
      syncActions();
    }

    function rebuildMarks() {
      marks.innerHTML = "";
      annotations.forEach((ann, idx) => {
        const box = createEl("div", "feedback-widget-box");
        placeBox(box, ann);
        box.appendChild(createEl("span", "feedback-widget-box-label", String(idx + 1)));
        marks.appendChild(box);
      });
    }

    function hideHighlight() { domHighlight.style.display = "none"; }
    function dismissInline() { pending = null; inlineHost.innerHTML = ""; }

    function openInline(draftAnn) {
      pending = draftAnn;
      inlineHost.innerHTML = "";
      const pop = createEl("div", "feedback-widget-inline");
      const left = Math.max(10, Math.min(global.innerWidth - 300, draftAnn.x + draftAnn.width / 2 - 140));
      const top = draftAnn.y - 150 > 10 ? draftAnn.y - 150 : draftAnn.y + draftAnn.height + 10;
      pop.style.left = `${left}px`; pop.style.top = `${top}px`;
      pop.innerHTML = `
        <div class="feedback-widget-inline-header" data-drag-handle>
          <div class="feedback-widget-header-title-wrap">
            <span class="feedback-widget-grip">${SVG.grip}</span>
            <div class="feedback-widget-header-text">
              <span class="feedback-widget-inline-title">${draftAnn.selector ? "Element Comment" : "Region Comment"}</span>
              <span class="feedback-widget-panel-subtitle">Drag to move</span>
            </div>
          </div>
          <button type="button" class="feedback-widget-inline-close" data-no-drag aria-label="Cancel">${SVG.xSm}</button>
        </div>
        <textarea rows="3" placeholder="Type comment / change details here..." data-no-drag></textarea>
        <div class="feedback-widget-inline-actions" data-no-drag>
          <button type="button" class="feedback-widget-inline-cancel">Cancel</button>
          <button type="button" class="feedback-widget-inline-save">Save Annotation</button>
        </div>
      `;
      const ta = pop.querySelector("textarea");
      const saveBtn = pop.querySelector(".feedback-widget-inline-save");
      const save = async () => {
        const note = ta.value.trim();
        if (!note) { setStatus("Please enter a note."); ta.focus(); return; }
        if (!pending) return;
        saveBtn.disabled = true;
        setStatus("Capturing context…");
        const captureEl = pending._captureElement instanceof Element ? pending._captureElement : null;
        const rect = { x: pending.x, y: pending.y, width: pending.width, height: pending.height };
        const visible_text = captureEl ? visibleText(captureEl) : visibleTextFromRect(rect, root);
        let screenshot_data_url = null;
        if (cfg.captureScreenshots !== false && cfg.html2canvasSrc) {
          screenshot_data_url = await captureScreenshot({ element: captureEl, rect: captureEl ? null : rect, html2canvasSrc: cfg.html2canvasSrc, hideRoots: [root, launcher] });
        }
        const { _captureElement: _ignoredEl, _captureRect: _ignoredRect, ...rest } = pending;
        annotations.push({ ...rest, note, visible_text: visible_text || null, screenshot_data_url: screenshot_data_url || null });
        dismissInline(); rebuildMarks(); renderList();
        setStatus(`${annotations.length} annotation(s) ready${screenshot_data_url ? " + screenshot" : ""}.`);
      };

      pop.querySelector(".feedback-widget-inline-close").addEventListener("click", dismissInline);
      pop.querySelector(".feedback-widget-inline-cancel").addEventListener("click", dismissInline);
      saveBtn.addEventListener("click", () => { void save(); });
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void save(); }
      });
      makeDraggable(pop, pop.querySelector(".feedback-widget-inline-header"));
      inlineHost.appendChild(pop);
      ta.focus();
    }

    function applyVisuals() {
      domTab.classList.toggle("is-active", mode === "dom");
      boxTab.classList.toggle("is-active", mode === "box");
      root.classList.toggle("is-drawing", active && mode === "box");
      if (mode !== "dom") hideHighlight();
    }

    function setMode(m) {
      if (m !== mode) { mode = m; draft?.remove(); draft = null; start = null; dismissInline(); }
      applyVisuals();
      setStatus(mode === "dom" ? "Hover to highlight, click to select an element." : "Drag to draw a box on the page.");
    }

    function open() {
      active = true; clearPos(panel);
      root.classList.add("is-active"); launcherBtn.classList.add("is-active"); launcherBtn.setAttribute("aria-pressed", "true");
      applyVisuals();
      setStatus(mode === "dom" ? "Hover to highlight, click to select an element." : "Drag to draw a box on the page.");
    }

    function close() {
      active = false; draft?.remove(); draft = null; start = null; dismissInline(); clearPos(panel);
      root.classList.remove("is-active", "is-drawing"); launcherBtn.classList.remove("is-active"); launcherBtn.setAttribute("aria-pressed", "false");
      hideHighlight();
    }

    function toggle() { if (active) close(); else open(); }

    canvas.addEventListener("mousedown", (e) => {
      if (mode !== "box" || pending) return;
      start = { x: e.clientX, y: e.clientY };
      draft = createEl("div", "feedback-widget-box is-draft");
      canvas.appendChild(draft);
    });

    canvas.addEventListener("mousemove", (e) => {
      if (mode !== "box" || !start || !draft) return;
      const x = Math.min(start.x, e.clientX), y = Math.min(start.y, e.clientY);
      draft.style.left = `${x}px`; draft.style.top = `${y}px`;
      draft.style.width = `${Math.abs(e.clientX - start.x)}px`; draft.style.height = `${Math.abs(e.clientY - start.y)}px`;
    });

    canvas.addEventListener("mouseup", (e) => {
      if (mode !== "box" || !start || !draft) return;
      const x = Math.min(start.x, e.clientX), y = Math.min(start.y, e.clientY);
      const width = Math.abs(e.clientX - start.x), height = Math.abs(e.clientY - start.y);
      if (width >= 8 && height >= 8) {
        const prev = canvas.style.display; canvas.style.display = "none";
        const target = document.elementFromPoint(x + width / 2, y + height / 2);
        canvas.style.display = prev;
        openInline({ x, y, width, height, selector: cssPath(target), note: "", dom_snippet: snippet(target), _captureElement: target instanceof Element ? target : null });
      }
      draft.remove(); start = null; draft = null;
    });

    function isWidgetElement(el) {
      if (!el || !(el instanceof Element)) return false;
      return Boolean(
        panel.contains(el) ||
        launcher.contains(el) ||
        inlineHost.contains(el) ||
        el.closest(".feedback-widget-panel") ||
        el.closest(".feedback-widget-inline") ||
        el.closest(".feedback-widget-launcher") ||
        el === root
      );
    }

    function onHover(e) {
      if (mode !== "dom" || !active || pending || isWidgetElement(e.target)) {
        hideHighlight(); return;
      }
      if (!e.target || e.target === document.documentElement || e.target === document.body) {
        hideHighlight(); return;
      }
      placeBox(domHighlight, e.target.getBoundingClientRect());
      domHighlight.style.display = "block";
    }

    function onClick(e) {
      if (mode !== "dom" || !active || pending || isWidgetElement(e.target)) return;
      if (!e.target || e.target === document.documentElement || e.target === document.body) return;
      e.preventDefault(); e.stopPropagation();
      const target = e.target, rect = target.getBoundingClientRect();
      hideHighlight();
      openInline({ x: rect.left, y: rect.top, width: rect.width, height: rect.height, selector: cssPath(target), note: "", dom_snippet: snippet(target), _captureElement: target instanceof Element ? target : null });
    }

    document.addEventListener("mousemove", onHover, true);
    document.addEventListener("click", onClick, true);

    async function submit() {
      if (annotations.length === 0 && !globalEl.value.trim()) { setStatus("Add at least one selection or note."); return; }
      setStatus("Sending…"); submitBtn.disabled = true;
      const user =
        typeof cfg.getCurrentUser === "function"
          ? cfg.getCurrentUser()
          : (function () {
              try {
                const match = document.cookie.match(/(?:^|;\s*)ps_user=([^;]+)/);
                if (match) {
                  return JSON.parse(decodeURIComponent(match[1]));
                }
              } catch {}
              return null;
            })();
      const reporter = user && (user.name || user.email || user.id || user.sub) ? { ...user, source: "widget" } : null;
      const payload = { page_url: location.href, global_instruction: globalEl.value.trim() || null, category: cfg.category, target_agent: cfg.targetAgent, reporter, annotations };
      try {
        const res = await fetch(`${cfg.apiBase}/api/v1/feedback/tasks`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText || `HTTP ${res.status}`);
        setStatus(`Queued ${data.task_id} (${data.category}, ${data.status})`);
        annotations.length = 0; rebuildMarks(); globalEl.value = ""; renderList();
      } catch (err) {
        const msg = err && err.message ? String(err.message) : String(err);
        setStatus(`Failed: ${/failed to fetch|networkerror/i.test(msg) ? "Can't reach feedback API. Run: npm run server" : msg}`);
        syncActions();
      }
    }

    launcherBtn.addEventListener("click", toggle);
    closeBtn.addEventListener("click", close);
    domTab.addEventListener("click", () => setMode("dom"));
    boxTab.addEventListener("click", () => setMode("box"));
    submitBtn.addEventListener("click", submit);
    globalEl.addEventListener("input", syncActions);
    clearBtn.addEventListener("click", () => {
      annotations.length = 0; dismissInline(); rebuildMarks(); globalEl.value = ""; renderList(); setStatus("Draft cleared.");
    });

    function onKeydown(e) {
      if (e.altKey && e.key.toLowerCase() === cfg.hotkey) { e.preventDefault(); toggle(); }
      if (e.key === "Escape" && active) {
        if (pending) dismissInline();
        else if (draft) { draft.remove(); draft = null; start = null; }
        else close();
      }
    }
    document.addEventListener("keydown", onKeydown);

    activeInstance = { root, launcher, remount, observer, onKeydown, onHover, onClick };
    syncActions();
    return { toggle, submit, annotations, remount };
  }

  function destroy() {
    if (!activeInstance) return;
    const { root, launcher, observer, onKeydown, onHover, onClick } = activeInstance;
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("mousemove", onHover, true);
    document.removeEventListener("click", onClick, true);
    try { observer?.disconnect(); } catch {}
    launcher?.remove();
    root.remove();
    activeInstance = null;
  }

  global.FeedbackWidget = { init, destroy };
  if (typeof module !== "undefined") module.exports = { init, destroy };
})(typeof window !== "undefined" ? window : globalThis);

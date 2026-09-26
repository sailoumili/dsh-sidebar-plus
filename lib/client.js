window.__ModuleLoader__.load({
  id: "dsh-sidebar-plus",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var react = require("react");

    const name = "dsh-sidebar-plus";
    const inject = ["remote", "remote.workspaceFiles"];
    const ID = "dsh-sidebar-plus/source";
    const NS = "dshSidebarPlus";
    const CSS_ID = "dsh-sidebar-plus";
    const POLL_MS = 2000;          // 稳态巡检：热件（hot-*.cjs）改动多久发现一次
    const FAST_POLL_MS = 120;      // 业务还没到时不干等 2 秒，快速重试
    const FAST_WINDOW_MS = 8000;   // 快速重试窗口，超过就回落稳态，别一直打

    function ensureStyleTag() {
      if (typeof document === "undefined") return null;
      let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_ID) + "]");
      if (!tag) {
        tag = document.createElement("style");
        tag.dataset.plugin = name;
        tag.dataset.pluginCss = CSS_ID;
        document.head.appendChild(tag);
      }
      return tag;
    }
    function removeStyle() {
      if (typeof document === "undefined") return;
      const tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_ID) + "]");
      if (tag) tag.remove();
    }

    const bus = { cur: null, gen: 0, subs: new Set() };
    function notifyBus() {
      bus.gen++;
      for (const fn of bus.subs) { try { fn(); } catch (e) {  } }
    }

    function compileBus(code, ENV) {
      const factory = new Function("ENV", '"use strict";' + String(code));
      const b = factory(ENV);
      if (!b || typeof b !== "object") throw new Error("业务必须 return 一个对象");
      if (typeof b.Body !== "function") throw new Error("业务缺少 Body 组件");
      if (!Array.isArray(b.extensions)) throw new Error("业务缺少 extensions 数组");
      if (typeof b.version !== "string") b.version = "?";
      return b;
    }

    function Shell(props) {
      const forcePair = react.useReducer((x) => x + 1, 0);
      const force = forcePair[1];
      react.useEffect(() => {
        const fn = () => force();
        bus.subs.add(fn);
        fn();
        return () => { bus.subs.delete(fn); };
      }, []);
      const B = bus.cur && bus.cur.Body;
      if (!B) {
        return react.createElement("div", { className: "dshsp-booting" }, "侧边栏增强加载中…");
      }
      return react.createElement(B, Object.assign({}, props, { key: bus.gen }));
    }

    function apply(ctx) {
      let alive = true;
      let pollTimer = null;
      let hotTimer = null;
      let hotStart = 0;
      const disposers = [];

      let remoteRef = null;
      try { remoteRef = ctx.remote || null; } catch (e) { remoteRef = null; }

      const extRef = [];
      let metaJson = "";
      let cachedLocale = null;
      let cssText = null;
      let previewDisposer = null;
      let localeDisposer = null;
      let servicesReady = false;

      function registerPreview() {
        const previews = ctx.get("documentPreviews");
        if (!previews || typeof previews.register !== "function") return;
        const m = (bus.cur && bus.cur.meta) || {};
        const wantLoading = m.loading === "bytes-complete" ? "bytes-complete" : "text-pages";
        const wantWrap = !bus.cur || !bus.cur.meta || bus.cur.meta.wrap !== false;
        const wantPriority = m.priority === "extension" ? "extension" : "builtin";
        const nextJson = wantLoading + "|" + wantWrap + "|" + wantPriority;
        if (previewDisposer && nextJson === metaJson) return;
        if (previewDisposer) { try { previewDisposer(); } catch (e) {  } previewDisposer = null; }
        metaJson = nextJson;
        try {
          previewDisposer = previews.register({
            id: ID,
            extensions: extRef,
            priority: wantPriority,
            title: () => (bus.cur && bus.cur.title) || "源编辑",
            loading: wantLoading,
            wrap: wantWrap,
          });
        } catch (e) {
          try { console.warn("[dsh-sidebar-plus] 渲染器注册失败（自动退化）:", (e && e.message) || e); } catch (err) {  }
        }
      }

      function refreshLocale() {
        const locale = ctx.get("locale");
        const want = bus.cur && bus.cur.locale;
        if (!locale || typeof locale.register !== "function" || !want || !want.zh) return;
        const json = JSON.stringify(want);
        if (json === cachedLocale) return;
        cachedLocale = json;
        if (localeDisposer) { try { localeDisposer(); } catch (e) {  } localeDisposer = null; }
        try { localeDisposer = locale.register(NS, { zh: want.zh || {}, en: want.en || {} }); } catch (e) {  }
      }

      function applyStatic(next) {
        const wantCss = typeof next.css === "string" ? next.css : "";
        if (wantCss !== cssText) {
          cssText = wantCss;
          const tag = ensureStyleTag();
          if (tag) tag.textContent = cssText;
        }
        extRef.length = 0;
        for (const x of next.extensions) extRef.push(String(x));
      }

      function swap(next) {
        const old = bus.cur;
        bus.cur = next;
        try { if (old && typeof old.teardown === "function") old.teardown(); } catch (e) {  }
        applyStatic(next);
        if (servicesReady) {
          try { refreshLocale(); registerPreview(); } catch (e) {  }
        }
        notifyBus();
        try { fetch("/dsh-sp/ping-client?v=" + encodeURIComponent(next.version), { cache: "no-store" }).catch(() => {}); } catch (e) {  }
      }

      /* 计时探针：把页面侧的时间点报给宿主（GET /dsh-sp/marks 读回）。 */
      let markSeq = 0;
      function postMark(name) {
        try {
          const t = (typeof performance !== "undefined" && performance.now) ? Math.round(performance.now()) : -1;
          const qs = "?n=" + encodeURIComponent(String(name)) + "&t=" + t + "&s=" + (++markSeq) + "&at=" + Date.now();
          fetch("/dsh-sp/mark" + qs, { cache: "no-store" }).catch(() => {});
        } catch (e) {  }
      }

      async function tick() {
        if (!alive) return false;
        try {
          if (!remoteRef) { try { remoteRef = ctx.remote || null; } catch (e) {  } }
          // 业务还没到：直接拉，省掉一次 /rev 往返（首屏少约一次网络往返）
          if (!bus.cur) {
            const first = await fetch("/dsh-sp/pull", { cache: "no-store" }).then((r) => r.json());
            if (!first || first.ok !== true || typeof first.code !== "string") return false;
            const nextFirst = compileBus(first.code, { react: react, remote: remoteRef });
            nextFirst.__rev = String(first.c);
            swap(nextFirst);
            postMark("business-pulled");
            return true;
          }
          const rev = await fetch("/dsh-sp/rev", { cache: "no-store" }).then((r) => r.json());
          if (!rev || rev.ok !== true) return false;
          if (String(rev.c) === String(bus.cur.__rev)) return true;
          const pull = await fetch("/dsh-sp/pull", { cache: "no-store" }).then((r) => r.json());
          if (!pull || pull.ok !== true || typeof pull.code !== "string") return false;
          const next = compileBus(pull.code, { react: react, remote: remoteRef });
          next.__rev = String(pull.c);
          swap(next);
          postMark("business-pulled");
          return true;
        } catch (e) {
          try { console.warn("[dsh-sidebar-plus] 热更新失败（保留现版）:", (e && e.message) || e); } catch (err) {  }
          return false;
        }
      }

      /* 业务还没到就快速重试（120ms），到了就回落 2 秒稳态巡检；
         这样「刚打开文件就点」的第一下也能立刻有工具条，不用干等一个巡检周期。 */
      function runHot() {
        hotTimer = null;
        if (!alive) return;
        tick().then((ok) => {
          if (!alive) return;
          const fast = !ok && (Date.now() - hotStart) < FAST_WINDOW_MS;
          hotTimer = setTimeout(runHot, fast ? FAST_POLL_MS : POLL_MS);
        });
      }

      function tryRegister() {
        let slots, locale, previews;
        try {
          slots = ctx.get("slots");
          locale = ctx.get("locale");
          previews = ctx.get("documentPreviews");
        } catch (e) { return false; }
        if (!slots || typeof slots.inject !== "function") return false;
        if (!locale || typeof locale.register !== "function") return false;
        if (!previews || typeof previews.register !== "function") return false;
        try {
          localeDisposer = locale.register(NS, { zh: { "viewer.label": "源编辑" }, en: { "viewer.label": "Source" } });
          registerPreview();
          if (bus.cur) { applyStatic(bus.cur); refreshLocale(); }
          disposers.push(slots.inject("sidebar.right.tab.document", () => slots.register({
            name: "sidebar.right.tab.document",
            key: ID,
            locale: NS,
          }, Shell)));
        } catch (e) {
          try { console.warn("[dsh-sidebar-plus] 注册失败（自动退化，不影响官方功能）:", (e && e.message) || e); } catch (err) {  }
        }
        return true;
      }

      function bootRegister() {
        if (!alive || servicesReady) return;
        servicesReady = tryRegister();
        if (servicesReady) {
          postMark("services-registered");
          if (pollTimer) { try { clearInterval(pollTimer); } catch (e) {  } pollTimer = null; }
          if (!bus.cur) runHot();   // 服务一就绪就补拉一次业务，别等下一个巡检
        }
      }

      postMark("loader-applied");
      bootRegister();
      pollTimer = setInterval(bootRegister, 120);
      hotStart = Date.now();
      runHot();

      ctx.effect(() => () => {
        alive = false;
        if (pollTimer) { try { clearInterval(pollTimer); } catch (e) {  } pollTimer = null; }
        if (hotTimer) { try { clearTimeout(hotTimer); } catch (e) {  } hotTimer = null; }
        try { if (bus.cur && typeof bus.cur.teardown === "function") bus.cur.teardown(); } catch (e) {  }
        bus.cur = null;
        if (previewDisposer) { try { previewDisposer(); } catch (e) {  } }
        if (localeDisposer) { try { localeDisposer(); } catch (e) {  } }
        for (let i = disposers.length - 1; i >= 0; i--) { try { const d = disposers[i]; if (typeof d === "function") d(); } catch (e) {  } }
        removeStyle();
      });
    }

    exports.name = name;
    exports.inject = inject;
    exports.apply = apply;
    exports._test = {
      ID: ID,
      NS: NS,
      Shell: Shell,
      bus: bus,
      compileBus: compileBus,
    };
    return module.exports;
  },
});

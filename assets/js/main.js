/* =========================================================
   Pink Lemon — shared behaviour
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Image fade-in ---------------- */
  function markLoaded(img) { img.classList.add("loaded"); }
  document.querySelectorAll("img.img-fade").forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) {
      markLoaded(img);
    } else {
      img.addEventListener("load", function () { markLoaded(img); });
      img.addEventListener("error", function () { markLoaded(img); });
    }
  });
  // Project modal images are swapped in dynamically after the page has loaded —
  // watch for src changes so they fade in too instead of staying invisible.
  document.querySelectorAll('img.img-fade[data-p-image]').forEach(function (img) {
    var obs = new MutationObserver(function () {
      img.classList.remove("loaded");
      if (img.complete && img.naturalWidth > 0) markLoaded(img);
    });
    obs.observe(img, { attributes: true, attributeFilter: ["src"] });
    img.addEventListener("load", function () { markLoaded(img); });
  });

  /* ---------------- Theme toggle ---------------- */
  var THEME_KEY = "pl_theme";

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    var meta = document.querySelector("[data-theme-color]");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#121212" : "#ffffff");
  }
  function effectiveTheme() {
    // Always starts light regardless of OS preference — dark mode is opt-in only,
    // via the header toggle, and persisted from then on.
    var stored = getStoredTheme();
    return stored === "dark" ? "dark" : "light";
  }

  applyTheme(effectiveTheme());

  var themeToggleBtn = document.querySelector("[data-theme-toggle]");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next);
    });
  }

  /* ---------------- Header scroll shadow ---------------- */
  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    var toggleHeaderShadow = function () {
      siteHeader.classList.toggle("scrolled", window.scrollY > 8);
    };
    toggleHeaderShadow();
    window.addEventListener("scroll", toggleHeaderShadow, { passive: true });
  }

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileDrawer = document.querySelector("[data-mobile-drawer]");
  if (navToggle && mobileDrawer) {
    navToggle.addEventListener("click", function () {
      mobileDrawer.classList.toggle("open");
      document.body.style.overflow = mobileDrawer.classList.contains("open") ? "hidden" : "";
    });
    mobileDrawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileDrawer.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------------- Active nav link ---------------- */
  var here = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll("[data-nav-link]").forEach(function (link) {
    var target = link.getAttribute("data-nav-link");
    if (target === here) link.classList.add("active");
  });

  /* ---------------- Generic modal system ---------------- */
  var lastFocused = null;

  function openModal(id) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    lastFocused = document.activeElement;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    var focusable = overlay.querySelector("input, select, textarea, button, a");
    if (focusable) setTimeout(function () { focusable.focus(); }, 60);
  }

  function closeModal(overlay) {
    if (!overlay) return;
    overlay.classList.remove("open");
    var anyOpen = document.querySelector(".modal-overlay.open");
    if (!anyOpen) document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-modal]");
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute("data-open-modal"));
      return;
    }
    var closer = e.target.closest("[data-close-modal]");
    if (closer) {
      e.preventDefault();
      closeModal(closer.closest(".modal-overlay"));
      return;
    }
    if (e.target.classList && e.target.classList.contains("modal-overlay")) {
      closeModal(e.target);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var openOverlay = document.querySelector(".modal-overlay.open");
      if (openOverlay) closeModal(openOverlay);
    }
  });

  window.PinkLemon = window.PinkLemon || {};
  window.PinkLemon.openModal = openModal;
  window.PinkLemon.closeModal = closeModal;

  /* ---------------- Cookie consent ---------------- */
  var COOKIE_KEY = "pl_cookie_consent";

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(COOKIE_KEY)); } catch (e) { return null; }
  }
  function saveConsent(consent) {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify(consent)); } catch (e) {}
  }

  var banner = document.querySelector("[data-cookie-banner]");
  var prefsModal = document.getElementById("modal-cookie-prefs");
  var analyticsToggle = document.getElementById("cookie-analytics");
  var marketingToggle = document.getElementById("cookie-marketing");

  function hideBanner() {
    if (banner) banner.classList.remove("show");
  }
  function showBannerIfNeeded() {
    if (!banner) return;
    var consent = getConsent();
    if (!consent) {
      setTimeout(function () { banner.classList.add("show"); }, 900);
    }
  }
  function applyConsentToToggles(consent) {
    if (!consent) return;
    if (analyticsToggle) analyticsToggle.checked = !!consent.analytics;
    if (marketingToggle) marketingToggle.checked = !!consent.marketing;
  }

  showBannerIfNeeded();
  applyConsentToToggles(getConsent());

  var acceptBtn = document.querySelector("[data-cookie-accept]");
  var rejectBtn = document.querySelector("[data-cookie-reject]");
  var prefsBtn = document.querySelectorAll("[data-cookie-prefs]");
  var savePrefsBtn = document.querySelector("[data-cookie-save]");

  if (acceptBtn) acceptBtn.addEventListener("click", function () {
    saveConsent({ necessary: true, analytics: true, marketing: true, ts: "accepted" });
    applyConsentToToggles(getConsent());
    hideBanner();
  });

  if (rejectBtn) rejectBtn.addEventListener("click", function () {
    saveConsent({ necessary: true, analytics: false, marketing: false, ts: "rejected" });
    applyConsentToToggles(getConsent());
    hideBanner();
  });

  prefsBtn.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      applyConsentToToggles(getConsent() || { analytics: false, marketing: false });
      if (prefsModal) openModal("modal-cookie-prefs");
    });
  });

  if (savePrefsBtn) savePrefsBtn.addEventListener("click", function () {
    saveConsent({
      necessary: true,
      analytics: analyticsToggle ? analyticsToggle.checked : false,
      marketing: marketingToggle ? marketingToggle.checked : false,
      ts: "customized"
    });
    hideBanner();
    closeModal(prefsModal);
  });

  /* ---------------- Form validation + fake submit ---------------- */
  function validateField(field) {
    var input = field.querySelector("input, select, textarea");
    if (!input) return true;
    var valid = true;

    if (input.hasAttribute("required") && !input.value.trim()) valid = false;
    if (valid && input.type === "email" && input.value.trim()) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(input.value.trim())) valid = false;
    }
    if (valid && input.type === "checkbox" && input.hasAttribute("required")) {
      valid = input.checked;
    }

    field.classList.toggle("invalid", !valid);
    return valid;
  }

  document.querySelectorAll("[data-form]").forEach(function (form) {
    var fields = form.querySelectorAll(".field, .checkbox-row");
    var successBox = form.parentElement.querySelector("[data-form-success]");
    var errorBox = form.parentElement.querySelector("[data-form-error]");
    var submitBtn = form.querySelector('button[type="submit"]');

    fields.forEach(function (field) {
      field.addEventListener("input", function () { validateField(field); });
      field.addEventListener("change", function () { validateField(field); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allValid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) allValid = false;
      });
      if (!allValid) {
        var firstInvalid = form.querySelector(".invalid input, .invalid select, .invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (errorBox) errorBox.classList.remove("show");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = "Sending…";
      }

      var payload = Object.fromEntries(new FormData(form).entries());
      payload.page = document.title;

      fetch((window.PL_API_BASE || "") + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          return res.json();
        })
        .then(function () {
          form.reset();
          fields.forEach(function (f) { f.classList.remove("invalid"); });
          form.classList.add("hide");
          if (successBox) successBox.classList.add("show");
        })
        .catch(function () {
          if (errorBox) errorBox.classList.add("show");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText;
          }
        });
    });
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
    });
  });

  /* ---------------- Work filters ---------------- */
  var filterBtns = document.querySelectorAll("[data-filter]");
  var workCards = document.querySelectorAll("[data-category]");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var filter = btn.getAttribute("data-filter");
      workCards.forEach(function (card) {
        var show = filter === "all" || card.getAttribute("data-category") === filter;
        card.style.display = show ? "" : "none";
      });
    });
  });

  /* ---------------- Project popups ---------------- */
  var PROJECTS = {
    orbit: {
      title: "Orbit Wellness — Brand Identity",
      client: "Orbit Wellness", year: "2025", category: "Branding", services: "Strategy, Identity, Packaging",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80",
      description: "A full identity system for a wellness brand entering a crowded market. We built a calm, confident visual language — from wordmark to packaging — that reads as premium without losing warmth.",
      tags: ["Identity", "Packaging", "Art Direction"]
    },
    halo: {
      title: "Halo Studio — Website & Digital",
      client: "Halo Studio", year: "2024", category: "Web Design", services: "UX, Web Design, Development",
      image: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1000&q=80",
      description: "A editorial-style website that turns Halo's portfolio into a scroll-driven story. Clear hierarchy, restrained motion, and a CMS the team actually enjoys using.",
      tags: ["Web Design", "UX", "CMS"]
    },
    vesta: {
      title: "Vesta & Co — Campaign",
      client: "Vesta & Co", year: "2024", category: "Digital", services: "Strategy, Art Direction, Social",
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1000&q=80",
      description: "A season-long digital campaign built around one strong visual idea, adapted across social, email and paid — consistent enough to recognise, flexible enough to stay fresh.",
      tags: ["Campaign", "Social", "Paid Media"]
    },
    arclight: {
      title: "Arclight — Product Launch",
      client: "Arclight", year: "2023", category: "Strategy", services: "Positioning, Messaging, Launch",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1000&q=80",
      description: "From naming to launch messaging, we shaped how Arclight talks about itself — clear enough for a press release, sharp enough for a pitch deck.",
      tags: ["Positioning", "Messaging", "Launch"]
    },
    numen: {
      title: "Numen Collective — Rebrand",
      client: "Numen Collective", year: "2023", category: "Branding", services: "Strategy, Identity, Guidelines",
      image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1000&q=80",
      description: "A ground-up rebrand for a growing collective of independent makers — new name architecture, visual system, and guidelines built to scale with them.",
      tags: ["Rebrand", "Guidelines", "Strategy"]
    },
    holm: {
      title: "Holm & Co — E-commerce",
      client: "Holm & Co", year: "2022", category: "Web Design", services: "UX, Web Design, Shopify",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1000&q=80",
      description: "A conversion-focused storefront that still feels editorial. We rebuilt the product journey around photography and left the noise out.",
      tags: ["E-commerce", "Shopify", "UX"]
    }
  };

  var projModal = document.getElementById("modal-project");
  if (projModal) {
    document.querySelectorAll("[data-project]").forEach(function (card) {
      card.addEventListener("click", function () {
        var key = card.getAttribute("data-project");
        var p = PROJECTS[key];
        if (!p) return;
        projModal.querySelector("[data-p-title]").textContent = p.title;
        projModal.querySelector("[data-p-image]").src = p.image;
        projModal.querySelector("[data-p-image]").alt = p.title;
        projModal.querySelector("[data-p-client]").textContent = p.client;
        projModal.querySelector("[data-p-year]").textContent = p.year;
        projModal.querySelector("[data-p-category]").textContent = p.category;
        projModal.querySelector("[data-p-services]").textContent = p.services;
        projModal.querySelector("[data-p-desc]").textContent = p.description;
        var tagsWrap = projModal.querySelector("[data-p-tags]");
        tagsWrap.innerHTML = "";
        p.tags.forEach(function (t) {
          var span = document.createElement("span");
          span.textContent = t;
          tagsWrap.appendChild(span);
        });
        openModal("modal-project");
      });
    });
  }

  /* ---------------- Stat count-up (About page) ---------------- */
  var stats = document.querySelectorAll("[data-count]");
  if (stats.length && "IntersectionObserver" in window) {
    var counted = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || counted.has(entry.target)) return;
        counted.add(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        var start = 0;
        var duration = 1100;
        var startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(start + (target - start) * eased) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          rio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { rio.observe(el); });
  }
})();

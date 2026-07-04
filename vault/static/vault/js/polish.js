/* ============================================================
   MemoryVault AI — Shared Polish Behaviors
   Mobile nav drawer, toast manager, skeleton->content reveal,
   and button ripple. Safe to include on every page; degrades
   gracefully if a given element isn't present.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Mobile nav drawer ---------- */
  function setupMobileNav() {
    const sidebar = document.getElementById("sidebar");
    const topbar = document.querySelector(".topbar");
    if (!sidebar || !topbar) return;

    let backdrop = document.querySelector(".sidebar-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "sidebar-backdrop";
      document.body.appendChild(backdrop);
    }

    let menuBtn = document.querySelector(".mobile-menu-btn");
    if (!menuBtn) {
      menuBtn = document.createElement("button");
      menuBtn.className = "mobile-menu-btn";
      menuBtn.setAttribute("aria-label", "Open navigation menu");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.innerHTML = '<i class="ti ti-menu-2" aria-hidden="true"></i>';
      topbar.prepend(menuBtn);
    }

    function open() {
      sidebar.classList.add("mobile-open");
      document.body.classList.add("nav-open");
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Close navigation menu");
    }
    function close() {
      sidebar.classList.remove("mobile-open");
      document.body.classList.remove("nav-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open navigation menu");
    }
    menuBtn.addEventListener("click", () =>
      sidebar.classList.contains("mobile-open") ? close() : open()
    );
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    sidebar.querySelectorAll(".nav-item").forEach((item) =>
      item.addEventListener("click", () => {
        if (window.innerWidth <= 860) close();
      })
    );
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });
  }

  /* ---------- Toast manager ---------- */
  function ensureToastRegion() {
    let region = document.getElementById("toast-region");
    if (!region) {
      region = document.createElement("div");
      region.id = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  }

  window.mvToast = function (message, type = "info", duration = 3500) {
    const region = ensureToastRegion();
    const icon =
      type === "success" ? "ti-circle-check" : type === "error" ? "ti-alert-circle" : "ti-info-circle";
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="ti ${icon}" aria-hidden="true"></i><span>${message}</span>`;
    region.appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 220);
    }, duration);
  };

  /* ---------- Skeleton -> content reveal ----------
     Usage: <div data-loading="true"> <div class="skel-wrap">…skeletons…</div>
     <div class="real-content">…actual content…</div> </div>
     Automatically flips to real content after `data-load-delay` ms (default 700). */
  function revealSkeletons() {
    document.querySelectorAll("[data-loading='true']").forEach((wrap) => {
      const delay = parseInt(wrap.getAttribute("data-load-delay") || "700", 10);
      setTimeout(() => wrap.setAttribute("data-loading", "false"), delay);
    });
  }

  /* ---------- Ripple ---------- */
  function setupRipples() {
    document.querySelectorAll(".ripple-surface").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
        ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNav();
    revealSkeletons();
    setupRipples();
  });
})();

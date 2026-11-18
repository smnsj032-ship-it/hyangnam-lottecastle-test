/* =====================================================================
   화성 향남 롯데캐슬 시그니처 — 2차 시안 (v2) 동작 스크립트
   - 방문예약 2단계 폼 (성함·휴대전화 → 개인정보 동의 → 신청)
   - 평면도 탭 / 단지배치도·평면도 확대 보기
   - 하단 고정 버튼에서 예약 폼으로 이동
   ※ 접수 설정은 아래 RESERVATION_CONFIG 한 곳에서만 바꾸면 됩니다.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     RESERVATION_CONFIG — 접수처를 바꿀 때 이 객체만 수정하세요.
     --------------------------------------------------------------- */
  var RESERVATION_CONFIG = {
    siteId: 'hyangnam',                                   // 사이트 식별자
    siteName: '화성 향남 롯데캐슬 시그니처',
    tel: '1800-6037',                                     // 표시·연결 전화번호
    telHref: 'tel:1800-6037',
    ajaxEndpoint: 'https://formsubmit.co/ajax/smnsj@naver.com',  // 접수 API
    mailSubject: '[화성 향남 롯데캐슬 시그니처] 모델하우스 방문예약 신청',
    mailTemplate: 'table',
    timeoutMs: 15000,
    successMessage: '방문예약 신청이 접수되었습니다.\n담당자가 연락드려 방문 일정을 안내해 드립니다.',
    failMessage: '접수하지 못했습니다. 입력하신 내용은 그대로 남아 있습니다.'
  };

  var $ = function (id) { return document.getElementById(id); };
  var hdr = $('hdr');

  function headerOffset() { return (hdr ? hdr.offsetHeight : 0) + 8; }

  function scrollToEl(el, extra) {
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset() - (extra || 0);
    window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
  }

  /* ---------------------------------------------------------------
     Header shadow
     --------------------------------------------------------------- */
  function onScroll() {
    if (hdr) hdr.classList.toggle('is-scrolled', (window.scrollY || 0) > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     In-page scrolling (bottom bar / last CTA / hero CTA)
     --------------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-scroll]'), function (el) {
    el.addEventListener('click', function (e) {
      var target = $(el.getAttribute('data-scroll'));
      if (!target) return;
      e.preventDefault();
      scrollToEl(target, 0);
      if (history.replaceState) history.replaceState(null, '', '#' + el.getAttribute('data-scroll'));
      if (el.getAttribute('data-scroll') === 'reserve') {
        setTimeout(function () {
          var nameInput = $('rName');
          if (nameInput && document.activeElement !== nameInput && window.innerWidth > 900) {
            nameInput.focus({ preventScroll: true });
          }
        }, 520);
      }
    });
  });

  /* ---------------------------------------------------------------
     Floor plan tabs
     --------------------------------------------------------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  function loadPlan(panel) {
    var img = panel.querySelector('.plan-img');
    if (!img) return;
    var src = img.getAttribute('data-src');
    if (!src || img.getAttribute('src') === src) return;
    img.setAttribute('src', src);
  }

  function syncZoomButton(panel) {
    var btn = panel.querySelector('.btn-zoom');
    if (!btn) return;
    var img = panel.querySelector('.plan-img');
    var type = panel.querySelector('.pi-type');
    if (img && img.getAttribute('data-src')) btn.setAttribute('data-zoom', img.getAttribute('data-src'));
    if (type) btn.setAttribute('data-title', type.textContent.trim().split(' ')[0] + ' 평면도');
  }

  function activateTab(key, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-type') === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
      if (on && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    panels.forEach(function (p) {
      var on = p.id === 'panel-' + key;
      p.classList.toggle('is-active', on);
      if (on) {
        p.hidden = false;
        loadPlan(p);
        syncZoomButton(p);
      } else {
        p.hidden = true;
      }
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activateTab(tab.getAttribute('data-type')); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        activateTab(next.getAttribute('data-type'), true);
      }
    });
  });
  if (panels.length) { panels.forEach(loadPlan); syncZoomButton(panels[0]); }

  /* ---------------------------------------------------------------
     Zoom (단지배치도 / 평면도) — 닫으면 원래 스크롤 위치로 복귀
     --------------------------------------------------------------- */
  var zoom = $('zoom');
  var zoomImg = $('zoomImg');
  var zoomTitle = $('zoomTitle');
  var zoomScroll = $('zoomScroll');
  var zoomSize = $('zoomSize');
  var savedScrollY = 0;
  var lastFocus = null;

  function openZoom(src, title) {
    if (!zoom || !src) return;
    savedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    lastFocus = document.activeElement;
    zoomImg.setAttribute('src', src);
    zoomImg.setAttribute('alt', (title || '도면') + ' 크게 보기');
    zoomTitle.textContent = title || '크게 보기';
    zoomScroll.classList.remove('is-zoomed');
    zoomSize.setAttribute('aria-pressed', 'false');
    zoomSize.textContent = '확대';
    zoom.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflowAnchor = 'none';
    document.body.style.overflowAnchor = 'none';
    var card = zoom.querySelector('.zoom-card');
    if (card) card.focus({ preventScroll: true });
    zoomScroll.scrollTop = 0;
    zoomScroll.scrollLeft = 0;
  }

  function closeZoom() {
    if (!zoom || zoom.hidden) return;
    zoom.hidden = true;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    // 원래 보던 위치로 정확히 돌아간다 (이미지 지연 로딩으로 인한 스크롤 보정 차단)
    window.scrollTo(0, savedScrollY);
    requestAnimationFrame(function () {
      window.scrollTo(0, savedScrollY);
      document.documentElement.style.overflowAnchor = '';
      document.body.style.overflowAnchor = '';
    });
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-zoom]'), function (btn) {
    btn.addEventListener('click', function () {
      openZoom(btn.getAttribute('data-zoom'), btn.getAttribute('data-title'));
    });
  });

  if (zoom) {
    zoom.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-zoom-close')) closeZoom();
    });
  }

  if (zoomSize) {
    zoomSize.addEventListener('click', function () {
      var on = !zoomScroll.classList.contains('is-zoomed');
      zoomScroll.classList.toggle('is-zoomed', on);
      zoomSize.setAttribute('aria-pressed', on ? 'true' : 'false');
      zoomSize.textContent = on ? '원래 크기' : '확대';
      if (!on) { zoomScroll.scrollTop = 0; zoomScroll.scrollLeft = 0; }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && zoom && !zoom.hidden) closeZoom();
  });

  /* ---------------------------------------------------------------
     Reservation form
     --------------------------------------------------------------- */
  var form = $('resvForm');
  var step2 = $('step2');
  var nextBtn = $('nextBtn');
  var st2 = $('st2');
  var submitBtn = $('submitBtn');
  var failBox = $('failBox');
  var donePanel = $('donePanel');
  var retryBtn = $('retryBtn');

  var fName = $('rName');
  var fPhone = $('rPhone');
  var fAgree = $('rAgree');

  var hasErrors = false;

  function digits(v) { return (v || '').replace(/[^0-9]/g, ''); }
  function validPhone(v) { return /^01[016789][0-9]{7,8}$/.test(digits(v)); }

  function formatPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + '-' + d.slice(3);
    if (d.length <= 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  }

  function setErr(input, errId, on) {
    if (!input) return;
    var box = input.closest('.fld') || input.closest('.agree');
    if (box) box.classList.toggle('has-error', on);
    var err = $(errId);
    if (err) err.hidden = !on;
    if (on) hasErrors = true;
  }

  if (fPhone) {
    fPhone.addEventListener('input', function () {
      var formatted = formatPhone(fPhone.value);
      if (formatted !== fPhone.value) {
        var pos = fPhone.selectionStart;
        var len = fPhone.value.length;
        fPhone.value = formatted;
        var delta = formatted.length - len;
        if (pos !== null) {
          try { fPhone.setSelectionRange(pos + delta, pos + delta); } catch (e) {}
        }
      }
      setErr(fPhone, 'ePhone', false);
    });
    fPhone.addEventListener('blur', function () {
      if (fPhone.value && !validPhone(fPhone.value)) setErr(fPhone, 'ePhone', true);
      else setErr(fPhone, 'ePhone', false);
    });
  }

  if (fName) fName.addEventListener('input', function () { setErr(fName, 'eName', false); });
  if (fAgree) fAgree.addEventListener('change', function () { setErr(fAgree, 'eAgree', false); });

  function validStep1() {
    hasErrors = false;
    if (!fName || fName.value.trim().length < 2) setErr(fName, 'eName', true);
    else setErr(fName, 'eName', false);
    if (!fPhone || !validPhone(fPhone.value)) setErr(fPhone, 'ePhone', true);
    else setErr(fPhone, 'ePhone', false);
    return !hasErrors;
  }

  function openStep2() {
    if (!step2 || !step2.hidden) return;
    step2.hidden = false;
    if (st2) st2.classList.add('is-on');
    if (nextBtn) nextBtn.setAttribute('aria-expanded', 'true');
    setTimeout(function () { scrollToEl(step2, 4); }, 80);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (validStep1()) {
        openStep2();
      } else {
        var bad = form.querySelector('.has-error input');
        if (bad) bad.focus({ preventScroll: true });
        scrollToEl(form.querySelector('.has-error'), 90);
      }
    });
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.disabled = on;
    var label = submitBtn.querySelector('.btn-label');
    if (label) label.textContent = on ? '접수 중입니다...' : '방문예약 신청';
  }

  function failText() {
    if (!failBox) return;
    var t = failBox.querySelector('.fail-t');
    if (t) t.textContent = RESERVATION_CONFIG.failMessage;
  }

  function showFail() {
    failText();
    if (failBox) failBox.hidden = false;
    setLoading(false);
    if (failBox) scrollToEl(failBox, 80);
  }

  function hideFail() {
    if (failBox) failBox.hidden = true;
  }

  function showDone() {
    hideFail();
    if (form) form.hidden = true;
    if (donePanel) {
      donePanel.hidden = false;
      var t = donePanel.querySelector('.done-t');
      var s = donePanel.querySelector('.done-s');
      var lines = RESERVATION_CONFIG.successMessage.split('\n');
      if (t && lines[0]) t.textContent = lines[0];
      if (s) s.textContent = lines.slice(1).join(' ') || '';
      scrollToEl(donePanel, 0);
    }
  }

  function nowText() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function submit() {
    hideFail();

    hasErrors = false;
    if (!validStep1()) {
      scrollToEl(form.querySelector('.has-error'), 90);
      return;
    }
    if (!fAgree || !fAgree.checked) {
      setErr(fAgree, 'eAgree', true);
      scrollToEl(form.querySelector('.agree'), 90);
      return;
    }

    var honey = $('honey');
    if (honey && honey.value) return;   // 봇 입력 차단

    var payload = {
      '성함': fName.value.trim(),
      '연락처': fPhone.value.trim(),
      '신청일시': nowText(),
      '유입경로': document.referrer ? document.referrer : '직접 방문',
      '사이트': RESERVATION_CONFIG.siteId,
      '_subject': RESERVATION_CONFIG.mailSubject,
      '_template': RESERVATION_CONFIG.mailTemplate,
      '_captcha': 'false'
    };

    setLoading(true);

    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, RESERVATION_CONFIG.timeoutMs) : null;

    fetch(RESERVATION_CONFIG.ajaxEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().catch(function () { return {}; });
      })
      .then(function (data) {
        // 서버가 접수를 확인한 경우에만 성공으로 처리합니다.
        var ok = data && (data.success === true || data.success === 'true');
        if (!ok) throw new Error('not confirmed: ' + JSON.stringify(data).slice(0, 200));
        setLoading(false);
        showDone();
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        if (window.console && console.warn) console.warn('[reservation] 접수 실패:', err);
        showFail();
      });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit();
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      hideFail();
      submit();
    });
  }

  /* ---------------------------------------------------------------
     Broken image guard (콘솔 경고만)
     --------------------------------------------------------------- */
  Array.prototype.forEach.call(document.images, function (img) {
    img.addEventListener('error', function () {
      if (window.console && console.warn) console.warn('image failed:', img.currentSrc || img.getAttribute('src'));
    });
  });
})();

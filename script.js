/* =====================================================================
   화성 향남 롯데캐슬 시그니처 — Landing Page Script
   ===================================================================== */
(function () {
  'use strict';

  var FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/smnsj@naver.com';
  var FORM_SUBJECT = '[화성 향남 롯데캐슬 시그니처] 신규 관심고객 등록';
  var TEL = '1800-6037';

  var header = document.getElementById('siteHeader');
  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var toTop = document.getElementById('toTop');

  /* ---------------------------------------------------------------
     1. Header state
     --------------------------------------------------------------- */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     2. Mobile menu
     --------------------------------------------------------------- */
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '메뉴 열기');
    document.body.style.overflow = '';
    window.setTimeout(function () { mobileMenu.hidden = true; }, 280);
  }

  function openMenu() {
    mobileMenu.hidden = false;
    // force reflow so the transition plays
    void mobileMenu.offsetHeight;
    mobileMenu.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', '메뉴 닫기');
    document.body.style.overflow = 'hidden';
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      if (menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
      else openMenu();
    });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) closeMenu();
    });
  }

  /* ---------------------------------------------------------------
     3. Anchor scrolling with header offset
     --------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = (header ? header.offsetHeight : 0) + 10;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------------
     4. Reveal on scroll
     --------------------------------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------------
     5. Floor plan tabs
     --------------------------------------------------------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  function loadPlan(panel) {
    var img = panel.querySelector('.plan-img');
    if (!img) return;
    var src = img.getAttribute('data-src');
    if (!src || img.getAttribute('src') === src) return;
    img.classList.add('is-loading');
    var pre = new Image();
    pre.onload = function () {
      img.src = src;
      img.classList.remove('is-loading');
    };
    pre.onerror = function () {
      img.src = src;
      img.classList.remove('is-loading');
    };
    pre.src = src;
  }

  function activateTab(key, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-type') === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) {
      var on = p.id === 'panel-' + key;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
      if (on) loadPlan(p);
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      activateTab(tab.getAttribute('data-type'));
    });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        activateTab(next.getAttribute('data-type'), true);
        next.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    });
  });

  panels.forEach(loadPlan);

  /* ---------------------------------------------------------------
     6. "이 평형 상담 신청" → preselect in form
     --------------------------------------------------------------- */
  var ptype = document.getElementById('ptype');
  document.querySelectorAll('.pi-cta').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-type');
      if (ptype && type) {
        var exists = Array.prototype.some.call(ptype.options, function (o) { return o.value === type; });
        if (exists) ptype.value = type;
      }
      var contact = document.getElementById('contact');
      if (contact) {
        var offset = (header ? header.offsetHeight : 0) + 10;
        var top = contact.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      window.setTimeout(function () {
        var name = document.getElementById('name');
        if (name) name.focus({ preventScroll: true });
      }, 650);
    });
  });

  /* ---------------------------------------------------------------
     7. Privacy detail toggle
     --------------------------------------------------------------- */
  var agreeMore = document.getElementById('agreeMore');
  var agreeBox = document.getElementById('agreeBox');
  if (agreeMore && agreeBox) {
    agreeMore.addEventListener('click', function () {
      var open = agreeBox.hidden;
      agreeBox.hidden = !open;
      agreeMore.setAttribute('aria-expanded', open ? 'true' : 'false');
      agreeMore.textContent = open ? '내용접기' : '내용보기';
    });
  }

  /* ---------------------------------------------------------------
     8. Toast
     --------------------------------------------------------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, ms || 3200);
  }

  /* ---------------------------------------------------------------
     9. Modal (success)
     --------------------------------------------------------------- */
  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var lastFocused = null;

  var MODAL_COPY = {
    done: {
      title: '관심고객 등록이 완료되었습니다',
      body: '담당자(<b>홍윤석 팀장</b>)가 확인 후 순차적으로 연락드리겠습니다.<br>빠른 상담은 <a href="tel:' + TEL + '">' + TEL + '</a>로 연락 주세요.'
    },
    pending: {
      title: '등록 요청을 전송했습니다',
      body: '네트워크 환경에 따라 접수 확인이 늦어질 수 있습니다.<br>확실한 상담을 위해 <a href="tel:' + TEL + '">' + TEL + '</a>로 연락 주시면 바로 안내드리겠습니다.'
    }
  };

  function openModal(mode) {
    if (!modal) return;
    var copy = MODAL_COPY[mode] || MODAL_COPY.done;
    if (modalTitle) modalTitle.textContent = copy.title;
    if (modalBody) modalBody.innerHTML = copy.body;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var focusTarget = modal.querySelector('.modal-actions .btn');
    if (focusTarget) focusTarget.focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------------------------------------------------------------
     10. Form
     --------------------------------------------------------------- */
  var form = document.getElementById('interestForm');
  var submitBtn = document.getElementById('submitBtn');
  var formNote = document.getElementById('formNote');

  var fields = {
    name: document.getElementById('name'),
    phone: document.getElementById('phone'),
    ptype: document.getElementById('ptype'),
    agree: document.getElementById('agree')
  };

  function setError(el, errId, on) {
    if (!el) return;
    var wrap = el.closest('.field') || el.closest('.agree');
    if (wrap) wrap.classList.toggle('has-error', on);
    var err = document.getElementById(errId);
    if (err) err.hidden = !on;
  }

  function digits(v) { return (v || '').replace(/[^0-9]/g, ''); }

  function validPhone(v) {
    var d = digits(v);
    return /^01[016789][0-9]{7,8}$/.test(d);
  }

  function formatPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + '-' + d.slice(3);
    if (d.length <= 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  }

  if (fields.phone) {
    fields.phone.addEventListener('input', function () {
      var pos = fields.phone.selectionStart;
      var before = fields.phone.value.length;
      fields.phone.value = formatPhone(fields.phone.value);
      // keep the caret roughly in place while formatting
      var delta = fields.phone.value.length - before;
      if (pos !== null) {
        try { fields.phone.setSelectionRange(pos + delta, pos + delta); } catch (err) {}
      }
      setError(fields.phone, 'err-phone', false);
    });
  }
  ['name', 'ptype', 'agree'].forEach(function (k) {
    var el = fields[k];
    if (!el) return;
    el.addEventListener('input', function () {
      var map = { name: 'err-name', ptype: 'err-ptype', agree: 'err-agree' };
      setError(el, map[k], false);
    });
    el.addEventListener('change', function () {
      var map = { name: 'err-name', ptype: 'err-ptype', agree: 'err-agree' };
      setError(el, map[k], false);
    });
  });

  function validate() {
    var ok = true;
    var name = fields.name ? fields.name.value.trim() : '';
    if (name.length < 2) { setError(fields.name, 'err-name', true); ok = false; }
    if (!validPhone(fields.phone ? fields.phone.value : '')) { setError(fields.phone, 'err-phone', true); ok = false; }
    if (!fields.ptype || !fields.ptype.value) { setError(fields.ptype, 'err-ptype', true); ok = false; }
    if (!fields.agree || !fields.agree.checked) { setError(fields.agree, 'err-agree', true); ok = false; }
    return ok;
  }

  /* AJAX(CORS) 가 막힌 환경을 위한 보조 전송 — 숨은 iframe 으로 일반 POST */
  function postNative(payload) {
    try {
      var f = document.createElement('form');
      f.method = 'POST';
      f.action = 'https://formsubmit.co/smnsj@naver.com';
      f.target = 'fsFrame';
      f.style.display = 'none';
      Object.keys(payload).forEach(function (k) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = payload[k];
        f.appendChild(input);
      });
      document.body.appendChild(f);
      f.submit();
      window.setTimeout(function () {
        if (f.parentNode) f.parentNode.removeChild(f);
      }, 4000);
      return true;
    } catch (err) {
      return false;
    }
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.disabled = on;
    var label = submitBtn.querySelector('.btn-label');
    if (label) label.textContent = on ? '등록 중입니다...' : '관심고객 등록하기';
  }

  function noteError() {
    if (!formNote) return;
    formNote.classList.add('is-error');
    formNote.innerHTML = '등록 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 ' +
      '<a href="tel:' + TEL + '">' + TEL + '</a>로 전화 주시면 바로 안내드리겠습니다.';
  }

  function noteDefault() {
    if (!formNote) return;
    formNote.classList.remove('is-error');
    formNote.textContent = '남겨주신 정보는 분양 상담 목적으로만 사용됩니다.';
  }

  function nowText() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      noteDefault();

      if (!validate()) {
        var firstErr = form.querySelector('.has-error');
        if (firstErr) {
          var y = firstErr.getBoundingClientRect().top + window.pageYOffset - 130;
          window.scrollTo({ top: y, behavior: 'smooth' });
          var input = firstErr.querySelector('input, select');
          if (input) input.focus({ preventScroll: true });
        }
        showToast('입력하지 않았거나 잘못된 항목이 있습니다.');
        return;
      }

      var honey = document.getElementById('_honey');
      if (honey && honey.value) return; // bot

      var payload = {
        '이름': fields.name.value.trim(),
        '연락처': fields.phone.value.trim(),
        '관심평형': fields.ptype.value,
        '문의내용': (document.getElementById('msg') || {}).value || '-',
        '등록일시': nowText(),
        '유입경로': document.referrer ? document.referrer : '직접 방문',
        '_subject': FORM_SUBJECT,
        '_template': 'table',
        '_captcha': 'false'
      };

      setLoading(true);

      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timer = controller ? window.setTimeout(function () { controller.abort(); }, 15000) : null;

      fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function (data) {
          if (timer) clearTimeout(timer);
          setLoading(false);
          form.reset();
          openModal();
        })
        .catch(function (err) {
          if (timer) clearTimeout(timer);
          setLoading(false);
          if (window.console && console.warn) console.warn('[interest form] ajax failed, trying native post:', err);
          // 2차 경로: 일반 폼 전송 (CORS 영향 없음)
          var sent = postNative(payload);
          showToast(sent ? '등록 요청을 전송했습니다.' : '등록에 실패했습니다. ' + TEL + '로 연락 주세요.', 3600);
          if (sent) {
            form.reset();
            noteDefault();
            openModal('pending');
          } else {
            noteError();
          }
        });
    });
  }

  /* ---------------------------------------------------------------
     11. Image fallback guard (mark broken images for debugging)
     --------------------------------------------------------------- */
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.style.background = '#EEE';
      if (window.console && console.warn) console.warn('image failed:', img.src);
    });
  });
})();

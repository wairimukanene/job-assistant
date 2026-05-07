(function () {
  function textOf(el) {
    if (!el) return '';
    return (el.innerText || el.textContent || '').trim();
  }

  function fieldKey(input) {
    const attrs = [
      input.name,
      input.id,
      input.getAttribute('aria-label'),
      input.getAttribute('placeholder'),
      textOf(input.closest('label')),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return attrs;
  }

  function readRoleAndCompany() {
    const title = document.title || '';
    const h1 = document.querySelector('h1');
    const role = textOf(h1) || title;
    const host = (location.hostname || '').replace(/^www\./, '');
    const co = host.split('.')[0] || 'Unknown company';
    return { role: role.slice(0, 120), co: co.slice(0, 80) };
  }

  function captureDraft() {
    const { role, co } = readRoleAndCompany();
    const fields = [];
    const selectors = 'input, textarea, select';
    document.querySelectorAll(selectors).forEach((el) => {
      const type = (el.type || '').toLowerCase();
      if (['hidden', 'submit', 'button', 'reset', 'file', 'image'].includes(type)) return;
      const key = fieldKey(el);
      if (!key) return;
      fields.push({
        name: key.slice(0, 120),
        value: '',
      });
    });
    return {
      role: role || 'Untitled role',
      co: co || 'Unknown company',
      type: 'Other',
      sourceUrl: location.href,
      fields: fields.slice(0, 80),
    };
  }

  function mapFromCv(profile, nameKey) {
    const cv = profile || {};
    if (/first.?name/.test(nameKey)) return cv.firstName || '';
    if (/last.?name|surname/.test(nameKey)) return cv.lastName || '';
    if (/full.?name|your name|name/.test(nameKey)) return cv.fullName || '';
    if (/email/.test(nameKey)) return cv.email || '';
    if (/phone|mobile|tel/.test(nameKey)) return cv.phone || '';
    if (/linkedin/.test(nameKey)) return cv.linkedin || '';
    if (/github/.test(nameKey)) return cv.github || '';
    if (/portfolio|website/.test(nameKey)) return cv.website || '';
    if (/cover.?letter|motivation/.test(nameKey)) return cv.coverLetter || '';
    return '';
  }

  function previewAutofill() {
    chrome.storage.local.get(['ap_cv_profile'], (res) => {
      const profile = res.ap_cv_profile || {};
      document.querySelectorAll('input, textarea, select').forEach((el) => {
        const type = (el.type || '').toLowerCase();
        if (['hidden', 'submit', 'button', 'reset', 'file', 'image'].includes(type)) return;
        const key = fieldKey(el);
        const val = mapFromCv(profile, key);
        if (!val) return;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'AP_CAPTURE_DRAFT') {
      sendResponse({ ok: true, draft: captureDraft() });
      return true;
    }
    if (msg.type === 'AP_PREVIEW_AUTOFILL') {
      previewAutofill();
      sendResponse({ ok: true });
      return true;
    }
  });
})();

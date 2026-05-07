function byId(id) {
  return document.getElementById(id);
}

function getProfileFromUI() {
  return {
    appUrl: byId('p-appUrl').value.trim() || 'http://localhost:3000',
    fullName: byId('p-fullName').value.trim(),
    firstName: (byId('p-fullName').value.trim().split(' ')[0] || ''),
    lastName: (byId('p-fullName').value.trim().split(' ').slice(1).join(' ') || ''),
    email: byId('p-email').value.trim(),
    phone: byId('p-phone').value.trim(),
    linkedin: byId('p-linkedin').value.trim(),
    github: byId('p-github').value.trim(),
    website: byId('p-website').value.trim(),
    coverLetter: byId('p-coverLetter').value.trim(),
  };
}

function setProfileToUI(p) {
  byId('p-appUrl').value = p.appUrl || 'http://localhost:3000';
  byId('p-fullName').value = p.fullName || '';
  byId('p-email').value = p.email || '';
  byId('p-phone').value = p.phone || '';
  byId('p-linkedin').value = p.linkedin || '';
  byId('p-github').value = p.github || '';
  byId('p-website').value = p.website || '';
  byId('p-coverLetter').value = p.coverLetter || '';
}

function withActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    cb(tab.id);
  });
}

chrome.storage.local.get(['ap_cv_profile'], (res) => {
  setProfileToUI(res.ap_cv_profile || {});
});

byId('saveProfile').addEventListener('click', () => {
  chrome.storage.local.set({ ap_cv_profile: getProfileFromUI() }, () => {
    byId('out').textContent = 'Profile saved.';
  });
});

byId('previewFill').addEventListener('click', () => {
  withActiveTab((tabId) => {
    chrome.tabs.sendMessage(tabId, { type: 'AP_PREVIEW_AUTOFILL' }, () => {
      byId('out').textContent = 'Preview fill applied on current tab. Review before any submit.';
    });
  });
});

byId('captureDraft').addEventListener('click', () => {
  withActiveTab((tabId) => {
    chrome.tabs.sendMessage(tabId, { type: 'AP_CAPTURE_DRAFT' }, (res) => {
      const draft = (res && res.draft) || {};
      byId('out').textContent = JSON.stringify(draft, null, 2);
      chrome.storage.local.set({ ap_last_draft: draft });
    });
  });
});

byId('sendDraft').addEventListener('click', () => {
  chrome.storage.local.get(['ap_last_draft', 'ap_cv_profile'], async (res) => {
    const draft = res.ap_last_draft;
    const profile = res.ap_cv_profile || {};
    const appUrl = (profile.appUrl || byId('p-appUrl').value || 'http://localhost:3000').replace(/\/$/, '');
    if (!draft || !draft.sourceUrl) {
      byId('out').textContent = 'Capture a draft first.';
      return;
    }
    try {
      const response = await fetch(appUrl + '/api/autoapply/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        byId('out').textContent = 'Failed to send draft. Ensure Apply Pilot is running.';
        return;
      }
      byId('out').textContent = 'Draft sent. Open Apply Pilot > Auto-Apply and click "Sync extension drafts".';
    } catch (e) {
      byId('out').textContent = 'Network error sending draft to app.';
    }
  });
});

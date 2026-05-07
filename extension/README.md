# Apply Pilot Browser Extension (Phase 6)

## What it does
- Reads application form fields on the current page
- Previews autofill from your saved profile (no auto-submit)
- Captures a draft payload JSON for manual review in the web app

## Install (Chrome)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this `extension/` folder

## Use
1. Open extension popup and save your profile details.
2. On a job application page:
   - Click **Preview autofill** to fill obvious fields locally.
   - Click **Capture draft** to produce JSON payload.
   - Click **Send draft to app** for direct sync.
3. In `Apply Pilot` -> `Auto-Apply`, click **Sync extension drafts**.
4. Approve or reject in queue.

## Safety
- The extension does **not** submit forms.
- App queue enforces manual approval before tracking as an application.

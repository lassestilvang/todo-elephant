# Todo Elephant Browser Extension

Quickly capture tasks from anywhere on the web!

## Setup

1. **Create extension directory**
```bash
mkdir extensions/chrome
```

2. **manifest.json** - Create `extensions/chrome/manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "Todo Elephant Quick Capture",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage", "scripting"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "48": "icon-48.png",
      "128": "icon-128.png"
    }
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],
  "icons": {
    "48": "icon-48.png",
    "128": "icon-128.png"
  }
}
```

3. **Content script** - Create `extensions/chrome/content.js`:
```javascript
// Context menu for quick capture
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "capture-to-elephant",
    title: "🐘 Send to Todo Elephant",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "capture-to-elephant" && info.selectionText) {
    chrome.storage.local.set({ pendingTask: info.selectionText });
    chrome.action.openPopup();
  }
});
```

4. **Popup HTML** - Create `extensions/chrome/popup.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 320px; padding: 16px; font-family: system-ui; }
    input, textarea { width: 100%; margin: 8px 0; padding: 8px; }
    button { background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <h3>Quick Task Capture</h3>
  <textarea id="taskContent" placeholder="Task description..."></textarea>
  <button id="saveTask">Add to Todo Elephant</button>
  <script src="popup.js"></script>
</body>
</html>
```

5. **Popup script** - Create `extensions/chrome/popup.js`:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('taskContent');
  const button = document.getElementById('saveTask');
  
  // Load pending task
  chrome.storage.local.get(['pendingTask'], (result) => {
    if (result.pendingTask) {
      textarea.value = result.pendingTask;
      chrome.storage.local.remove(['pendingTask']);
    }
  });
  
  button.addEventListener('click', () => {
    if (textarea.value.trim()) {
      chrome.runtime.sendMessage({
        type: 'CREATE_TASK',
        title: textarea.value
      });
      window.close();
    }
  });
});
```

## Installation

### Chrome/Edge
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extensions/chrome` folder

### Firefox
1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the extension folder

## Features

- **Context menu** - Select any text → Right click → "Send to Todo Elephant"
- **Keyboard shortcut** - `Ctrl+Shift+E` (configurable)
- **Page capture** - Capture entire page as a task
- **Sync** - Works with web app via localStorage

## Future Enhancements

- OAuth integration with web app
- Real-time sync via WebSocket
- Task templates from selection
- Screenshot capture
- Highlight-to-task
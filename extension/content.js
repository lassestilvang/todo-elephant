// Todo Elephant Browser Extension Content Script
// Allows capturing text and links from any webpage

(function() {
  'use strict';

  // Create the todo-elephant button
  function createCaptureButton() {
    const button = document.createElement('button');
    button.id = 'todo-elephant-capture-btn';
    button.innerHTML = '🐘';
    button.title = 'Add to Todo Elephant';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #22c55e;
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
    });

    button.addEventListener('click', () => {
      captureCurrentPage();
    });

    document.body.appendChild(button);
  }

  // Capture current page as a task
  async function captureCurrentPage() {
    const selection = window.getSelection().toString().trim();
    const title = selection || document.title;
    const url = window.location.href;

    const task = {
      title: title,
      description: `Captured from: ${url}`,
      url: url,
      source: 'browser-extension'
    };

    // Send to background script
    chrome.runtime.sendMessage({
      action: 'captureTask',
      task: task
    });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-192.png'),
      title: 'Todo Elephant',
      message: 'Task captured!',
      timeout: 2000
    });
  }

  // Highlight selected text
  function highlightSelection() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
      span.style.borderRadius = '2px';
      range.surroundContents(span);
    }
  }

  // Initialize when page loads
  document.addEventListener('DOMContentLoaded', () => {
    // Only show button on non-extension pages
    if (!window.location.hostname.includes('todo-elephant')) {
      createCaptureButton();
    }
  });

  // Keyboard shortcut: Ctrl+Shift+E (or Cmd+Shift+E on Mac)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      captureCurrentPage();
    }
  });

  // Right-click context menu (if supported)
  if (chrome.contextMenus) {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.contextMenus.create({
        id: 'todo-elephant-add',
        title: 'Add to Todo Elephant',
        contexts: ['selection', 'page']
      });
    });
  }
})();
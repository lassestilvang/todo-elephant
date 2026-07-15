// Todo Elephant Browser Extension Popup Script

document.addEventListener('DOMContentLoaded', function() {
  const taskInput = document.getElementById('task-input');
  const addTaskBtn = document.getElementById('add-task');
  const quickAddBtn = document.getElementById('quick-add');
  const openAppBtn = document.getElementById('open-app');
  const autoDetectCheckbox = document.getElementById('auto-detect');
  const syncDefaultCheckbox = document.getElementById('sync-default');

  // Load saved settings
  chrome.storage.sync.get({
    autoDetect: true,
    syncDefault: true,
    accessToken: ''
  }, function(items) {
    autoDetectCheckbox.checked = items.autoDetect;
    syncDefaultCheckbox.checked = items.syncDefault;
  });

  // Auto-detect text selection
  if (autoDetectCheckbox.checked) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getSelectionText
      }, function(results) {
        if (results && results[0]) {
          taskInput.value = results[0].result;
        }
      });
    });
  }

  // Add task button
  addTaskBtn.addEventListener('click', async function() {
    const taskText = taskInput.value.trim();
    if (!taskText) {
      alert('Please enter a task description');
      return;
    }

    const accessToken = await getAccessToken();
    const success = await addTaskToTodoElephant(taskText, accessToken);

    if (success) {
      taskInput.value = '';
      showNotification('Task added!');
    }
  });

  // Quick add button
  quickAddBtn.addEventListener('click', async function() {
    const taskText = taskInput.value.trim() || 'New task';
    const accessToken = await getAccessToken();
    const success = await addTaskToTodoElephant(taskText, accessToken);

    if (success) {
      taskInput.value = '';
      showNotification('Quick task added!');
    }
  });

  // Open app button
  openAppBtn.addEventListener('click', function() {
    chrome.tabs.create({url: 'http://localhost:3000'});
  });

  // Save settings
  autoDetectCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({autoDetect: this.checked});
  });

  syncDefaultCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({syncDefault: this.checked});
  });

  // Get access token from storage
  async function getAccessToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['accessToken'], function(items) {
        resolve(items.accessToken || '');
      });
    });
  }

  // Add task to Todo Elephant API
  async function addTaskToTodoElephant(taskText, accessToken) {
    if (!accessToken || !syncDefaultCheckbox.checked) {
      // Store locally if no token
      await storeTaskLocally(taskText);
      return true;
    }

    try {
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: taskText,
          status: 'todo',
          priority: 'medium'
        })
      });

      if (response.ok) {
        return true;
      } else {
        // Fallback to local storage
        await storeTaskLocally(taskText);
        return true;
      }
    } catch (error) {
      console.error('Failed to add task:', error);
      await storeTaskLocally(taskText);
      return true;
    }
  }

  // Store task locally
  async function storeTaskLocally(taskText) {
    const storedTasks = JSON.parse(localStorage.getItem('todo-elephant-captured') || '[]');
    storedTasks.push({
      id: Date.now(),
      title: taskText,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('todo-elephant-captured', JSON.stringify(storedTasks));
  }

  // Show notification
  function showNotification(message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../public/icon-192.png',
      title: 'Todo Elephant',
      message: message,
      timeout: 2000
    });
  }
});

// Function to get selected text from page
function getSelectionsText() {
  return window.getSelection().toString().trim();
}
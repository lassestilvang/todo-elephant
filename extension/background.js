// Todo Elephant Browser Extension Background Script

// Store pending tasks
let pendingTasks = [];

// Sync with Todo Elephant API
async function syncWithAPI() {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  for (const task of pendingTasks) {
    try {
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(task)
      });

      if (response.ok) {
        // Remove synced task
        pendingTasks = pendingTasks.filter(t => t.id !== task.id);
        savePendingTasks(pendingTasks);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// Save pending tasks to storage
function savePendingTasks(tasks) {
  chrome.storage.local.set({ pendingTasks: tasks });
}

// Get access token
async function getAccessToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken'], function(items) {
      resolve(items.accessToken || '');
    });
  });
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'captureTask':
      handleCaptureTask(message.task);
      sendResponse({ success: true });
      break;

    case 'getPendingTasks':
      getPendingTasks().then(tasks => sendResponse({ tasks }));
      break;

    case 'syncTasks':
      syncWithAPI().then(() => sendResponse({ success: true }));
      break;

    default:
      console.warn('Unknown action:', message.action);
  }

  // Return true to indicate async response
  return true;
});

// Handle captured task
async function handleCaptureTask(task) {
  const accessToken = await getAccessToken();

  if (accessToken) {
    // Try to sync immediately
    try {
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          source: task.source
        })
      });

      if (!response.ok) {
        // Add to pending if sync fails
        addToPendingTasks(task);
      }
    } catch (error) {
      addToPendingTasks(task);
    }
  } else {
    // Store locally if not authenticated
    addToPendingTasks(task);
  }
}

// Add task to pending list
function addToPendingTasks(task) {
  const newTask = {
    ...task,
    id: Date.now() + Math.random(),
    createdAt: new Date().toISOString()
  };

  pendingTasks.push(newTask);
  savePendingTasks(pendingTasks);
}

// Get pending tasks
function getPendingTasks() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['pendingTasks'], function(items) {
      pendingTasks = items.pendingTasks || [];
      resolve(pendingTasks);
    });
  });
}

// Load pending tasks on startup
chrome.runtime.onStartup.addListener(() => {
  getPendingTasks();
});

// Periodically sync pending tasks
setInterval(syncWithAPI, 30000); // Every 30 seconds

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Set default options
  chrome.storage.sync.set({
    autoDetect: true,
    syncDefault: true
  });

  // Create context menu
  chrome.contextMenus.create({
    id: 'todo-elephant-add-selection',
    title: 'Add "%s" to Todo Elephant',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'todo-elephant-add-selection') {
    const task = {
      title: info.selectionText,
      description: `Captured from: ${tab.url}`,
      url: tab.url,
      source: 'context-menu'
    };
    handleCaptureTask(task);
  }
});
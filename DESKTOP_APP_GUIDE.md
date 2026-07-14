# Todo Elephant Desktop App Guide (Tauri)

Package Todo Elephant as a native desktop application!

## Why Tauri?

- Native performance with Rust backend
- Tiny bundle size (<10MB)
- System tray integration
- Offline-first with local storage
- Cross-platform (Windows, macOS, Linux)

## Setup

1. **Install Rust**
```bash
# macOS
brew install rustup
rustup install stable

# Windows
winget install Rustlang.Rustup
```

2. **Create Tauri project**
```bash
# In project root
npm install -g @tauri-apps/cli
npm install --save-dev @tauri-apps/cli
```

3. **Configure tauri.conf.json** - Update `tauri.conf.json`:
```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevPath": "npm run dev"
  },
  "tauri": {
    "windows": [
      {
        "title": "Todo Elephant",
        "width": 1200,
        "height": 800,
        "resizable": true
      }
    ]
  }
}
```

4. **System Tray Integration** - Create `src-tauri/src/tray.rs`:
```rust
use tauri::{Manager, SystemTray, SystemTrayEvent};

fn create_tray() -> SystemTray {
    SystemTray::new().on_event(|app: &tauri::AppHandle, event: SystemTrayEvent| {
        match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::RightClick { .. } => {
                // Show context menu
            }
        }
    })
}
```

5. **Auto-updater configuration**
```json
{
  "tauri": {
    "updater": {
      "endpoints": ["https://your-domain.com/api/updater"]
    }
  }
}
```

## Build

```bash
# Development
npm run tauri dev

# Production
npm run tauri build
```

## Desktop-Specific Features

- **Global hotkey** - `Ctrl+Alt+E` to quick add task from anywhere
- **System tray** - Quick access even when minimized
- **Native notifications** - Reminders and streak alerts
- **File system integration** - Import/export tasks
- **Window state persistence** - Remember your layout

## Distribution

- Code signing for macOS
- Windows installer with NSIS
- AppImage for Linux
- GitHub releases auto-publish
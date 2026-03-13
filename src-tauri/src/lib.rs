use tauri::Manager;

/// Apply or remove screen-capture exclusion for the given window.
fn set_capture_exclusion(window: &tauri::WebviewWindow, exclude: bool) {
    #[cfg(target_os = "windows")]
    {
        use winapi::um::winuser::SetWindowDisplayAffinity;
        use winapi::shared::windef::HWND;
        const WDA_EXCLUDEFROMCAPTURE: u32 = 0x00000011;
        const WDA_NONE: u32 = 0x00000000;
        let affinity = if exclude { WDA_EXCLUDEFROMCAPTURE } else { WDA_NONE };
        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                SetWindowDisplayAffinity(hwnd.0 as HWND, affinity);
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        use objc::{msg_send, sel, sel_impl};
        use objc::runtime::Object;
        if let Ok(ptr) = window.ns_window() {
            let ns_win = ptr as *mut Object;
            unsafe {
                // 0 = NSWindowSharingNone, 1 = NSWindowSharingReadOnly
                let sharing_type: u64 = if exclude { 0 } else { 1 };
                let _: () = msg_send![ns_win, setSharingType: sharing_type];
            }
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = (window, exclude);
    }
}

/// Tauri command: toggle stealth mode (capture exclusion) from the frontend.
#[tauri::command]
fn set_stealth(window: tauri::WebviewWindow, enabled: bool) {
    set_capture_exclusion(&window, enabled);
}

/// Compute DPI-aware window dimensions and margin for the current monitor.
fn window_metrics(monitor: &tauri::Monitor) -> (i32, i32, i32, i32, i32) {
    let screen = monitor.size();
    let scale = monitor.scale_factor();
    let win_w = (280.0 * scale) as i32;
    let win_h = (600.0 * scale) as i32;
    let margin = (24.0 * scale) as i32;
    (screen.width as i32, screen.height as i32, win_w, win_h, margin)
}

/// Tauri command: snap window to a named screen position.
/// Accepts: "right", "left", "top-right", "bottom-right", "top-left", "bottom-left"
#[tauri::command]
fn snap_window(window: tauri::WebviewWindow, position: String) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let (sw, sh, ww, wh, m) = window_metrics(&monitor);

        let (x, y) = match position.as_str() {
            "right"        => (sw - ww - m, (sh - wh) / 2),
            "left"         => (m,            (sh - wh) / 2),
            "top-right"    => (sw - ww - m,  m),
            "bottom-right" => (sw - ww - m,  sh - wh - m),
            "top-left"     => (m,            m),
            "bottom-left"  => (m,            sh - wh - m),
            _ => return,
        };

        let _ = window.set_position(tauri::Position::Physical(
            tauri::PhysicalPosition { x, y },
        ));
    }
}

fn position_on_right(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let (sw, sh, ww, wh, m) = window_metrics(&monitor);
        let x = sw - ww - m;
        let y = (sh - wh) / 2;
        let _ = window.set_position(tauri::Position::Physical(
            tauri::PhysicalPosition { x, y },
        ));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            position_on_right(&window);
            set_capture_exclusion(&window, true); // stealth on by default
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_stealth, snap_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

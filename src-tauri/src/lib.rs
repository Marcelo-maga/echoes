use tauri::Manager;

#[cfg(target_os = "macos")]
fn exclude_from_capture(window: &tauri::WebviewWindow) {
    use objc::{msg_send, sel, sel_impl};
    use objc::runtime::Object;
    if let Ok(ptr) = window.ns_window() {
        let ns_win = ptr as *mut Object;
        unsafe {
            // NSWindowSharingNone = 0
            let _: () = msg_send![ns_win, setSharingType: 0u64];
        }
    }
}

#[cfg(target_os = "windows")]
fn exclude_from_capture(window: &tauri::WebviewWindow) {
    use winapi::um::winuser::SetWindowDisplayAffinity;
    use winapi::shared::windef::HWND;
    const WDA_EXCLUDEFROMCAPTURE: u32 = 0x00000011;
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            SetWindowDisplayAffinity(hwnd.0 as HWND, WDA_EXCLUDEFROMCAPTURE);
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn exclude_from_capture(_window: &tauri::WebviewWindow) {}

fn position_on_right(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let screen = monitor.size();
        let win_w = 280_i32;
        let win_h = 600_i32;
        let margin = 24_i32;
        let x = screen.width as i32 - win_w - margin;
        let y = (screen.height as i32 - win_h) / 2;
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
            exclude_from_capture(&window);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

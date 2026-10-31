// Su_AdBlock — Global Error Guard
// Intercepts unhandled promise rejections from ONNX/Webpack/WASM so they
// never leak raw bundled code into the console as a noisy red error.
// Loaded as a plain <script src="error-guard.js"> to satisfy MV3 CSP ('self' only, no 'unsafe-inline').
window.addEventListener('unhandledrejection', function (event) {
  var reason = event.reason;
  var msg = (reason && reason.message) ? String(reason.message) : String(reason);
  // Suppress ONNX / webpack / wasm internal failures silently
  if (
    msg.includes('__webpack') ||
    msg.includes('ort-wasm') ||
    msg.includes('SharedArrayBuffer') ||
    msg.includes('no available backend') ||
    msg.includes('wasm streaming compile') ||
    msg.includes('WebAssembly') ||
    msg.length > 500
  ) {
    event.preventDefault(); // stop Chrome from logging the massive dump
    console.warn('[Su_AdBlock] ONNX/WASM init note (suppressed):', msg.slice(0, 150));
  }
});

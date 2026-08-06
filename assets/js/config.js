/* =========================================================
   Pink Lemon — deploy config
   ========================================================= */
// Same-origin by default — correct when the site and backend are served
// together (e.g. running backend/server.js locally, or a single-host deploy).
//
// If you split the deploy (static frontend on Vercel + backend on Render/Fly/etc.),
// set this to your backend's full URL, no trailing slash:
//   window.PL_API_BASE = "https://pink-lemon.onrender.com";
window.PL_API_BASE = "";

/* v2.0 changelog information dialog. UI-only; does not modify quiz scoring. */
(() => {
  const infoToggle = document.getElementById('infoToggle');
  const infoModal = document.getElementById('infoModal');
  const infoModalClose = document.getElementById('infoModalClose');
  const infoModalBackdrop = infoModal?.querySelector('[data-info-close]');
  if (!infoToggle || !infoModal) return;

  let returnFocus = null;
  const setOpen = open => {
    infoModal.classList.toggle('hidden', !open);
    infoModal.setAttribute('aria-hidden', String(!open));
    infoToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('info-modal-open', open);
    if (open) {
      returnFocus = document.activeElement;
      infoModalClose?.focus();
    } else {
      returnFocus?.focus?.();
      returnFocus = null;
    }
  };

  infoToggle.addEventListener('click', () => setOpen(infoModal.classList.contains('hidden')));
  infoModalClose?.addEventListener('click', () => setOpen(false));
  infoModalBackdrop?.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !infoModal.classList.contains('hidden')) {
      event.preventDefault();
      setOpen(false);
    }
  });

  const style = document.createElement('style');
  style.id = 'infoModalStyles';
  style.textContent = `
    .info-toggle{min-width:40px!important;padding:0 11px!important;font-size:18px!important;line-height:1!important}
    .info-toggle-icon{font-family:"Segoe UI Symbol","Arial Unicode MS",sans-serif;font-size:18px;line-height:1;display:inline-block}
    .info-modal-open{overflow:hidden}
    .info-modal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;box-sizing:border-box}
    .info-modal.hidden{display:none!important}
    .info-modal-backdrop{position:absolute;inset:0;background:rgba(9,20,32,.62);backdrop-filter:blur(2px)}
    .info-modal-window{position:relative;z-index:1;width:min(570px,100%);max-height:min(720px,calc(100vh - 40px));overflow:auto;border:1px solid #d1dee6;border-radius:15px;background:#fffdf9;color:#405666;box-shadow:0 20px 60px rgba(16,33,48,.3)}
    .info-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 19px 13px;border-bottom:1px solid #dfe7eb}
    .info-modal-kicker{color:#5b7e94;font-size:10px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
    .info-modal-head h2{margin:3px 34px 0 0;color:#315e79;font-size:21px;line-height:1.18}
    .info-modal-close{width:34px;height:34px;flex:0 0 auto;padding:0;border:1px solid #bfd0d9;border-radius:9px;background:#f6fafc;color:#5f7380;font-size:24px;line-height:1;cursor:pointer}
    .info-modal-close:hover,.info-modal-close:focus-visible{border-color:#8eb2ca;background:#edf6fb;outline:none}
    .info-modal-body{padding:17px 19px 19px}
    .info-modal-body h3{margin:0 0 6px;color:#315e79;font-size:13px;font-weight:900}
    .info-modal-body h3:not(:first-child){margin-top:17px}
    .info-modal-body p,.info-modal-body li{color:#647781;font-size:12px;line-height:1.55}
    .info-modal-body p{margin:0}
    .info-modal-body ul{margin:0;padding-left:19px}
    .info-modal-body li+li{margin-top:4px}
    .info-modal-body strong{color:#4f8d49}
    .info-modal-footer-note{margin-top:18px!important;padding-top:12px;border-top:1px solid #dfe7eb;text-align:center}
    body.night-mode .info-modal-backdrop{background:rgba(3,9,16,.72)}
    body.night-mode .info-modal-window{border-color:#40586e;background:#17283a;box-shadow:0 20px 60px rgba(0,0,0,.48)}
    body.night-mode .info-modal-head{border-bottom-color:#30485d}
    body.night-mode .info-modal-kicker{color:#84a8c3}
    body.night-mode .info-modal-head h2,body.night-mode .info-modal-body h3{color:#bdd0dd}
    body.night-mode .info-modal-close{border-color:#4a6278;background:#203449;color:#c1d1dd}
    body.night-mode .info-modal-close:hover,body.night-mode .info-modal-close:focus-visible{border-color:#6f91a9;background:#294159}
    body.night-mode .info-modal-body p,body.night-mode .info-modal-body li{color:#9db1bf}
    body.night-mode .info-modal-body strong{color:#9bc08d}
    body.night-mode .info-modal-footer-note{border-top-color:#30485d}
    @media(max-width:650px){
      .info-toggle{min-width:40px!important;padding:0 10px!important}
      .info-modal{padding:10px}
      .info-modal-window{max-height:calc(100vh - 20px);border-radius:13px}
      .info-modal-head{padding:15px 15px 11px}
      .info-modal-body{padding:14px 15px 16px}
      .info-modal-head h2{font-size:19px}
    }
  `;
  document.head.appendChild(style);
})();

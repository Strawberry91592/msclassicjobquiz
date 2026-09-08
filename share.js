(() => {
  const SHARE_TITLE = 'MapleStory Classic World Job Quiz';
  const SHARE_TEXT = 'Find out which MS Classic World Job best matches your playstyle.';
  const SHARE_ICON = '<svg class="share-dialog-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11C16.5 7.69 17.21 8 18 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.91-2.92-2.91z" fill="currentColor"/></svg>';

  const button = document.getElementById('shareToggle');
  if (!button) return;

  const fallback = document.createElement('section');
  fallback.id = 'shareModal';
  fallback.className = 'share-modal';
  fallback.hidden = true;
  fallback.setAttribute('role', 'dialog');
  fallback.setAttribute('aria-modal', 'true');
  fallback.setAttribute('aria-labelledby', 'shareModalTitle');
  fallback.innerHTML = `
    <div class="share-dialog panel">
      <div class="share-dialog-titlebar">
        <div class="share-dialog-titlebar-left">
          <span class="share-dialog-icon" aria-hidden="true">${SHARE_ICON}</span>
          <span>SHARE QUIZ</span>
        </div>
        <button class="share-close-btn" type="button" aria-label="Close share dialog" title="Close">×</button>
      </div>
      <div class="share-dialog-content">
        <div class="share-dialog-head">
          <div>
            <div class="share-dialog-kicker">MAPLESTORY CLASSIC WORLD</div>
            <h2 id="shareModalTitle">Share the quiz</h2>
            <p>Send this quiz to someone and let them find their 2nd Job match.</p>
          </div>
        </div>
        <button id="copyShareLink" class="share-copy-btn" type="button">
          <span class="share-option-icon" aria-hidden="true">⧉</span>
          <span><strong>Copy Link</strong><small id="copyShareStatus">Copy the quiz link to your clipboard.</small></span>
        </button>
        <div class="share-divider"><span>Share via</span></div>
        <div class="share-platform-grid">
          <a data-share-platform="whatsapp" href="#" target="_blank" rel="noopener">WhatsApp</a>
          <a data-share-platform="reddit" href="#" target="_blank" rel="noopener">Reddit</a>
          <a data-share-platform="facebook" href="#" target="_blank" rel="noopener">Facebook</a>
          <a data-share-platform="x" href="#" target="_blank" rel="noopener">X</a>
          <a data-share-platform="bluesky" href="#" target="_blank" rel="noopener">Bluesky</a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(fallback);

  const closeBtn = fallback.querySelector('.share-close-btn');
  const copyBtn = fallback.querySelector('#copyShareLink');
  const copyStatus = fallback.querySelector('#copyShareStatus');
  const platformLinks = fallback.querySelectorAll('[data-share-platform]');

  function shareUrl() {
    return window.location.href;
  }

  function platformUrl(platform) {
    const url = encodeURIComponent(shareUrl());
    const text = encodeURIComponent(`${SHARE_TEXT} ${shareUrl()}`);
    switch (platform) {
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${text}`;
      case 'reddit': return `https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent(SHARE_TITLE)}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'x': return `https://x.com/intent/post?text=${encodeURIComponent(SHARE_TEXT)}&url=${url}`;
      case 'bluesky': return `https://bsky.app/intent/compose?text=${text}`;
      default: return '#';
    }
  }

  platformLinks.forEach(link => {
    link.href = platformUrl(link.dataset.sharePlatform);
  });

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(shareUrl());
      copyBtn.classList.add('copied');
      copyBtn.querySelector('strong').textContent = 'Link copied!';
      copyStatus.textContent = 'The quiz link has been copied to your clipboard.';
      window.setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.querySelector('strong').textContent = 'Copy Link';
        copyStatus.textContent = 'Copy the quiz link to your clipboard.';
      }, 2200);
    } catch (_) {
      copyStatus.textContent = 'Copying is not available in this browser. Select and copy the link from the address bar.';
    }
  }

  function openFallback() {
    fallback.hidden = false;
    document.body.classList.add('share-modal-open');
    button.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }

  function closeFallback() {
    fallback.hidden = true;
    document.body.classList.remove('share-modal-open');
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  }

  async function share() {
    const data = {title: SHARE_TITLE, text: SHARE_TEXT, url: shareUrl()};
    try {
      if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data);
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    openFallback();
  }

  button.addEventListener('click', share);
  copyBtn.addEventListener('click', copyLink);
  closeBtn.addEventListener('click', closeFallback);
  fallback.addEventListener('click', event => { if (event.target === fallback) closeFallback(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !fallback.hidden) closeFallback();
  });
})();

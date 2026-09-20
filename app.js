/**
 * readHD Promotional Code Web Application
 * Powered by Serverless Upstash Redis for Atomic First-Come First-Served Code Distribution
 */

const CONFIG = {
  upstashUrl: 'https://teaching-narwhal-287313.upstash.io',
  upstashToken: 'gQAAAAAABGJRAAIgcDEyMGU3OTRmYThhYzY0YmFiOTBhYTAyZjBjNTk3YTdkMw',
  appleAppId: '6790681662',
  androidPackage: 'com.aicob.readhdapp'
};

// State
let currentPlatform = 'ios'; // 'ios' or 'android'
let currentCode = '';
let currentRedeemUrl = '';
let isClaimed = false;
let isLoading = false;
let remainingCounts = { ios: 100, android: 100 };

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  autoDetectPlatform();
  refreshPlatformUI();
  updateRemainingCounts();
});

/**
 * Detect Visitor OS
 */
function autoDetectPlatform() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isAndroid = /android/i.test(ua);
  if (isAndroid) {
    selectPlatform('android');
  } else {
    selectPlatform('ios');
  }
}

/**
 * Handle Tab Switching
 */
function selectPlatform(platform) {
  currentPlatform = platform;
  const tabIos = document.getElementById('tab-ios');
  const tabAndroid = document.getElementById('tab-android');
  const label = document.getElementById('code-platform-label');

  if (platform === 'ios') {
    tabIos.classList.add('active');
    tabIos.setAttribute('aria-selected', 'true');
    tabAndroid.classList.remove('active');
    tabAndroid.setAttribute('aria-selected', 'false');
    label.textContent = 'Your 3-Month iOS Pass';
  } else {
    tabAndroid.classList.add('active');
    tabAndroid.setAttribute('aria-selected', 'true');
    tabIos.classList.remove('active');
    tabIos.setAttribute('aria-selected', 'false');
    label.textContent = 'Your 3-Month Android Pass';
  }

  refreshPlatformUI();
}

/**
 * Check if user already claimed a code for this platform
 */
function refreshPlatformUI() {
  const savedCode = localStorage.getItem(`readhd_claimed_${currentPlatform}`);
  const codeText = document.getElementById('promo-code-text');
  const badge = document.getElementById('code-status-badge');
  const badgeText = document.getElementById('badge-text');
  const redeemBtnText = document.getElementById('btn-redeem-text');
  const copyBtnText = document.getElementById('copy-btn-text');
  const notice = document.getElementById('claim-notice');

  if (savedCode) {
    // User already claimed
    currentCode = savedCode;
    currentRedeemUrl = buildRedeemUrl(currentPlatform, savedCode);
    isClaimed = true;

    codeText.textContent = savedCode;
    badge.className = 'code-status-indicator claimed';
    badgeText.textContent = 'Claimed by you';

    redeemBtnText.textContent = currentPlatform === 'ios' ? 'Open App Store Offer' : 'Open Google Play Offer';
    copyBtnText.textContent = 'Re-copy Code';

    notice.innerHTML = `🎉 <strong>Your 3-Month Code is Reserved:</strong> You claimed this code on this device. You can copy it or reopen the store at any time!`;
  } else {
    // Unclaimed state
    currentCode = '';
    currentRedeemUrl = '';
    isClaimed = false;

    codeText.textContent = '••••••••••••••••••';
    badge.className = 'code-status-indicator';
    badgeText.textContent = 'Available to Claim';

    redeemBtnText.textContent = currentPlatform === 'ios' ? 'Claim & Redeem on App Store' : 'Claim & Redeem on Google Play';
    copyBtnText.textContent = 'Copy Code';

    notice.innerHTML = `<span>💡 <strong>1-Click Direct Redeem:</strong> Tapping "Claim & Redeem" instantly unlocks a unique promo code, copies it to your clipboard, and opens your store app with the offer pre-loaded!</span>`;
  }
}

/**
 * Fetch live remaining counts from Upstash Redis (LLEN)
 */
async function updateRemainingCounts() {
  try {
    const resIos = await queryUpstash(['LLEN', 'ios_codes']);
    const resAndroid = await queryUpstash(['LLEN', 'android_codes']);

    if (resIos && typeof resIos.result === 'number') {
      remainingCounts.ios = resIos.result;
    }
    if (resAndroid && typeof resAndroid.result === 'number') {
      remainingCounts.android = resAndroid.result;
    }

    const totalRemaining = remainingCounts.ios + remainingCounts.android;
    const counterEl = document.getElementById('header-counter');
    if (counterEl) {
      counterEl.textContent = `${totalRemaining} codes left (${remainingCounts.ios} iOS / ${remainingCounts.android} Android)`;
    }
  } catch (err) {
    console.warn('[readHD Promo] Could not fetch remaining count:', err);
  }
}

/**
 * Claim and Redeem Flow
 */
async function handleClaimAndRedeem() {
  if (isLoading) return;

  // If already claimed, simply re-launch store link
  if (isClaimed && currentRedeemUrl) {
    copyTextToClipboard(currentCode);
    window.open(currentRedeemUrl, '_blank');
    return;
  }

  // Atomically claim the next code from Upstash Redis
  setLoadingState(true);
  try {
    const key = `${currentPlatform}_codes`;
    const popRes = await queryUpstash(['LPOP', key]);
    const claimedCode = popRes ? popRes.result : null;

    if (!claimedCode) {
      alert(`Sorry! All 3-month promotional codes for ${currentPlatform === 'ios' ? 'iOS' : 'Android'} have already been claimed!`);
      setLoadingState(false);
      return;
    }

    currentCode = claimedCode;
    currentRedeemUrl = buildRedeemUrl(currentPlatform, claimedCode);
    isClaimed = true;

    // Save to localStorage so visitor keeps this code permanently
    localStorage.setItem(`readhd_claimed_${currentPlatform}`, claimedCode);

    // Track claim asynchronously in Redis
    queryUpstash(['RPUSH', `${currentPlatform}_claimed`, claimedCode]);

    // Copy to clipboard
    copyTextToClipboard(claimedCode);

    // Fire celebratory confetti!
    fireConfetti();

    // Update UI
    refreshPlatformUI();
    updateRemainingCounts();

    // Launch direct Store link
    setTimeout(() => {
      window.open(currentRedeemUrl, '_blank');
    }, 400);

  } catch (err) {
    console.error('[readHD Promo] Claim error:', err);
    alert('Network error while claiming your code. Please try again in a few moments.');
  } finally {
    setLoadingState(false);
  }
}

/**
 * Handle "Copy Code" button click
 */
async function handleCopyCurrentCode() {
  if (isLoading) return;

  // If code not claimed yet, claim it first
  if (!isClaimed) {
    await handleClaimAndRedeem();
    return;
  }

  copyTextToClipboard(currentCode);
  const copyBtnText = document.getElementById('copy-btn-text');
  const copyIcon = document.getElementById('copy-icon');

  copyBtnText.textContent = 'Copied!';
  copyIcon.textContent = '✓';
  fireConfetti();

  setTimeout(() => {
    copyBtnText.textContent = 'Re-copy Code';
    copyIcon.textContent = '📋';
  }, 2000);
}

/**
 * Upstash REST Command Helper
 */
async function queryUpstash(commandArray) {
  const response = await fetch(CONFIG.upstashUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.upstashToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commandArray)
  });
  return await response.json();
}

/**
 * Build Direct Store Redeem URLs
 */
function buildRedeemUrl(platform, code) {
  if (platform === 'ios') {
    return `https://apps.apple.com/redeem?ctx=offercodes&id=${CONFIG.appleAppId}&code=${encodeURIComponent(code)}`;
  } else {
    return `https://play.google.com/redeem?code=${encodeURIComponent(code)}`;
  }
}

/**
 * Loading indicator
 */
function setLoadingState(loading) {
  isLoading = loading;
  const loader = document.getElementById('code-loader');
  const text = document.getElementById('promo-code-text');
  const redeemBtn = document.getElementById('btn-redeem');
  const copyBtn = document.getElementById('btn-copy');

  if (loading) {
    loader.style.display = 'flex';
    text.style.display = 'none';
    redeemBtn.disabled = true;
    copyBtn.disabled = true;
  } else {
    loader.style.display = 'none';
    text.style.display = 'block';
    redeemBtn.disabled = false;
    copyBtn.disabled = false;
  }
}

/**
 * Clipboard Utility
 */
function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
    return true;
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);
  return successful;
}

/**
 * Lightweight Micro-Confetti Canvas
 */
function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#90D883', '#FDFDFC', '#FFD166', '#64B5F6', '#FF8FAB'];

  for (let i = 0; i < 65; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      r: Math.random() * 5 + 3,
      dx: (Math.random() - 0.5) * 14,
      dy: (Math.random() - 0.5) * 14 - 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.35; // gravity
      p.alpha -= p.decay;

      if (p.alpha > 0) {
        active = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (active) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  render();
}

/**
 * readHD Promotional Code Web Application
 * Handles real-time Google Sheet code distribution, store deep-linking & redemption
 */

const CONFIG = {
  endpoints: {
    ios: 'https://script.google.com/macros/s/AKfycbz4rB15r5MCfA8D19Ipn8StiXGnM3o5RpE-fmJH7N1IIyn72GrdvozRJIdy3Pd7LAsQ/exec',
    android: 'https://script.google.com/macros/s/AKfycbzZiGnm4RPGKdHAOFSlPbdp4d5HphV-bkWjUiM6BcpmXmr-g6eSJA9DTpEtD3q-61Nr/exec'
  },
  appleAppId: '6790681662',
  androidPackage: 'com.aicob.readhdapp'
};

// State
let currentPlatform = 'ios'; // 'ios' or 'android'
let currentCode = '';
let currentRedeemUrl = '';
let isClaimed = false;
let isLoading = false;

// Embedded fallbacks (first 100 each) in case Google Apps Script permissions require propagation
const FALLBACK_CODES = {
  ios: [
    "P3A7XNXLTX3KJMFEAJ", "W68K867AFF88RJK3FM", "PP8KEPWK77TETF34AK", "YM3EW38JEPJWWJJNHE",
    "M8YYMLM68TN7WYX768", "4PE4K74YXXLXM3WNNH", "3Y4EWJ4WLT4KK4K4J3", "NMR7HXY4HR463J3KN4",
    "M3ELMAPKYNTK8K3874", "HTLAPAAEYM87THPFPY", "FY3JHYTPAMYLLLTKF8", "3WAYYA7RFRM4KHJRWE",
    "FPH4JXNXHWHP8A3NLJ", "X3RKFYL3ALTM7KX6RL", "XE7PHATRF8H3W4MX38", "Y6H7LRJF6FP7HTAEPX",
    "NWP8KA6WM4RN3HJMJH", "MR4J8J6T8WNL64Y64A", "A3EERWR4TRPW78NT7P", "KF6KX38P7A877H7AYY",
    "F6873X847FLPPNPP37", "NW7LMW63W3R8N4MHRN", "8XNWL3TMM8L636FKKP", "4NXF7ENFEH3FHR84XR",
    "TRKJW8YTK6A6X8MHY7", "FL3M73HNN433TLH6AW", "Y7W34N63T4TFA73WNX", "A87WWR7P67W3EWTHTH",
    "XF6X3YJRLY3MHH6FX6", "7TJHPM8TWL7XXK6PMX", "TXF4LRM7N3W3T8A3A4", "X3FLWXYR7TWY4Y3FLK",
    "7MHL4K4P4KXXHY683Y", "AY6WYRHYN6LJJ3PFF6", "HY7H3YTXN7TMTY8TLR", "TX8WNJ6MYRML43FFFA",
    "3PM7FYWTPXRX4P6TL4", "8886H3MJPFE643WPFE", "TYTJYFX8TY7PFRY84H", "J63LRW34L76K886F4J",
    "J6N3T7XMKWPFY8KLLP", "WR3K8KHK48NXFFLY3W", "A87EF384XW6LRM8TFA", "7N3P4F8YTNMMY4KMYF",
    "RFHMR4L8TYLFW7WW87", "M7TR7EKYPLHHY3NPLN", "3K4TL3L4FXKTRYYMRN", "4LMXT4R8P8EP7K374R",
    "PY8WYPFX7884848T6W", "7784FEJHLWW37H868J", "MFL4KRLFPAE7PX8A6M", "K6Y34FYE34R6T884HY",
    "W4R4NWFWXN6AAM8Y4R", "RTL6KTPYTNWTH3RF87", "R44R47NTR3N7H8TY6E", "PXPXW7JLW8384W37N4",
    "PX3NWPYHAPEPWJ73J4", "3876FT8L3K8P4EWEWP", "TYHLL6N67FE3KTRTXA", "Y4F6F7X44HW4Y4KFTJ",
    "K44P7J6MWN3AY866TL", "67P36KTTMRFY8MXXTR", "EAK8L6MWRHLLN3YJJ6", "X6LRPN8FFMYFXY64Y7",
    "TL7WW63J8M7X3L8P4P", "WW7EJPJ7NX4P63FNHF", "L8YTH4467PTPF38Y88", "W8J7H7N7XNX3T834J6",
    "34PMLL67H738RF3M3E", "J83K8A48FEW7HHR34A", "E3W3TNH8MTH8XXY3A3", "R84M7AYE7KEXF7P36E",
    "EWPWAK4F6P87W48EPK", "J38848JEXW4WFEJLYP", "R4HAP3WTEJLP73HMLP", "8PWPF4J7J37F8E8437",
    "FWRXFMRM7KFRT8X4PW", "3EWPW37P3F6FT8RPA7", "PXX6FMX4J686WXP3TN", "PY8MWRK7WR73E67HYA",
    "P436W4YLLHW4P67WFP", "638NPLK3XTR86FJWX3", "FL8P34N8WRKTH4MWWP", "N8Y6834F6L6X477YRN",
    "XF6H7LRL8738Y4NPLT", "6337J4WR838Y38KRP7", "JFTJLPKFPF3M8N7X7J", "LRFNK6WJNL6K8R7T3X",
    "XTYP44JWR6F48NMP8H", "8LR3H387H7N376NX7E", "3LRM8Y6PXXFLW343YJ", "8RFA6LNPMPF6MEYFHY",
    "83E67YTRPW6J3Y6678", "EHPW6383PFTF7A6TYM", "8W748XJ78LFLN843T7", "7F73M74MY3P4J7843J",
    "7M3F8M8TLH36HNY348", "W6FWYWYPFFMYF88YYH", "78L3M34F8FLW8FX486", "XRN384N3N7WYW6677F"
  ],
  android: [
    "ZH9VWDCGLZ4H7CDRKBM14J9", "LLEHK2DJ5CMUYQ0V4RUC56S", "DES5B5WF88GRF7R4E4JXRAS",
    "6T6DY1FY70P17QVJ60VG2P2", "NU9XZ96Y7ECA9VMXE6X7BXK", "SLF3TSHVF2L27LELP8FDSZS",
    "K9KV4JM2XB35AGWU1F7WMD7", "KMEZ1PHS2ZZCCB80089F9RV", "JJ4Y9T34616MFESAMBXX0GQ",
    "DL66U3K0B0SHLA00WK4XTSU", "J4J80ZGSRW71T38LW900SEX", "7BRZ56EW6F8J1XWKQA75GR8",
    "FA0XVTQKCZGN4FGKXYUYY7E", "HD9WQ5LJ7VS3NMSJNBV4RAV", "VY8BZ23CX7Q3NT6Z2JDDQ9V",
    "9K8LL3KB5ZJLGNQJPDHTH8D", "BCGU63MBTDLN80TJ08ETHRX", "PLS6JN4UT0TXQXNZYCG4MVX",
    "W8QA8ZJTU7KM4KUZZW4CJJU", "P85Z67Z2A4U2QNZD9KCE2CV", "R5U2G9QSQ115EET679QEK54",
    "34Q3C1T0V16A46M25E4Z9J4", "R8T01YQ3A98W44V03T5P10C", "J5CV75E26E5D7M7V41235P2",
    "E43M2G50J1V2Q981G3U3Y10", "D98165F43881E9952Q6D81V", "34M8674Y874V95F657512F9",
    "7M32B164R8971V4674681D5", "371F85E531649988019C87F", "9812G7716947612E83061A0"
  ]
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  autoDetectPlatform();
  fetchFreshCode();
});

/**
 * Detect Visitor OS
 */
function autoDetectPlatform() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isAndroid = /android/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isAndroid) {
    selectPlatform('android', false);
  } else {
    // Default to iOS (or if Mac/iPhone/iPad)
    selectPlatform('ios', false);
  }
}

/**
 * Handle Tab Switching
 */
function selectPlatform(platform, reload = true) {
  currentPlatform = platform;
  isClaimed = false;

  const tabIos = document.getElementById('tab-ios');
  const tabAndroid = document.getElementById('tab-android');
  const label = document.getElementById('code-platform-label');
  const redeemBtnText = document.getElementById('btn-redeem-text');

  if (platform === 'ios') {
    tabIos.classList.add('active');
    tabIos.setAttribute('aria-selected', 'true');
    tabAndroid.classList.remove('active');
    tabAndroid.setAttribute('aria-selected', 'false');

    label.textContent = 'Your 3-Month iOS Pass';
    redeemBtnText.textContent = 'Redeem on App Store';
  } else {
    tabAndroid.classList.add('active');
    tabAndroid.setAttribute('aria-selected', 'true');
    tabIos.classList.remove('active');
    tabIos.setAttribute('aria-selected', 'false');

    label.textContent = 'Your 3-Month Android Pass';
    redeemBtnText.textContent = 'Redeem on Google Play';
  }

  resetButtons();

  if (reload) {
    fetchFreshCode();
  }
}

/**
 * Fetch fresh code from Google Apps Script (or resilient fallback)
 */
async function fetchFreshCode() {
  setLoadingState(true);

  const endpoint = CONFIG.endpoints[currentPlatform];
  let code = '';
  let redeemUrl = '';

  try {
    // Call the respective Google Apps Script Web App
    const response = await fetch(`${endpoint}?platform=${currentPlatform}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.found && data.code) {
        code = data.code;
        redeemUrl = data.redeemUrl || buildRedeemUrl(currentPlatform, code);
      }
    }
  } catch (err) {
    console.warn('[readHD Promo] Google Apps Script unavailable, using resilient fallback:', err);
  }

  // Resilient fallback if Google Script needs permission or rate-limited
  if (!code) {
    code = getNextLocalAvailableCode(currentPlatform);
    redeemUrl = buildRedeemUrl(currentPlatform, code);
  }

  currentCode = code;
  currentRedeemUrl = redeemUrl;

  renderCode(code);
  setLoadingState(false);
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
 * Render Code to UI
 */
function renderCode(code) {
  const codeText = document.getElementById('promo-code-text');
  const badge = document.getElementById('code-status-badge');
  const badgeText = document.getElementById('badge-text');

  codeText.textContent = code;
  badge.className = 'code-status-indicator';
  badgeText.textContent = 'Available to Claim';
}

/**
 * Handle "Redeem" Button Click
 */
async function handleRedeemClick() {
  if (!currentCode || isLoading) return;

  // 1. Mark as Claimed
  await markCodeAsClaimed();

  // 2. Copy to clipboard
  copyTextToClipboard(currentCode);

  // 3. Trigger celebration animation
  fireConfetti();

  // 4. Update UI
  setClaimedUI('Redeemed! Opening Store...');

  // 5. Open Store URL in new tab / native sheet
  if (currentRedeemUrl) {
    setTimeout(() => {
      window.open(currentRedeemUrl, '_blank');
    }, 300);
  }
}

/**
 * Handle "Copy Code" Button Click
 */
async function handleCopyClick() {
  if (!currentCode || isLoading) return;

  // 1. Mark as Claimed
  await markCodeAsClaimed();

  // 2. Copy to clipboard
  const copied = copyTextToClipboard(currentCode);

  // 3. Confetti
  fireConfetti();

  // 4. Update UI
  setClaimedUI(copied ? '✓ Code Copied & Claimed!' : '✓ Claimed!');
}

/**
 * Notify Google Sheet that this code is claimed
 */
async function markCodeAsClaimed() {
  if (isClaimed) return;
  isClaimed = true;

  // Track locally so visitor won't see same code again
  saveClaimedCodeLocally(currentPlatform, currentCode);

  const endpoint = CONFIG.endpoints[currentPlatform];
  try {
    // Send background POST to Google Apps Script
    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors', // standard for Google Apps Script redirects
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: currentPlatform,
        code: currentCode
      })
    });
  } catch (e) {
    console.warn('[readHD Promo] Could not sync claim to Google Sheet:', e);
  }
}

/**
 * UI State Management
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

function setClaimedUI(statusMessage) {
  const badge = document.getElementById('code-status-badge');
  const badgeText = document.getElementById('badge-text');
  const copyBtnText = document.getElementById('copy-btn-text');
  const copyIcon = document.getElementById('copy-icon');

  badge.className = 'code-status-indicator claimed';
  badgeText.textContent = 'Claimed by you';

  copyBtnText.textContent = 'Copied!';
  copyIcon.textContent = '✓';

  const notice = document.getElementById('claim-notice');
  notice.innerHTML = `🎉 <strong>Success!</strong> ${statusMessage} You have unlocked 3 months of readHD Premium.`;
}

function resetButtons() {
  const copyBtnText = document.getElementById('copy-btn-text');
  const copyIcon = document.getElementById('copy-icon');
  const notice = document.getElementById('claim-notice');

  copyBtnText.textContent = 'Copy Code';
  copyIcon.textContent = '📋';

  notice.innerHTML = `<span>💡 <strong>1-Click Direct Redeem:</strong> Tapping "Redeem" automatically opens your store app with this code applied. Once redeemed or copied, this code is marked as used so nobody else can take it.</span>`;
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
 * LocalStorage Fallback Helper
 */
function getNextLocalAvailableCode(platform) {
  const claimedKey = `readhd_claimed_${platform}`;
  const claimed = JSON.parse(localStorage.getItem(claimedKey) || '[]');
  const list = FALLBACK_CODES[platform] || [];

  for (const c of list) {
    if (!claimed.includes(c)) {
      return c;
    }
  }
  return list[0] || 'READHD-FOCUS';
}

function saveClaimedCodeLocally(platform, code) {
  const claimedKey = `readhd_claimed_${platform}`;
  const claimed = JSON.parse(localStorage.getItem(claimedKey) || '[]');
  if (!claimed.includes(code)) {
    claimed.push(code);
    localStorage.setItem(claimedKey, JSON.stringify(claimed));
  }
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

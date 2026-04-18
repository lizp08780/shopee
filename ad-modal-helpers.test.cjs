const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
const injectorSource = fs.readFileSync(path.join(__dirname, 'injector.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const backgroundPath = path.join(__dirname, 'background.js');

assert.ok(
  source.includes('.saa-launcher, .saa-panel, .saa-modal-mask, .saa-ad-mask, .saa-software-mask'),
  'overlay masks should share fixed positioning base styles'
);
assert.ok(
  source.includes('id="saa-ad-list-mask"'),
  'ad feature should render a text-ad list panel before image preview'
);
assert.ok(
  source.includes("bindClick('#saa-open-ad-modal', openAdPanel);"),
  'ad shortcut should open the text-ad panel instead of opening image modal directly'
);
assert.ok(
  source.includes('startAdPopupSchedule();'),
  'popup ad should still auto-open on load'
);
assert.ok(
  source.includes("const REMOTE_AD_PANEL_URL = localStorage.getItem('__SAA_REMOTE_AD_PANEL_URL__') || 'https://shopee-ads-pages.pages.dev/ads-panel/';"),
  'ad button should default to the fixed Cloudflare Pages ad panel URL'
);
assert.ok(
  source.includes("const REMOTE_POPUP_AD_URL = localStorage.getItem('__SAA_REMOTE_POPUP_AD_URL__') || 'https://shopee-ads-pages.pages.dev/popup-ad/';"),
  'popup ad should default to the fixed Cloudflare Pages popup URL'
);
assert.ok(
  source.includes("const REMOTE_SOFTWARE_PAGE_URL = localStorage.getItem('__SAA_REMOTE_SOFTWARE_PAGE_URL__') || 'https://shopee-ads-pages.pages.dev/more-tools/';"),
  'more software button should default to the fixed Cloudflare Pages software URL'
);
assert.ok(
  source.includes("const PENDING_SCHEDULE_ACTION_KEY = '__SHOPEE_ADS_PENDING_SCHEDULE_ACTION_V1__';"),
  'scheduled ship tasks should persist a pending reload action marker'
);
assert.ok(
  source.includes("const processPendingScheduledAction = async () => {"),
  'scheduled ship tasks should restore and continue pending work after a reload'
);
assert.ok(
  source.includes('定时任务准备刷新页面后执行'),
  'scheduled ship tasks should log before reloading the page'
);
assert.ok(
  source.includes('页面刷新完成，开始检测页面状态'),
  'scheduled ship tasks should log when post-refresh page checks start'
);
assert.ok(
  source.includes('页面状态检测成功，额外等待 10 秒'),
  'scheduled ship tasks should log the extra 10 second wait after page readiness'
);
assert.ok(
  source.includes('等待结束，开始执行任务'),
  'scheduled ship tasks should log when execution starts after the wait'
);
assert.ok(
  source.includes("const CURRENT_VERSION = '1.0.0';"),
  'extension should expose the current software version as 1.0.0'
);
assert.ok(
  source.includes("const REMOTE_UPDATE_CONFIG_URL = localStorage.getItem('__SAA_REMOTE_UPDATE_CONFIG_URL__') || 'https://gitee.com/qb1314/ai-ads/raw/master/shopee-ads-helper-update.json';"),
  'online update should default to the fixed Gitee raw JSON URL'
);
assert.ok(
  manifest.background && manifest.background.service_worker === 'background.js',
  'extension should register a background service worker for update fetch bridging'
);
assert.ok(
  fs.existsSync(backgroundPath),
  'background service worker file should exist'
);
assert.ok(
  injectorSource.includes("chrome.runtime.sendMessage"),
  'injector bridge should forward update fetch requests through the extension runtime'
);
assert.ok(
  source.includes("const UPDATE_FETCH_REQUEST = '__SAA_FETCH_UPDATE_CONFIG__';"),
  'page script should define an update-fetch bridge request type'
);
assert.ok(
  source.includes("const UPDATE_FETCH_RESPONSE = '__SAA_FETCH_UPDATE_CONFIG_RESULT__';"),
  'page script should define an update-fetch bridge response type'
);
assert.ok(
  source.includes('id="saa-version-badge">v${CURRENT_VERSION}</span>'),
  'panel header should render a visible version badge'
);
assert.ok(
  source.includes('pointer-events: none;'),
  'version badge should stay visible but not participate in clicks'
);
assert.ok(
  source.includes('id="saa-disable-banner"'),
  'panel should render a dedicated disabled-state banner'
);
assert.ok(
  source.includes('id="saa-business-shell"'),
  'Shopee business controls should live inside a dedicated shell that can be disabled remotely'
);
assert.ok(
  source.includes("updateState.enabled = data.enabled !== false;"),
  'remote update config should be able to disable Shopee business functions'
);
assert.ok(
  source.includes("const applyBusinessAvailability = () => {"),
  'panel should centralize business availability updates'
);
assert.ok(
  source.includes('id="saa-remote-page-mask"'),
  'remote html content should render inside an in-page modal mask'
);
assert.ok(
  source.includes("showRemotePage(REMOTE_AD_PANEL_URL, '广告');"),
  'ad button should open the remote ad page inside the in-page modal'
);
assert.ok(
  source.includes("showRemotePage(REMOTE_POPUP_AD_URL, '广告弹窗');"),
  'popup ad should open the remote popup page inside the in-page modal'
);
assert.ok(
  source.includes("showRemotePage(REMOTE_SOFTWARE_PAGE_URL, '更多软件');"),
  'more software button should open the remote software page inside the in-page modal'
);

assert.ok(
  source.includes('const txt = single || batch;'),
  'manual input IDs should take precedence over batch IDs when both fields contain values'
);
assert.ok(
  source.includes('Shopee-Ads助手 免费赞助</div>\n            <span class="saa-version-badge" id="saa-version-badge">v${CURRENT_VERSION}</span>'),
  'version badge should sit directly after the free sponsor title inside the clickable brand area'
);
assert.ok(
  source.includes('const hasLoadedOngoingEntries = Array.isArray(window.__ONGOING_ENTRIES__) && window.__ONGOING_ENTRIES__.length > 0;'),
  'manual execution should only use ongoing entries when they are already loaded'
);
assert.ok(
  source.includes('未自动抓取进行中列表；当前按手动输入内容直接执行。'),
  'manual execution should explicitly log that it no longer auto-fetches ongoing entries'
);
assert.ok(
  source.includes("const showPanelDialog = ({ title = '提示', message = '', mode = 'alert' } = {}) => {"),
  'panel should provide an in-panel dialog helper for notices and confirmations'
);
assert.ok(
  !source.includes('alert('),
  'business actions should not use native browser alert popups'
);
assert.ok(
  !source.includes('confirm('),
  'business actions should not use native browser confirm popups'
);

function extractArrow(name) {
  const marker = `const ${name} =`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Missing ${name}`);
  const eq = source.indexOf('=', start);
  const bodyStart = source.indexOf('{', eq);
  let depth = 0;
  let end = bodyStart;
  for (; end < source.length; end++) {
    const ch = source[end];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        end++;
        break;
      }
    }
  }
  while (end < source.length && source[end] !== ';') end++;
  return source.slice(eq + 1, end).trim();
}

const sandbox = { result: null };
vm.createContext(sandbox);
vm.runInContext(`
  const sanitizePromoItems = ${extractArrow('sanitizePromoItems')};
  const sanitizeSoftwareItems = ${extractArrow('sanitizeSoftwareItems')};
  const compareVersions = ${extractArrow('compareVersions')};
  result = { sanitizePromoItems, sanitizeSoftwareItems, compareVersions };
`, sandbox);

const { sanitizePromoItems, sanitizeSoftwareItems, compareVersions } = sandbox.result;

const fallback = [{ title: 'fallback', subtitle: 'fallback-sub', image: 'img-a', target: 'https://a.example' }];

const normalized = sanitizePromoItems([
  null,
  { imageUrl: 'img-1', link: 'https://one.example', name: '广告 1', desc: 'desc 1' },
  { src: 'img-2', url: 'https://two.example' },
  { image: '', target: 'https://bad.example' }
], fallback);

assert.strictEqual(normalized.length, 2);
assert.strictEqual(JSON.stringify(normalized[0]), JSON.stringify({
  title: '广告 1',
  subtitle: 'desc 1',
  image: 'img-1',
  target: 'https://one.example'
}));
assert.strictEqual(JSON.stringify(normalized[1]), JSON.stringify({
  title: '广告 2',
  subtitle: '',
  image: 'img-2',
  target: 'https://two.example'
}));

const fallbackResult = sanitizePromoItems([{ image: '', target: '' }], fallback);
assert.strictEqual(JSON.stringify(fallbackResult), JSON.stringify(fallback));

const softwareFallback = [{ title: '默认工具', url: 'https://a.example', desc: 'desc' }];
const normalizedSoftware = sanitizeSoftwareItems([
  { name: '工具 A', link: 'https://one.example', description: '说明 A' },
  { title: '', url: '' },
  { title: '工具 B', target: 'https://two.example' }
], softwareFallback);
assert.strictEqual(JSON.stringify(normalizedSoftware), JSON.stringify([
  { title: '工具 A', url: 'https://one.example', desc: '说明 A' },
  { title: '工具 B', url: 'https://two.example', desc: '' }
]));
assert.strictEqual(JSON.stringify(sanitizeSoftwareItems([], softwareFallback)), JSON.stringify(softwareFallback));

assert.strictEqual(compareVersions('1.0.1', '1.0.0'), 1);
assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0);
assert.strictEqual(compareVersions('0.9.9', '1.0.0'), -1);

console.log('ad-modal-helpers.test.cjs PASS');

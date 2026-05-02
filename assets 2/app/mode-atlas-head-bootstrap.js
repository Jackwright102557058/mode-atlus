/* Mode Atlas head bootstrap: environment detection, manifest, modules, and hosted app registration. */
(function ModeAtlasHeadBootstrap(){
  if (window.__modeAtlasHeadBootstrapLoaded) return;
  window.__modeAtlasHeadBootstrapLoaded = true;

  var APP_VERSION = '2.11.5';
  var protocol = location.protocol;
  var host = location.hostname;
  var search = location.search || '';
  var isLocalFile = protocol === 'file:';
  var isLocalhost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(host || '');
  var isLocalServer = isLocalhost && (protocol === 'http:' || protocol === 'https:');
  var isGitHubPages = host === 'modeatlas.github.io';
  var officialDomains = ['mode-atlas.app', 'www.mode-atlas.app', 'mode-atlas.com', 'www.mode-atlas.com'];
  var isOfficialDomain = officialDomains.indexOf(host) !== -1;
  var isPrimaryDomain = host === 'mode-atlas.app' || host === 'www.mode-atlas.app';
  var isHttp = protocol === 'http:' || protocol === 'https:';
  var isSecureLike = protocol === 'https:' || isLocalhost;
  var isProduction = isOfficialDomain || isGitHubPages;
  var isSupportedHost = isHttp;
  var canUsePwa = isSupportedHost && isSecureLike && ('serviceWorker' in navigator) && search.indexOf('sw=0') === -1;
  var canUseFirebase = isSupportedHost;
  var canUseModules = isSupportedHost;


  function getPageName(){
    var path = (location.pathname || '/').replace(/\/+$/, '/');

    if (path === '/' || /\/index\.html$/i.test(path)) return 'index.html';
    if (/\/kana\/?$/i.test(path) || /\/kana\/index\.html$/i.test(path)) return 'kana.html';
    if (/\/reading\/?$/i.test(path) || /\/reading\/index\.html$/i.test(path) || /\/default\.html$/i.test(path)) return 'default.html';
    if (/\/writing\/?$/i.test(path) || /\/writing\/index\.html$/i.test(path) || /\/reverse\.html$/i.test(path)) return 'reverse.html';
    if (/\/results\/?$/i.test(path) || /\/results\/index\.html$/i.test(path) || /\/test\.html$/i.test(path)) return 'test.html';
    if (/\/wordbank\/?$/i.test(path) || /\/wordbank\/index\.html$/i.test(path)) return 'wordbank.html';

    return (path.split('/').filter(Boolean).pop() || 'index.html').toLowerCase();
  }

  window.ModeAtlasPageName = getPageName;

  function safeStorageGet(key){
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }

  window.ModeAtlasEnv = Object.freeze({
    appVersion: APP_VERSION,
    saveSchemaVersion: '3',
    isLocalFile: isLocalFile,
    isLocalhost: isLocalhost,
    isLocalServer: isLocalServer,
    isGitHubPages: isGitHubPages,
    officialDomains: officialDomains.slice(),
    isOfficialDomain: isOfficialDomain,
    isPrimaryDomain: isPrimaryDomain,
    primaryDomain: 'mode-atlas.app',
    primaryUrl: 'https://mode-atlas.app/',
    fallbackDomain: 'mode-atlas.com',
    supportEmail: 'support@mode-atlas.com',
    helloEmail: 'hello@mode-atlas.com',
    adminEmail: 'admin@mode-atlas.com',
    isHosted: isSupportedHost,
    isProduction: isProduction,
    isSupportedHost: isSupportedHost,
    isSecureLike: isSecureLike,
    canUsePwa: canUsePwa,
    canUseFirebase: canUseFirebase,
    canUseModules: canUseModules,
    allowDevTools: (isLocalServer || search.indexOf('dev=1') !== -1 || safeStorageGet('modeAtlasDevTools') === '1'),
    baseUrl: location.origin + '/',
    loadModule: function(src, opts){
      if (!canUseModules || !src) return null;
      var script = document.createElement('script');
      script.type = 'module';
      script.src = new URL(src, document.baseURI).href;
      if (opts && opts.id) script.id = opts.id;
      if (opts && opts.defer === false) { } else script.defer = true;
      document.head.appendChild(script);
      return script;
    }
  });

  document.documentElement.dataset.maEnv = isLocalFile ? 'file-fallback' : (isProduction ? 'production' : (isLocalServer ? 'local-server' : 'hosted'));
  document.documentElement.dataset.maDomain = isOfficialDomain ? 'official' : (isGitHubPages ? 'github-pages' : (isLocalServer ? 'local-server' : 'other'));
  document.documentElement.dataset.maVersion = APP_VERSION;

  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function attachManifest(){
    try {
      if (!isSupportedHost) return;
      if (document.querySelector('link[rel="manifest"]')) return;
      var link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/site.webmanifest';
      document.head.appendChild(link);
    } catch(e) {}
  }

  function registerServiceWorker(){
    if (!canUsePwa) return;
    onReady(function(){
      try {
        var swUrl = '/sw.js';
        navigator.serviceWorker.register(swUrl, { scope: '/' })
          .then(function(reg){
            window.ModeAtlasPwa = window.ModeAtlasPwa || {};
            window.ModeAtlasPwa.registration = reg;
            if (reg.waiting) window.dispatchEvent(new CustomEvent('modeAtlasPwaUpdateReady', { detail: { registration: reg, version: APP_VERSION } }));
            reg.addEventListener('updatefound', function(){
              var worker = reg.installing;
              if (!worker) return;
              worker.addEventListener('statechange', function(){
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent('modeAtlasPwaUpdateReady', { detail: { registration: reg, version: APP_VERSION } }));
                }
              });
            });
            window.dispatchEvent(new CustomEvent('modeAtlasPwaReady', { detail: { registration: reg, version: APP_VERSION } }));
          })
          .catch(function(err){
            console.warn('Mode Atlas service worker registration failed.', err);
          });
      } catch(err) {
        console.warn('Mode Atlas service worker setup failed.', err);
      }
    });
  }

  attachManifest();
  registerServiceWorker();
})();

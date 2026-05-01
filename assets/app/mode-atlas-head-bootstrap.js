/* Mode Atlas head bootstrap: environment detection, manifest, modules, and hosted app registration. */
(function ModeAtlasHeadBootstrap(){
  if (window.__modeAtlasHeadBootstrapLoaded) return;
  window.__modeAtlasHeadBootstrapLoaded = true;

  var APP_VERSION = '2.11.4';
  var protocol = location.protocol;
  var host = location.hostname;
  var search = location.search || '';
  var isLocalFile = protocol === 'file:';
  var isLocalhost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(host || '');
  var isLocalServer = isLocalhost && (protocol === 'http:' || protocol === 'https:');
  var isGitHubPages = host === 'modeatlas.github.io';
  var isHttp = protocol === 'http:' || protocol === 'https:';
  var isSecureLike = protocol === 'https:' || isLocalhost;
  var isProduction = isGitHubPages;
  var isSupportedHost = isHttp;
  var canUsePwa = isSupportedHost && isSecureLike && ('serviceWorker' in navigator) && search.indexOf('sw=0') === -1;
  var canUseFirebase = isSupportedHost;
  var canUseModules = isSupportedHost;

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
    isHosted: isSupportedHost,
    isProduction: isProduction,
    isSupportedHost: isSupportedHost,
    isSecureLike: isSecureLike,
    canUsePwa: canUsePwa,
    canUseFirebase: canUseFirebase,
    canUseModules: canUseModules,
    allowDevTools: (isLocalServer || search.indexOf('dev=1') !== -1 || safeStorageGet('modeAtlasDevTools') === '1'),
    baseUrl: new URL('.', document.baseURI).href,
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
      link.href = new URL('site.webmanifest', document.baseURI).href;
      document.head.appendChild(link);
    } catch(e) {}
  }

  function registerServiceWorker(){
    if (!canUsePwa) return;
    onReady(function(){
      try {
        var swUrl = new URL('sw.js', document.baseURI).href;
        navigator.serviceWorker.register(swUrl, { scope: new URL('./', document.baseURI).pathname })
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

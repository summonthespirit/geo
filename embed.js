import { chooseWisp } from './wisp-check.js';

var servers = [
  'wss://w.oneyplaysbestf.art/',
  'wss://wisp.mercurywork.shop/wisp/',
  'wss://wisp.mercurywork.shop/',
  'wss://wisp-85822.wasmer.app/',
  'wss://arctic.lat/wisp/',
  'wss://anura.pro/',
  'wss://arctic.lat/_q/',
  'wss://wisp.freewisp.org/',
  'wss://gointospace.app/wisp/',
  'wss://edu.robert.rest/'
];

var base = new URL('./', document.baseURI).pathname;
var engines = {
    google: 'https://www.google.com/search?q=%s',
    bing: 'https://www.bing.com/search?q=%s',
    duckduckgo: 'https://duckduckgo.com/?q=%s',
    brave: 'https://search.brave.com/search?q=%s'
};

var $ = function (id) { return document.getElementById(id); };
var loader = $('loader');
var stat = $('status');
var retry = $('retry');
var bar = $('bar');
var view = $('view');
var form = $('form');
var box = $('url');
var prog = $('prog');
var frame = null;
var last = '';
var shown = false;

var store = {
    get: function (k) {
        try { return localStorage.getItem(k); } catch (e) { return null; }
    },
    set: function (k, v) {
        try { localStorage.setItem(k, v); } catch (e) {}
    }
};

function toUrl(raw) {
    var t = (raw || '').trim();
    if (!t) return null;
    try {
        var p = new URL(t);
        if (/^https?:$/.test(p.protocol)) return p.toString();
    } catch (e) {}
    if (t.indexOf(' ') === -1) {
        try {
            var u = new URL('https://' + t);
            if (u.hostname.indexOf('.') !== -1) return u.toString();
        } catch (e) {}
    }
    var tpl = engines[store.get('selectedSearchEngine')] || engines.brave;
    return tpl.replace('%s', encodeURIComponent(t));
}

function fromHash() {
    var h = location.hash.slice(1);
    try { h = decodeURIComponent(h); } catch (e) {}
    return toUrl(h);
}

function real() {
    try {
        var m = view.contentWindow.location.pathname.match(/\/~\/sj\/[^/]+\/[^/]+\/(.+)$/);
        return m ? decodeURIComponent(m[1]) : null;
    } catch (e) {
        return null;
    }
}

function loadScript(src) {
    return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = function () { reject(new Error('Failed to load ' + src)); };
        document.head.append(s);
    });
}

async function makeTransport(method, wisp) {
    var mod = await import(base + method + '/index.mjs');
    var Client = mod.default;
    return new Client({ wisp: wisp });
}

function start() {
    prog.style.transition = 'none';
    prog.style.width = '0%';
    prog.style.opacity = '1';
    void prog.offsetWidth;
    prog.style.transition = 'width .3s ease';
    prog.style.width = '85%';
}

function finish() {
    prog.style.width = '100%';
    setTimeout(function () {
        prog.style.opacity = '0';
        setTimeout(function () { prog.style.width = '0%'; }, 300);
    }, 200);
}

function go(u) {
    if (!u || !frame) return;
    box.value = u;
    start();
    frame.go(u);
}

function sync(a) {
    var u = real();
    if (!u && a) u = typeof a === 'string' ? a : (a && a.href) || null;
    if (u && u !== last) {
        last = u;
        if (document.activeElement !== box) box.value = u;
        try { history.replaceState(null, '', '#' + u); } catch (e) {}
    }
    try {
        var t = view.contentDocument.title;
        if (t && t !== document.title) document.title = t;
    } catch (e) {}
}

function reveal() {
    if (shown) return;
    shown = true;
    loader.style.display = 'none';
}

function fail(err) {
    stat.style.color = '#f87171';
    stat.textContent = 'error: ' + (err && err.message ? err.message : err);
    retry.hidden = false;
    console.error('embed init error:', err);
}

function wire() {
    $('back').onclick = function () {
        try { view.contentWindow.history.back(); } catch (e) {}
    };
    $('forward').onclick = function () {
        try { view.contentWindow.history.forward(); } catch (e) {}
    };
    $('reload').onclick = function () {
        start();
        try { view.contentWindow.location.reload(); } catch (e) { go(last); }
    };
    $('home').onclick = function () { location.href = base; };
    $('full').onclick = function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(function () {});
    };
    $('hide').onclick = function () { document.body.classList.add('nobar'); };
    $('tab').onclick = function () { document.body.classList.remove('nobar'); };

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        go(toUrl(box.value));
        box.blur();
    });

    window.addEventListener('hashchange', function () {
        var u = fromHash();
        if (u && u !== last) go(u);
    });

    view.addEventListener('load', function () {
        finish();
        sync();
        if (real()) reveal();
    });

    setInterval(sync, 500);
}

retry.onclick = function () { location.reload(); };

try {
    if (!navigator.onLine) throw new Error('you are offline, the proxy needs internet');

    stat.textContent = 'registering service worker...';
    var reg = await navigator.serviceWorker.register(base + 'sw.js', {
        scope: base,
        updateViaCache: 'none'
    });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
        await new Promise(function (resolve) {
            navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
    }
    var sw = navigator.serviceWorker.controller || reg.active;
    if (!sw) throw new Error('the service worker did not become active');

    stat.textContent = 'loading engine...';
    await loadScript(base + 'scram/scramjet.js');
    await loadScript(base + 'controller/controller.api.js');
    var api = window.$scramjetController;

    var utils = null;
    var names = ['scramjet-utils.mjs', 'scramjet-utils.js'];
    for (var i = 0; i < names.length; i++) {
        try {
            var mod = await import(base + 'utils/' + names[i]);
            utils = Object.assign({}, mod.default || {}, mod);
            break;
        } catch (e) {
            console.warn('utils import failed for', names[i], e);
        }
    }

    stat.textContent = 'checking wisp servers...';
    var picked = await chooseWisp({
        servers: [store.get('fish-wisp')].concat(servers),
        onStatus: function (t) { stat.textContent = t; }
    });
    var wisp = picked.url;
    if (picked.manual) store.set('fish-wisp', wisp);

    stat.textContent = 'connecting transport...';
    var kind = store.get('fish-transport') === 'epoxy' ? 'epoxy' : 'libcurl';
    var transport;
    try {
        transport = await makeTransport(kind, wisp);
    } catch (e) {
        console.warn('transport failed, falling back to libcurl', e);
        store.set('fish-transport', 'libcurl');
        transport = await makeTransport('libcurl', wisp);
    }

    stat.textContent = 'starting controller...';
    var controller = new api.Controller({
        serviceworker: sw,
        transport: transport,
        config: {
            prefix: base + '~/sj/',
            scramjetPath: base + 'scram/scramjet.js',
            wasmPath: base + 'scram/scramjet.wasm',
            injectPath: base + 'controller/controller.inject.js'
        }
    });
    await controller.wait();

    setInterval(function () {
        if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage('keepalive');
    }, 15000);

    var plugins = [];
    if (utils && utils.UrlWatcherPlugin) plugins.push(new utils.UrlWatcherPlugin(function (u) { sync(u); }));
    frame = controller.createFrame(view, { plugins: plugins });

    wire();
    bar.hidden = false;
    view.hidden = false;

    var first = fromHash();
    if (first) {
        stat.textContent = 'loading url...';
        go(first);
        setTimeout(reveal, 10000);
    } else {
        reveal();
        box.focus();
    }
} catch (err) {
    fail(err);
}

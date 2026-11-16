export function attachControls(o) {
    var iframe = o.iframe;
    var last = '';

    var css = document.createElement('style');
    css.textContent = [
        '#fish-bar{position:fixed;top:0;left:0;right:0;height:44px;z-index:10000001;display:none;align-items:center;gap:4px;padding:0 8px;background:rgba(15,20,28,.97);border-bottom:1px solid #2a384d;box-sizing:border-box;font-family:inherit}',
        '#fish-bar *{box-sizing:border-box}',
        '#fish-bar button{all:unset;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;color:#fff;cursor:pointer;flex:none}',
        '#fish-bar button:hover{background:#243044}',
        '#fish-bar svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
        '#fish-bar form{flex:1;margin:0 4px;display:block}',
        '#fish-bar input{all:unset;display:block;width:100%;height:32px;padding:0 14px;border:1px solid #2a384d;border-radius:16px;background:#0a0e14;color:#fff;font-size:.9rem;box-sizing:border-box}',
        '#fish-bar input:focus{border-color:#fff}',
        '#fish-prog{position:absolute;left:0;bottom:-1px;height:2px;width:0;background:#fff;opacity:0}',
        '#fish-tab{all:unset;position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:10000001;display:none;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid #2a384d;background:rgba(15,20,28,.92);color:#fff;cursor:pointer}',
        '#fish-tab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
        'body.fb-on #fish-bar{display:flex}',
        'body.fb-on #browser{top:44px !important;height:calc(100vh - 44px) !important}',
        'body.fb-on.fb-hide #fish-bar{display:none}',
        'body.fb-on.fb-hide #browser{top:0 !important;height:100vh !important}',
        'body.fb-on.fb-hide #fish-tab{display:flex}'
    ].join('\n');
    document.head.appendChild(css);

    var bar = document.createElement('div');
    bar.id = 'fish-bar';
    bar.innerHTML =
        '<button id="fb-back" title="back"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>' +
        '<button id="fb-forward" title="forward"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>' +
        '<button id="fb-reload" title="reload"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v5h-5"/></svg></button>' +
        '<button id="fb-home" title="home"><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7"/><path d="M6 10v10h4v-6h4v6h4V10"/></svg></button>' +
        '<form id="fb-form" autocomplete="off"><input id="fb-url" type="text" placeholder="search or enter a url" spellcheck="false" autocorrect="off" autocapitalize="off"></form>' +
        '<button id="fb-full" title="fullscreen"><svg viewBox="0 0 24 24"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg></button>' +
        '<button id="fb-hide" title="hide bar"><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button>' +
        '<div id="fish-prog"></div>';
    document.body.appendChild(bar);

    var tab = document.createElement('button');
    tab.id = 'fish-tab';
    tab.title = 'show bar';
    tab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
    document.body.appendChild(tab);

    var $ = function (id) { return document.getElementById(id); };
    var box = $('fb-url');
    var prog = $('fish-prog');

    function real() {
        try {
            var m = iframe.contentWindow.location.pathname.match(/\/~\/sj\/[^/]+\/[^/]+\/(.+)$/);
            return m ? decodeURIComponent(m[1]) : null;
        } catch (e) {
            return null;
        }
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

    function sync() {
        var u = real();
        if (u && u !== last) {
            last = u;
            if (document.activeElement !== box) box.value = u;
        }
    }

    $('fb-back').onclick = function () {
        try { iframe.contentWindow.history.back(); } catch (e) {}
    };
    $('fb-forward').onclick = function () {
        try { iframe.contentWindow.history.forward(); } catch (e) {}
    };
    $('fb-reload').onclick = function () {
        start();
        try { iframe.contentWindow.location.reload(); } catch (e) {}
    };
    $('fb-home').onclick = function () {
        if (o.home) o.home();
    };
    $('fb-full').onclick = function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(function () {});
    };
    $('fb-hide').onclick = function () { document.body.classList.add('fb-hide'); };
    tab.onclick = function () { document.body.classList.remove('fb-hide'); };

    $('fb-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var q = box.value.trim();
        if (!q) return;
        start();
        o.go(q);
        box.blur();
    });

    iframe.addEventListener('load', function () {
        finish();
        sync();
    });

    function toggle() {
        document.body.classList.toggle('fb-on', iframe.classList.contains('visible'));
    }

    new MutationObserver(toggle).observe(iframe, { attributes: true, attributeFilter: ['class'] });
    toggle();
    setInterval(sync, 500);
}
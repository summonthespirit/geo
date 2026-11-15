(function () {
    var def = "aboutblank";
    var redir = "https://www.google.com/";
    var cloak = "Google";
    var icon = "https://www.google.com/favicon.ico";
    var key = "fish-cloak";

    var modes = ["aboutblank", "blob", "off"];
    var allow = "autoplay; fullscreen; clipboard-read; clipboard-write";
    var bg = "#0f141c";
    var fail = null;

    function get() {
        var saved = null;
        try {
            saved = localStorage.getItem(key);
        } catch (e) {}
        return modes.indexOf(saved) !== -1 ? saved : def;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var sel = document.getElementById("cloakMode");
        if (!sel) return;
        sel.value = get();
        sel.addEventListener("change", function () {
            try {
                localStorage.setItem(key, sel.value);
            } catch (e) {}
        });
    });

    var mode = get();
    if (mode === "off") return;
    if (window.top !== window.self) return;
    if (/[?&]nocloak(=|&|$)/.test(location.search)) return;

    function esc(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function blank(url) {
        var w;
        try {
            w = window.open("about:blank", "_blank");
        } catch (e) {
            return { reason: "error", error: e };
        }
        if (!w) return { reason: "blocked" };

        try {
            var d = w.document;
            d.title = cloak;

            var ic = d.createElement("link");
            ic.rel = "icon";
            ic.href = icon;
            d.head.appendChild(ic);

            d.documentElement.style.cssText = "height:100%;background:" + bg;
            d.body.style.cssText = "margin:0;height:100%;overflow:hidden;background:" + bg;

            var f = d.createElement("iframe");
            f.src = url;
            f.setAttribute("allow", allow);
            f.style.cssText =
                "position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;padding:0;background:" + bg;
            d.body.appendChild(f);
        } catch (e) {
            try {
                w.close();
            } catch (_) {}
            return { reason: "error", error: e };
        }
        location.replace(redir);
        return null;
    }

    function blob(url) {
        var html =
            '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(cloak) + "</title>" +
            '<link rel="icon" href="' + esc(icon) + '">' +
            "<style>html,body{margin:0;height:100%;overflow:hidden;background:" + bg + "}" +
            "iframe{position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;padding:0}</style></head>" +
            '<body><iframe src="' + esc(url) + '" allow="' + esc(allow) + '"></iframe></body></html>';

        var u;
        var w;
        try {
            u = URL.createObjectURL(new Blob([html], { type: "text/html" }));
            w = window.open(u, "_blank");
        } catch (e) {
            return { reason: "error", error: e };
        }
        if (!w) {
            try {
                URL.revokeObjectURL(u);
            } catch (_) {}
            return { reason: "blocked" };
        }
        setTimeout(function () {
            location.replace(redir);
        }, 300);
        return null;
    }

    function launch() {
        var order = mode === "blob" ? ["blob", "aboutblank"] : ["aboutblank", "blob"];
        var run = { blob: blob, aboutblank: blank };
        for (var i = 0; i < order.length; i++) {
            var r = run[order[i]](location.href);
            if (!r) return true;
            fail = r;
            if (window.console) console.warn("[cloak] " + order[i] + " failed:", r.reason, r.error || "");
            if (r.reason === "blocked") return false;
        }
        return false;
    }

    if (launch()) return;

    document.addEventListener("DOMContentLoaded", function () {
        var bar = document.createElement("div");
        bar.style.cssText =
            "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;" +
            "display:flex;gap:14px;align-items:center;max-width:min(92vw,560px);padding:12px 16px;" +
            "border-radius:12px;background:rgba(22,29,41,.96);border:1px solid #2a384d;color:#fff;" +
            "font:600 .95rem Sora,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;" +
            "box-shadow:0 8px 32px rgba(0,0,0,.5)";

        var msg = document.createElement("span");
        msg.textContent = "click here to open in a new tab";
        msg.style.cssText = "cursor:pointer;flex:1";

        var stay = document.createElement("span");
        stay.textContent = "stay here";
        stay.style.cssText = "cursor:pointer;opacity:.6;font-weight:500;white-space:nowrap";

        bar.appendChild(msg);
        bar.appendChild(stay);
        document.body.appendChild(bar);

        msg.addEventListener("click", function () {
            if (launch()) return;
            if (fail && fail.reason === "blocked") {
                msg.textContent = "pop-up blocked. allow pop-ups for this site (icon in the address bar), then click again.";
            } else {
                var why = fail && fail.error && fail.error.message;
                msg.textContent = "couldn't open the new tab" + (why ? " (" + why + ")" : "") +
                    ". pick the other mode in settings, or on the url you're on, add /?nocloak.";
            }
        });
        stay.addEventListener("click", function () {
            bar.remove();
        });
    });
})();
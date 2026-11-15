(function () {
	var def = "aboutblank";
	var redir = "https://www.google.com/";
	var cloak = "Google";
	var icon = "https://www.google.com/favicon.ico";
	var key = "fish-cloak";

	var mode = ["aboutblank", "blob", "off"];

	function getMode() {
		var saved = null;
		try {
			saved = localStorage.getItem(key);
		} catch (e) {}
		return mode.indexOf(saved) !== -1 ? saved : def;
	}

	document.addEventListener("DOMContentLoaded", function () {
		var select = document.getElementById("cloak");
		if (!select) return;
		select.value = getMode();
		select.addEventListener("change", function () {
			try {
				localStorage.setItem(key, select.value);
			} catch (e) {}
		});
	});

	var mode = getMode();
	if (mode === "off") return;
	if (window.top !== window.self) return;
	if (/[?&]nocloak(=|&|$)/.test(location.search)) return; // for testing ill prolly remove later, makes it so if you add "?nocloak" to the url it doesnt load automatically

	var ALLOW = "autoplay; fullscreen; clipboard-read; clipboard-write";
	var BG = "#0f141c";

	function esc(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function openAboutBlank(url) {
		var w;
		try {
			w = window.open("about:blank", "_blank");
		} catch (e) {
			return false;
		}
		if (!w) return false;

		try {
			var d = w.document;
			d.title = title;

			var icon = d.createElement("link");
			icon.rel = "icon";
			icon.href = icon;
			d.head.appendChild(icon);

			d.documentElement.style.cssText = "height:100%;background:" + BG;
			d.body.style.cssText = "margin:0;height:100%;overflow:hidden;background:" + BG;

			var frame = d.createElement("iframe");
			frame.src = url;
			frame.setAttribute("allow", ALLOW);
			frame.style.cssText =
				"position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;padding:0;background:" + BG;
			d.body.appendChild(frame);
		} catch (e) {
			try {
				w.close();
			} catch (_) {}
			return false;
		}
		location.replace(redir);
		return true;
	}

	function openBlob(url) {
		var html =
			'<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + "</title>" +
			'<link rel="icon" href="' + esc(icon) + '">' +
			"<style>html,body{margin:0;height:100%;overflow:hidden;background:" + BG + "}" +
			"iframe{position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;padding:0}</style></head>" +
			'<body><iframe src="' + esc(url) + '" allow="' + esc(ALLOW) + '"></iframe></body></html>';

		var blobUrl;
		var w;
		try {
			blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
			w = window.open(blob, "_blank");
		} catch (e) {
			return false;
		}
		if (!w) {
			try {
				URL.revokeObjectURL(blob);
			} catch (_) {}
			return false;
		}
		setTimeout(function () {
			location.replace(redir);
		}, 300);
		return true;
	}

	function launch() {
		return mode === "blob" ? openBlob(location.href) : openAboutBlank(location.href);
	}

	if (launch()) return;

	var hint;
	function onClick(e) {
		e.stopImmediatePropagation();
		e.preventDefault();
		if (!launch() && hint) {
			hint.textContent = "pop-up blocked. allow pop-ups for this site, then click again.";
		}
	}
	window.addEventListener("click", onClick, true);

	document.addEventListener("DOMContentLoaded", function () {
		hint = document.createElement("div");
		hint.textContent = "click anywhere to continue";
		hint.style.cssText =
			"position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
			"justify-content:center;background:#0f141c;color:#ffffff;" +
			"font:600 1.1rem Sora,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;" +
			"cursor:pointer;text-align:center;padding:2rem";
		document.body.appendChild(hint);
	});
})();
import fs from 'node:fs';

var input = process.argv[2] || 'index.html';
var output = process.argv[3] || 'index.svg';

var html = fs.readFileSync(input, 'utf8');
var t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
var title = t ? t[1].trim() : '';
var b = html.match(/--bg-dark:\s*(#[0-9a-fA-F]{3,8})/);
var bg = b ? b[1] : '#0f141c';

function text(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function attr(s) {
    return text(s)
        .replace(/"/g, '&quot;')
        .replace(/\t/g, '&#9;')
        .replace(/\r/g, '&#13;')
        .replace(/\n/g, '&#10;');
}

var svg =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\n' +
    '<title>' + text(title) + '</title>\n' +
    '<rect width="100%" height="100%" fill="' + bg + '"/>\n' +
    '<foreignObject x="0" y="0" width="100%" height="100%">\n' +
    '<iframe xmlns="http://www.w3.org/1999/xhtml" data-svghost="" allowfullscreen="" ' +
    'allow="autoplay; fullscreen; clipboard-read; clipboard-write" ' +
    'style="border:0;margin:0;padding:0;width:100%;height:100%;display:block" ' +
    'srcdoc="' + attr(html) + '"></iframe>\n' +
    '</foreignObject>\n' +
    '</svg>\n';

fs.writeFileSync(output, svg);
console.log(input + ' (' + html.length + ' bytes) -> ' + output + ' (' + svg.length + ' bytes)');

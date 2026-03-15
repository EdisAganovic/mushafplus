
const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgCode = fs.readFileSync('c:/Users/Ensarija/Desktop/preslusavanje/assets/optimized/245.svg', 'utf8');
const dom = new JSDOM(svgCode);
const svgEl = dom.window.document.querySelector('svg');

function pInfo(el) {
    const d = el.getAttribute('d') || '';
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    const loops = (d.match(/z/gi) || []).length;
    
    let ty = 200;
    let cur = el.parentElement;
    while (cur && cur.tagName !== 'svg') {
        const tr = cur.getAttribute('transform') || '';
        const m = tr.match(/translate\s*\(\s*[\d.+-]+\s+([\d.+-]+)/);
        if (m) { ty = parseFloat(m[1]); break; }
        cur = cur.parentElement;
    }
    return { id: el.id, fill, len: d.length, loops, ty, parent: el.parentElement.id };
}

const g10 = svgEl.querySelector('#g10');
const topGroups = Array.from(g10.children).filter(el => el.tagName === 'g');

console.log(`Analyzing Page 245.svg - Top Groups count: ${topGroups.length}`);

topGroups.forEach(grp => {
    const paths = Array.from(grp.querySelectorAll('path')).map(pInfo);
    if (paths.length === 0) return;
    
    const greens = paths.filter(p => p.fill === '#bfe8c1');
    const blacks = paths.filter(p => p.fill === '#231f20');
    const whites = paths.filter(p => p.fill === '#ffffff' || p.fill === '#fff');
    
    console.log(`Group ${grp.id}: paths=${paths.length} green=${greens.length} black=${blacks.length} white=${whites.length}`);
    
    if (blacks.length > 0 && greens.length === 0) {
        const isBody = blacks.length > 10 || blacks.reduce((a,b)=>a+b.len,0) > 60000;
        console.log(`  Black Group: isBody=${isBody}`);
        blacks.forEach(p => {
            console.log(`    path ${p.id}: len=${p.len} ty=${p.ty} loops=${p.loops}`);
        });
    }
});

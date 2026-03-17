const fs = require('fs');

const cssPath = 'c:\\Users\\Ensarija\\Desktop\\preslusavanje\\css\\styles.css';
const themesPath = 'c:\\Users\\Ensarija\\Desktop\\preslusavanje\\css\\themes.css';

let content = fs.readFileSync(cssPath, 'utf8');
const lines = content.split(/\r?\n/);

// Remove from bottom to top so line numbers don't shift!

// Block 3: SVG Layers & Theme Colors (1860 to end)
const block3 = lines.splice(1860 - 1, 2117 - 1860 + 1).join('\n');

// Block 2: Page Theme Variables (1340 to 1465)
const block2 = lines.splice(1340 - 1, 1465 - 1340 + 1).join('\n');

// Block 1: Theme Variables & Light mode overrides (13 to 124)
const block1 = lines.splice(13 - 1, 124 - 13 + 1).join('\n');

const themesCssContent = `/**
 * @file themes.css
 * @description Theme-related variables and overrides (extracted from styles.css)
 */

${block1}

${block2}

${block3}
`;

fs.writeFileSync(themesPath, themesCssContent, 'utf8');
fs.writeFileSync(cssPath, lines.join('\n'), 'utf8');

console.log('Successfully extracted CSS themes to css/themes.css');

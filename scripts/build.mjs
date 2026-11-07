import fs from 'node:fs/promises';
const template=await fs.readFile('src/template.html','utf8');
const css=await fs.readFile('src/styles.css','utf8');
const scripts=await Promise.all(['model','seed','app'].map(async name=>(await fs.readFile(`src/${name}.js`,'utf8')).replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')));
const html=template.replace('/* BUILD_STYLES */',()=>css).replace('/* BUILD_SCRIPT */',()=>scripts.join('\n').replaceAll('</script','<\\/script'));
if(/\bimport\s+.+?\bfrom\b/.test(html))throw new Error('Unresolved module import in build.');
await fs.writeFile('index.html',html);
console.log(`Built standalone index.html (${Math.round(Buffer.byteLength(html)/1024)} KB). No dependencies or external assets.`);

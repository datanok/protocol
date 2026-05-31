const fs = require('fs');
const path = require('path');

const filesToConvert = [
  { file: 'fdc9fa9056ba49e58aa331d7b742ed5e_code.html', out: 'src/app/command/page.tsx', name: 'CommandDashboard' },
  { file: '60d42d65f4714dbb8562d8b35c5aea6d_code.html', out: 'src/app/reports/weekly/page.tsx', name: 'WeeklySystemReport' },
  { file: '3d2282bc885f48d58e7ff8cc474fcbb6_code.html', out: 'src/app/reports/debrief/page.tsx', name: 'WeeklyDebrief' },
  { file: '9591a55941b94f6c94dbd411d6e6bc6b_code.html', out: 'src/app/commit/workout/page.tsx', name: 'WorkoutCommitFlow' },
  { file: 'ede03c3e4a3c4ffdaf8fbe0377f2b1d5_code.html', out: 'src/app/skills/guitar/page.tsx', name: 'GuitarSkillTree' },
  { file: 'f4ed454e90ff4ec0b95b2766f86bce6c_code.html', out: 'src/app/mobile/page.tsx', name: 'MobileCommandView' },
];

for (const { file, out, name } of filesToConvert) {
  const htmlPath = path.join(__dirname, 'stitch-export', file);
  if (!fs.existsSync(htmlPath)) {
    console.log(`Skipping ${file}, not found.`);
    continue;
  }
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) continue;
  
  let bodyContent = bodyMatch[1];
  
  // Basic React conversions
  bodyContent = bodyContent.replace(/class="/g, 'className="');
  bodyContent = bodyContent.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
  bodyContent = bodyContent.replace(/<img([^>]+)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<img${p1} />`;
  });
  bodyContent = bodyContent.replace(/<br>/g, '<br />');
  bodyContent = bodyContent.replace(/<hr([^>]*)>/g, '<hr$1 />');
  bodyContent = bodyContent.replace(/<input([^>]+)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<input${p1} />`;
  });
  // Handle inline styles roughly
  bodyContent = bodyContent.replace(/style="([^"]+)"/g, (match, styleString) => {
    // very basic parser for style
    const styles = styleString.split(';').filter(s => s.trim());
    let obj = {};
    styles.forEach(s => {
      let [key, val] = s.split(':');
      if (key && val) {
        let camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        obj[camelKey] = val.trim();
      }
    });
    return `style={${JSON.stringify(obj)}}`;
  });

  // Extract <style> from head if present
  let styleTags = '';
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    const styleMatches = headMatch[1].match(/<style[^>]*>([\s\S]*?)<\/style>/ig);
    if (styleMatches) {
        styleTags = styleMatches.map(s => {
            return s.replace(/<style[^>]*>/i, '<style jsx>{`').replace(/<\/style>/i, '`}</style>');
        }).join('\n');
    }
  }

  const outDir = path.dirname(path.join(__dirname, out));
  fs.mkdirSync(outDir, { recursive: true });

  const componentCode = `
export default function ${name}() {
  return (
    <>
      ${styleTags}
      <div className="bg-[#080808] text-on-surface font-sans min-h-screen">
        ${bodyContent}
      </div>
    </>
  );
}
`;

  fs.writeFileSync(path.join(__dirname, out), componentCode);
  console.log(`Converted ${name} -> ${out}`);
}

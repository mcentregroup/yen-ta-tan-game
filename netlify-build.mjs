import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const config = `window.__SUPABASE_URL__ = ${JSON.stringify(process.env.SUPABASE_URL || '')};\nwindow.__SUPABASE_ANON_KEY__ = ${JSON.stringify(process.env.SUPABASE_ANON_KEY || '')};\n`;
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
await Promise.all(['index.html', 'styles.css', 'app.js', 'questions-template.csv'].map(file => cp(file, `dist/${file}`)));
await writeFile('dist/runtime-config.js', config);
console.log('Static site generated in dist with Supabase public configuration');

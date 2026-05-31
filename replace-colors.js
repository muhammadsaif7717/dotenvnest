const fs = require('fs');
const path = require('path');

const files = [
  'src/app/login/page.tsx',
  'src/app/signup/page.tsx',
  'src/app/verify/page.tsx'
];

const replacements = [
  { search: /bg-white dark:bg-\[\#0a0a0a\]/g, replace: 'bg-background' },
  { search: /text-zinc-800 dark:text-\[\#e8e8e8\]/g, replace: 'text-foreground' },
  { search: /dark:border-\[\#141414\]/g, replace: 'dark:border-zinc-900' },
  { search: /dark:border-\[\#1e1e1e\]/g, replace: 'dark:border-zinc-800' },
  { search: /dark:bg-\[\#00ff88\]/g, replace: 'dark:bg-emerald-400' },
  { search: /dark:text-\[\#00ff88\]/g, replace: 'dark:text-emerald-400' },
  { search: /dark:text-\[\#444\]/g, replace: 'dark:text-zinc-600' },
  { search: /dark:text-\[\#555\]/g, replace: 'dark:text-zinc-500' },
  { search: /dark:bg-\[\#111\]/g, replace: 'dark:bg-zinc-900' },
  { search: /dark:hover:text-\[\#e8e8e8\]/g, replace: 'dark:hover:text-zinc-100' },
  { search: /dark:hover:border-\[\#333\]/g, replace: 'dark:hover:border-zinc-700' },
  { search: /dark:bg-\[\#0e0e0e\]/g, replace: 'dark:bg-zinc-950' },
  { search: /dark:bg-\[\#0d0d0d\]/g, replace: 'dark:bg-zinc-900' },
  { search: /dark:text-\[\#333\]/g, replace: 'dark:text-zinc-700' },
  { search: /dark:placeholder-\[\#333\]/g, replace: 'dark:placeholder-zinc-700' },
  { search: /dark:focus-visible:ring-\[\#00ff88\]\/20/g, replace: 'dark:focus-visible:ring-emerald-500/20' },
  { search: /dark:focus-visible:border-\[\#00ff88\]/g, replace: 'dark:focus-visible:border-emerald-500' },
  { search: /dark:text-\[\#888\]/g, replace: 'dark:text-zinc-400' },
  { search: /dark:bg-\[\#ff4444\]\/8/g, replace: 'dark:bg-red-950/30' },
  { search: /dark:border-\[\#ff4444\]\/25/g, replace: 'dark:border-red-800' },
  { search: /dark:text-\[\#ff4444\]/g, replace: 'dark:text-red-400' },
  { search: /dark:hover:bg-\[\#111\]/g, replace: 'dark:hover:bg-zinc-900' },
  { search: /dark:bg-\[\#00ff88\]\/20/g, replace: 'dark:bg-emerald-900/40' },
  { search: /dark:border-\[\#00ff88\]\/30/g, replace: 'dark:border-emerald-800' },
  { search: /dark:hover:bg-\[\#00ff88\]\/20/g, replace: 'dark:hover:bg-emerald-900/50' },
  { search: /dark:text-\[\#0a0a0a\]/g, replace: 'dark:text-zinc-950' },
  { search: /dark:hover:bg-\[\#00e07a\]/g, replace: 'dark:hover:bg-emerald-500' },
  { search: /dark:text-\[\#2a2a2a\]/g, replace: 'dark:text-zinc-800' },
  { search: /color === "dark" \? "\#00ff88" : "\#10b981"/g, replace: 'color === "dark" ? "#34d399" : "#10b981"' },
  { search: /theme === "dark" \? "\#00ff88" : "\#10b981"/g, replace: 'theme === "dark" ? "#34d399" : "#10b981"' }
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    replacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

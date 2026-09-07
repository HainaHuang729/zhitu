import { spawnSync } from 'node:child_process';
const git = args => { const r = spawnSync('git', args, {encoding:'utf8',maxBuffer:20*1024*1024}); if(r.status!==0)throw new Error(r.stderr||'Git read failed'); return r.stdout; };
const revisions = git(['rev-list','--all']).trim().split('\n').filter(Boolean);
const key = process.env.DEEPSEEK_API_KEY;
const pattern = /(?:sk-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9_]{25,}|github_pat_[A-Za-z0-9_]{25,}|art_v2_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const objects = new Map();
for (const revision of revisions) {
 for (const line of git(['ls-tree','-r',revision]).trim().split('\n')) {
  const match = line.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);
  if(match)objects.set(match[1],match[2]);
 }
}
const bad=[];
for(const [sha,path] of objects){
 const text=git(['cat-file','blob',sha]);
 if((key&&text.includes(key))||pattern.test(text)||/(?:^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?)$/.test(path))bad.push(path);
}
if(bad.length){console.error('Potential secret in tracked history; paths only:',[...new Set(bad)].join(', '));process.exit(1);}
console.log(`Secret check passed: ${revisions.length} commits, ${objects.size} distinct tracked blobs. No known DeepSeek key, common token pattern or environment secret file found.`);

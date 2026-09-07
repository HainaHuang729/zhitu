import assert from 'node:assert/strict';
import { parseRequest, parseQuestion, parseReport, parseFollowup } from './lib/assessment.ts';
const inviteHeaders=process.env.SITE_ACCESS_CODE ? {'X-Invite-Code':process.env.SITE_ACCESS_CODE} : {};
const turns=[{question:'申请阶段？',answer:'硕士'}];
assert.equal(parseRequest({mode:'question',turns}).turns.length,1);
assert.throws(()=>parseRequest({mode:'report',turns}));
assert.throws(()=>parseRequest({mode:'question',turns:[{question:'',answer:'硕士'}]}));
assert.throws(()=>parseRequest({mode:'question',turns:Array(11).fill(turns[0])}));
assert.throws(()=>parseRequest({mode:'followup',turns:Array(3).fill(turns[0]),topic:'purchase'}));
assert.throws(()=>parseQuestion({kind:'complete'},1));
assert.equal(parseQuestion({kind:'complete'},6).kind,'complete');
assert.ok(parseQuestion({kind:'question',feedback:'先确认背景。',question:'目前阶段？',options:['本科在读','已毕业']},1).options.includes('暂不确定'));
assert.throws(()=>parseQuestion({kind:'question',feedback:'反馈',question:'问题',options:['A','A']},2));
assert.throws(()=>parseReport({summary:'没有足够结构'}));
assert.throws(()=>parseFollowup({title:'没有步骤'}));
if(process.argv[2]){
 const base=process.argv[2];
 const response=await fetch(base);assert.equal(response.status,200);
 const html=await response.text();
 assert.ok(html.includes('data-answer-mode="ai-choices"'));
 assert.ok(!html.includes('尚未连接 AI'));
 for(const removed of ['顾问入驻','我的申请档案','<textarea'])assert.ok(!html.includes(removed));
 const invalid=await fetch(new URL('/api/assessment',base),{method:'POST',headers:{'Content-Type':'application/json',...inviteHeaders},body:JSON.stringify({mode:'question',turns:[]})});assert.equal(invalid.status,400);
 const cross=await fetch(new URL('/api/assessment',base),{method:'POST',headers:{'Content-Type':'application/json',...inviteHeaders,Origin:'https://example.invalid'},body:JSON.stringify({mode:'question',turns})});assert.equal(cross.status,403);
}
console.log('Assessment schema, limits, optional-answer handling and route safeguards passed.');
if(process.argv[3] === '--live') {
 const turns=[
  {question:'你计划申请哪个阶段？',answer:'硕士'},
  {question:'目前的教育背景？',answer:'国内本科大三，金融专业，均分85/100'},
  {question:'意向地区和专业？',answer:'香港或新加坡，纠结金融与商业分析'},
  {question:'希望什么时候入学？',answer:'2027年秋季，可调整'},
  {question:'语言和经历？',answer:'雅思备考中，有两个月银行实习，学过Python'},
  {question:'预算与资助？',answer:'总预算45万元，不必须资助'},
  {question:'目前最想解决的问题？',answer:'专业方向选择与准备优先级，不想买全套服务'},
 ];
 async function call(body){
  const response=await fetch(new URL('/api/assessment',process.argv[2]),{method:'POST',headers:{'Content-Type':'application/json',...inviteHeaders},body:JSON.stringify(body)});
  const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));return result;
 }
 const report=await call({mode:'report',turns});assert.equal(report.kind,'report');parseReport(report.report);
 console.log(JSON.stringify({report:report.report},null,2));
 const followup=await call({mode:'followup',turns,topic:'brief'});assert.equal(followup.kind,'followup');parseFollowup(followup.followup);
 console.log(JSON.stringify({followup:followup.followup},null,2));
 const next=await call({mode:'question',turns:[{question:'你计划申请哪个阶段？',answer:'本科'}]});assert.equal(next.kind,'question');assert.notEqual(next.question,'你计划申请哪个阶段？');
 console.log(JSON.stringify({undergraduateQuestion:next},null,2));
 console.log('Real DeepSeek question, report and consultant brief calls passed.');
}
// Exercise the route's format-repair path with deterministic provider responses.
const fs = await import('node:fs');
const ts = await import('typescript');
const compiled = ts.default.transpileModule(fs.readFileSync('app/api/assessment/route.ts','utf8'),{compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.ESNext}}).outputText.replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
const makeHandler = (mock, quota = async()=>true) => new Function('runtime','json','accessError','reserveAiCall','preflight','fetch','parseRequest','parseQuestion','parseReport','parseFollowup',compiled+'\nreturn POST;')({DEEPSEEK_API_KEY:'test-only'},(body,status=200)=>Response.json(body,{status}),async()=>null,quota,()=>Response.json({ok:true}),mock,parseRequest,parseQuestion,parseReport,parseFollowup);
const body={mode:'followup',topic:'brief',turns:Array(3).fill({question:'申请阶段？',answer:'硕士'})};
const validFollowup={title:'咨询清单',summary:'先确认具体需求',steps:[{title:'整理背景',detail:'整理成绩口径'},{title:'确认目标',detail:'整理专业兴趣'}],questions:['需要哪类帮助？']};
let attempts=0;
const handler=makeHandler(async()=>{attempts++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(attempts===1?{bad:'shape'}:validFollowup)}}]});});
const repaired=await handler(new Request('https://unit.test/api/assessment',{method:'POST',headers:{'Content-Type':'application/json',...inviteHeaders},body:JSON.stringify(body)}));
assert.equal(repaired.status,200);assert.equal(attempts,2);assert.equal((await repaired.json()).kind,'followup');
attempts=0;
const unavailable=makeHandler(async()=>{attempts++;return new Response('',{status:401});});
const rejected=await unavailable(new Request('https://unit.test/api/assessment',{method:'POST',headers:{'Content-Type':'application/json',...inviteHeaders},body:JSON.stringify(body)}));
assert.equal(rejected.status,503);assert.equal(attempts,1);
console.log('Malformed provider output retries once; authentication failure does not retry.');

attempts=0;
const exhausted=makeHandler(async()=>{attempts++;throw new Error('Provider must not be called');},async()=>false);
assert.equal((await exhausted(new Request('https://unit.test/api/assessment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}))).status,429);
assert.equal(attempts,0);
const {DatabaseSync}=await import('node:sqlite');
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('drizzle/0000_worthless_shatterstar.sql','utf8'));
const accessCompiled=ts.default.transpileModule(fs.readFileSync('lib/access.ts','utf8'),{compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.ESNext}}).outputText.replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
const access=new Function('env',accessCompiled+'\nreturn {accessError,preflight,reserveAiCall};')({SITE_ACCESS_CODE:'test-invite',DAILY_AI_LIMIT:'2',DB:{prepare:sql=>({bind:(...values)=>({first:async()=>db.prepare(sql).get(...values)||null})})}});
assert.equal((await access.accessError(new Request('https://unit.test/api/access'))).status,401);
assert.equal(await access.accessError(new Request('https://unit.test/api/access',{headers:{'X-Invite-Code':'test-invite'}})),null);
assert.equal(access.preflight(new Request('https://unit.test/api/access',{headers:{Origin:'https://hainahuang729.github.io'}})).headers.get('Access-Control-Allow-Origin'),'https://hainahuang729.github.io');
assert.equal(access.preflight(new Request('https://unit.test/api/access',{headers:{Origin:'https://attacker.invalid'}})).status,403);
assert.equal(await access.reserveAiCall(),true);assert.equal(await access.reserveAiCall(),true);assert.equal(await access.reserveAiCall(),false);
assert.equal(db.prepare('SELECT used FROM ai_quota').get().used,2);
db.close();
console.log('Invite protection, allowed Pages origin, and atomic daily quota passed.');

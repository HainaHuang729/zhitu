import assert from 'node:assert/strict';
const base = process.argv[2];
assert.ok(base, 'Pass the local or deployed site URL');
const headers = process.env.SITE_VERIFY_TOKEN ? { 'OAI-Sites-Authorization': process.env.SITE_VERIFY_TOKEN } : {};
const response = await fetch(base, { headers });
assert.equal(response.status, 200);
const html = await response.text();
assert.ok(html.includes('planning-chat-only'), 'Chat-only page was not served');
assert.ok(html.includes('聊聊你的计划'));
assert.ok(html.includes('你的回答'));
for (const removed of ['顾问入驻', '我的申请档案', '服务与顾问', '体验示例', 'YOUR NEXT CHAPTER']) {
  assert.ok(!html.includes(removed), `Removed module is still served: ${removed}`);
}
console.log('Verified served page: chat only; all five old module markers absent.');

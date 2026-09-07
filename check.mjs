import assert from 'node:assert/strict';
import { getQuestions } from './lib/questions.ts';
for (const stage of ['本科', '硕士', '博士', '暂不确定']) {
  const questions = getQuestions(stage);
  assert.equal(questions.length, 10);
  for (const question of questions) {
    assert.ok(question.title && question.options.length >= 3);
    assert.equal(new Set(question.options).size, question.options.length);
  }
  assert.ok(questions[6].title.includes(stage === '本科' ? '课程体系' : stage === '博士' ? '研究经历' : '相关经历'));
}
if (process.argv[2]) {
  const response = await fetch(process.argv[2]);
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const required of ['planning-chat-only', 'data-answer-mode="choices"', '聊聊你的计划', '本科', '硕士', '博士', '暂不确定']) assert.ok(html.includes(required), required);
  for (const removed of ['<textarea', '顾问入驻', '我的申请档案', '服务与顾问', '体验示例']) assert.ok(!html.includes(removed), removed);
}
console.log('Choice questions verified for all stages; served page checked when URL supplied.');

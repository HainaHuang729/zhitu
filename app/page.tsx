'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Compass, RotateCcw } from 'lucide-react';

const questions = [
  '你计划申请本科、硕士，还是博士？',
  '你现在读到哪个阶段？可以说说专业和成绩，学校名称可以暂不透露。',
  '有想去的国家、地区或专业方向吗？还没确定也没关系。',
  '你希望什么时候入学？',
  '你的语言准备和相关经历怎么样？',
  '留学总预算大约是多少？是否需要奖学金或资助？',
  '你现在最想解决的一个问题是什么？',
];

export default function Page() {
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const step = answers.length;
  const done = step >= questions.length;
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [step]);
  function send(value: string) {
    if (!value.trim() || done) return;
    setAnswers(current => [...current, value.trim()]);
    setInput('');
  }
  function reset() { setAnswers([]); setInput(''); }
  function nextQuestion(index: number) {
    if (index === 3 && answers[0] === '博士') return '你有哪些研究兴趣和研究经历？语言准备到哪一步了？';
    if (index === 3 && answers[0] === '本科') return '你的课程体系、语言和课外活动准备如何？';
    return questions[index + 1];
  }
  return <main className="chat-only" data-experience="planning-chat-only">
    <header>
      <span className="brand"><Compass size={23} />知途</span>
      <button className="reset" onClick={reset}><RotateCcw size={15} />重新开始</button>
    </header>
    <div className="heading"><h1>聊聊你的计划</h1><p>先从你的情况说起。</p></div>
    <section className="conversation" aria-label="留学计划对话">
      <div className="messages" role="log" aria-live="polite">
        <div className="message assistant"><span className="avatar"><Compass size={18}/></span><div><p>你好，不用一次想清所有答案。</p><p>{questions[0]}</p></div></div>
        {answers.map((answer, index) => <div key={index}>
          <div className="message user"><div>{answer}</div></div>
          <div className="message assistant"><span className="avatar"><Compass size={18}/></span><div>{index === questions.length - 1 ? '本轮演示已结束。连接 AI 后，才能根据你的回答继续动态追问。' : nextQuestion(index)}</div></div>
        </div>)}
        <div ref={end}/>
      </div>
      {!done ? <div className="composer">
        {step === 0 && <div className="choices">{['本科', '硕士', '博士'].map(value => <button key={value} onClick={() => send(value)}>{value}</button>)}</div>}
        <form onSubmit={event => { event.preventDefault(); send(input); }}>
          <textarea aria-label="你的回答" placeholder="说说你的情况…" value={input} onChange={event => setInput(event.target.value)} maxLength={1500} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }}/>
          <button className="send" type="submit" disabled={!input.trim()} aria-label="发送"><ArrowUp size={20}/></button>
        </form>
        <div className="input-help"><span>Enter 发送 · Shift + Enter 换行</span>{step > 0 && <button onClick={() => send('暂不确定')}>暂不确定</button>}</div>
      </div> : <button className="restart" onClick={reset}>重新聊聊</button>}
    </section>
    <footer>演示对话 · 尚未连接 AI · 刷新后回答清空</footer>
  </main>;
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuestions } from '@/lib/questions';

export default function Page() {
  const [answers, setAnswers] = useState<string[]>([]);
  const questions = getQuestions(answers[0]);
  const step = answers.length;
  const done = step === questions.length;
  const end = useRef<HTMLDivElement>(null);
  const optionPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (step > 0) optionPanel.current?.focus({ preventScroll: true });
  }, [step]);
  function choose(value: string) {
    if (done || !questions[step].options.includes(value)) return;
    setAnswers(current => current.length === step ? [...current, value] : current);
  }
  return <main className="chat-only" data-experience="planning-chat-only" data-answer-mode="choices">
    <header><span className="brand"><Compass size={23}/>知途</span><button className="reset" onClick={() => setAnswers([])}><RotateCcw size={15}/>重新开始</button></header>
    <div className="heading"><h1>聊聊你的计划</h1><p>点击选项就好，不确定也没关系。</p></div>
    <section aria-label="留学计划对话">
      <div className="messages" role="log" aria-live="polite">
        <div className="message assistant"><span className="avatar"><Compass size={18}/></span><div>{questions[0].title}</div></div>
        {answers.map((answer, index) => <div key={index}>
          <div className="message user"><div>{answer}</div></div>
          <div className="message assistant"><span className="avatar"><Compass size={18}/></span><div>{index === questions.length - 1 ? '谢谢，已经了解你的基本意向。本轮演示到这里，后续可以继续细聊你的具体情况。' : questions[index + 1].title}</div></div>
        </div>)}
        <div ref={end}/>
      </div>
      {!done ? <div className="option-panel" ref={optionPanel} tabIndex={-1} aria-labelledby="current-question">
        <div className="question-meta"><span>第 {step + 1} / {questions.length} 题 · 单选</span>{step > 0 && <button className="back" onClick={() => setAnswers(current => current.slice(0, -1))}><ChevronLeft size={14}/>上一题</button>}</div>
        <h2 id="current-question" className="question-title">{questions[step].title}</h2>
        <div className="choices">{questions[step].options.map((value, index) => <Button key={`${step}-${value}`} variant="outline" className="choice" onClick={() => choose(value)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span className="choice-label">{value}</span><ChevronRight size={16}/></Button>)}</div>
      </div> : <div className="finish-actions"><button className="back" onClick={() => setAnswers(current => current.slice(0, -1))}><ChevronLeft size={14}/>修改上一题</button><Button className="restart" onClick={() => setAnswers([])}>重新聊聊</Button></div>}
    </section>
    <footer>选择题演示 · 尚未连接 AI · 刷新后回答清空</footer>
  </main>;
}

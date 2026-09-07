'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, RotateCcw, LoaderCircle, Download, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initialQuestion } from '@/lib/assessment';
import type { Question, Turn, Report, Followup, Topic, RequestData } from '@/lib/assessment';

type Result = Question | { kind: 'complete' } | { kind: 'report'; report: Report } | { kind: 'followup'; followup: Followup };
const topicLabels: Record<Topic, string> = { plan: '细化30天计划', direction: '比较可选方向', brief: '准备顾问咨询' };

export default function Page() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [frames, setFrames] = useState<Question[]>([initialQuestion]);
  const [report, setReport] = useState<Report | null>(null);
  const [followup, setFollowup] = useState<Followup | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const pending = useRef<RequestData | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const focusPanel = useRef<HTMLDivElement>(null);
  const reportPanel = useRef<HTMLDivElement>(null);
  const followupPanel = useRef<HTMLElement>(null);
  const question = frames[turns.length];
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [turns.length, frames.length, busy]);
  useEffect(() => { if (report) reportPanel.current?.focus({ preventScroll: true }); }, [report]);
  useEffect(() => { if (followup) followupPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [followup]);
  useEffect(() => () => controller.current?.abort(), []);

  async function run(data: RequestData) {
    if (controller.current) return;
    const active = new AbortController();
    controller.current = active;
    pending.current = data;
    setError('');
    setBusy(data.mode === 'question' ? '正在根据你的回答思考下一问…' : data.mode === 'report' ? '正在整理你的申请报告…' : '正在细化下一步…');
    try {
      async function call(input: RequestData): Promise<Result> {
        pending.current = input;
        const response = await fetch('/api/assessment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: active.signal });
        const result = await response.json() as Result & { error?: string };
        if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : '暂时连接不上 AI，请重试。');
        return result;
      }
      let result = await call(data);
      if (result.kind === 'complete') {
        setBusy('信息已经足够，正在生成你的申请报告…');
        result = await call({ mode: 'report', turns: data.turns });
      }
      if (active.signal.aborted) return;
      if (result.kind === 'question') {
        setFrames(current => [...current.slice(0, data.turns.length), result as Question]);
        requestAnimationFrame(() => focusPanel.current?.focus({ preventScroll: true }));
      } else if (result.kind === 'report') {
        setReport(result.report); setFollowup(null);
      } else if (result.kind === 'followup') setFollowup(result.followup);
      else throw new Error('AI 返回不完整，请重试。');
      pending.current = null;
    } catch (failure) {
      if (!active.signal.aborted) setError(failure instanceof Error ? failure.message : '连接中断，请重试。');
    } finally {
      if (controller.current === active) { controller.current = null; setBusy(''); }
    }
  }
  function choose(value: string) {
    if (controller.current || !question?.options.includes(value)) return;
    const next = [...turns, { question: question.question, answer: value }];
    setTurns(next);
    void run({ mode: 'question', turns: next });
  }
  function back(index: number) {
    controller.current?.abort(); controller.current = null; pending.current = null;
    setTurns(current => current.slice(0, index)); setFrames(current => current.slice(0, index + 1));
    setReport(null); setFollowup(null); setBusy(''); setError('');
  }
  function reset() { back(0); setFrames([initialQuestion]); }
  function download() {
    if (!report) return;
    const content = ['# 知途 · 留学初步规划报告', `生成日期：${new Date().toLocaleDateString('zh-CN')}`, report.summary, '## 已确认的信息', ...report.profile.map(row => `- ${row.label}：${row.value}`), '## 已有基础', ...report.strengths.map(value => `- ${value}`), '## 待确认的信息', ...report.unknowns.map(value => `- ${value}`), '## 行动建议', ...report.actions.map((row, index) => `${index + 1}. ${row.title}\n${row.detail}`), '## 可选的服务帮助', ...report.serviceNeeds.map(row => `- ${row.name}：${row.reason}\n期望交付：${row.deliverable}`), ...(followup ? [`## ${followup.title}`, followup.summary, ...followup.steps.map(row => `### ${row.title}\n${row.detail}`), ...followup.questions.map(value => `- 待确认：${value}`)] : []), '## 原始问答', ...turns.map(row => `- ${row.question}\n  ${row.answer}`), '本报告由 DeepSeek 基于当前回答生成，包含初步推断。具体院校要求、费用与截止日期请通过官方渠道核实；报告不构成录取保证。'].join('\n\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = '知途-留学规划报告.md'; link.click(); URL.revokeObjectURL(url);
  }

  return <main className="chat-only" data-experience="planning-chat-only" data-answer-mode="ai-choices">
    <header><span className="brand"><Compass size={23}/>知途</span><button className="reset" onClick={reset}><RotateCcw size={15}/>重新开始</button></header>
    <div className="heading"><h1>{report ? '你的留学初步规划' : '聊聊你的计划'}</h1><p>{report ? '从了解自己，到知道下一步做什么。' : '点击选择，AI 会根据你的回答继续提问。'}</p></div>
    {!report ? <section aria-label="留学计划对话">
      <div className="messages" role="log" aria-live="polite">
        <div className="message assistant"><span className="avatar"><Compass size={18}/></span><div><p>{initialQuestion.feedback}</p><p>{initialQuestion.question}</p></div></div>
        {turns.map((turn, index) => <div key={`${index}-${turn.question}`}>
          <div className="message user"><div>{turn.answer}</div></div>
          {frames[index + 1] && <div className="message assistant"><span className="avatar"><Compass size={18}/></span><div><p className="feedback">{frames[index + 1].feedback}</p><p>{frames[index + 1].question}</p></div></div>}
        </div>)}
        {busy && <div className="working" role="status"><LoaderCircle size={17}/>{busy}</div>}
        <div ref={end}/>
      </div>
      {!busy && !error && question && <div className="option-panel" ref={focusPanel} tabIndex={-1} aria-labelledby="current-question">
        <div className="question-meta"><span>第 {turns.length + 1} 题 · 单选</span>{turns.length > 0 && <button className="back" onClick={() => back(turns.length - 1)}><ChevronLeft size={14}/>上一题</button>}</div>
        <h2 id="current-question" className="question-title">{question.question}</h2>
        <div className="choices">{question.options.map((value, index) => <Button key={`${turns.length}-${value}`} variant="outline" className="choice" onClick={() => choose(value)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span className="choice-label">{value}</span><ChevronRight size={16}/></Button>)}</div>
        {turns.length >= 3 && <button className="early-report" onClick={() => void run({ mode: 'report', turns })}>先用已有信息生成初步报告 <ArrowUpRight size={14}/></button>}
      </div>}
      {!turns.length && <p className="privacy-note">你的选择将发送给 DeepSeek，用于提问和生成报告。无需提供姓名或联系方式。</p>}
    </section> : <div className="report" ref={reportPanel} tabIndex={-1} aria-label="留学初步规划报告">
      <section className="report-intro"><span className="report-label">AI 初步分析 · {new Date().toLocaleDateString('zh-CN')}</span><p>{report.summary}</p><button onClick={download}><Download size={15}/>下载报告</button></section>
      <details className="profile-details"><summary>查看信息与回答 · 可修改</summary><dl>{report.profile.map((row, index) => <div key={index}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl><div className="answer-history">{turns.map((turn, index) => <div key={index}><p>{turn.question}<br/><strong>{turn.answer}</strong></p><button onClick={() => back(index)} disabled={!!busy}>修改</button></div>)}</div><small>修改某一题后，会重新询问后续问题，并更新报告。</small></details>
      {report.strengths.length > 0 && <section className="report-section"><h2>你已经具备的基础</h2><ul>{report.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
      <section className="report-section"><h2>接下来，优先做这些</h2>{report.actions.map((item, index) => <article className="action" key={index}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</section>
      <section className="unknowns"><h2>还需要确认</h2><ul>{report.unknowns.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
      {report.serviceNeeds.length > 0 && <details className="profile-details"><summary>如果需要协助，可以了解哪些服务</summary>{report.serviceNeeds.map((item, index) => <article className="service-need" key={index}><h3>{item.name}</h3><p>{item.reason}</p><p><strong>应获得的交付：</strong>{item.deliverable}</p></article>)}<small>服务是否必要由你决定。这里是需求建议，尚未连接顾问接单或购买系统。</small></details>}
      <section className="next-step"><h2>继续下一步</h2><p>选一个方向，让 AI 帮你继续梳理。</p><div className="followup-options">{(Object.keys(topicLabels) as Topic[]).map(topic => <Button key={topic} variant="outline" disabled={!!busy} onClick={() => {setFollowup(null); void run({ mode: 'followup', turns, topic });}}>{topicLabels[topic]}<ArrowUpRight size={15}/></Button>)}</div></section>
      {busy && <div className="working" role="status"><LoaderCircle size={17}/>{busy}</div>}
      {followup && <section className="followup-result" ref={followupPanel} aria-live="polite"><h2>{followup.title}</h2><p>{followup.summary}</p>{followup.steps.map((item, index) => <article key={index}><h3>{item.title}</h3><p>{item.detail}</p></article>)}<h3>下一步确认</h3><ul>{followup.questions.map((item, index) => <li key={index}>{item}</li>)}</ul><button onClick={download}><Download size={15}/>下载报告与这份清单</button></section>}
      <p className="report-note">基于当前回答的初步分析。具体院校要求、费用和截止日期请查官方信息，不代表录取保证。</p>
    </div>}
    {error && <div className="error-box" role="alert"><p>{error}</p><div><Button disabled={!!busy} onClick={() => {if (pending.current) void run(pending.current);}}>重试</Button>{!report && turns.length > 0 && <button className="back" onClick={() => back(turns.length - 1)}>返回上一题</button>}</div></div>}
    <footer>由 DeepSeek 提供 AI 支持 · 回答仅保留在本页，离开前可下载报告</footer>
  </main>;
}


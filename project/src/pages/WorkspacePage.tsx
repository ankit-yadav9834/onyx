import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowRight,
  Brain,
  GitBranch,
  Network,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Cpu,
  DollarSign,
  Clock,
  Target,
  Sparkles,
  AlertTriangle,
  CornerDownRight,
  X,
  Copy,
  Share,
  Download,
  RotateCcw,
  Edit2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  type LucideIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

import type { OrchestratedQuery, PipelineStage } from '@/lib/types';
import { runFullPipeline, STAGE_LABELS, STAGE_ORDER } from '@/lib/orchestrator';
import { MODELS, formatCost, formatLatency } from '@/lib/models';
import { Badge, Bar, ScoreRing, StatusDot } from '@/components/ui';
import { cn, pct } from '@/lib/utils';
import { SAMPLE_QUERY_TEMPLATES } from '@/lib/mockData';

const STAGE_ICONS: Record<PipelineStage, LucideIcon> = {
  intent: Brain,
  planning: Layers,
  routing: GitBranch,
  execution: Cpu,
  collection: Network,
  verification: ShieldCheck,
  consensus: Target,
  synthesis: Sparkles,
};

import type { Message } from '@/lib/storage/models';

const FOLLOW_UPS = [
  "Compare with competitors",
  "Generate a presentation",
  "Summarize",
  "Create a table",
  "Explain simply",
  "Continue research",
];

import { useStorage, useActiveState } from '@/lib/storage';

export function WorkspacePage({
  isTransparencyOpen,
  onCloseTransparency,
}: {
  isTransparencyOpen?: boolean;
  onCloseTransparency?: () => void;
}) {
  const { conversations, querySessions, auditLogs, settings } = useStorage();
  const { activeConversationId, setActiveConversationId, setActiveQuerySessionId } = useActiveState();
  
  // Load conversation if activeConversationId is provided
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [expandedStage, setExpandedStage] = useState<PipelineStage | null>(null);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.get(activeConversationId);
      if (conv) setMessages(conv.messages);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, running]);

  const getGenerationStatus = (stageIdx: number) => {
    const statuses = [
      "Understanding your request...",
      "Planning the best approach...",
      "Consulting multiple AI models...",
      "Consulting multiple AI models...",
      "Verifying evidence...",
      "Verifying evidence...",
      "Building consensus...",
      "Generating response...",
    ];
    return statuses[Math.min(stageIdx, statuses.length - 1)] || "Generating response...";
  };

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || running) return;

    const queryId = Date.now().toString();
    const userMsg: Message = { id: `u-${queryId}`, role: 'user', content: text, createdAt: Date.now() };
    const assistantMsgPlaceholder: Message = {
      id: `a-${queryId}`,
      role: 'assistant',
      content: '',
      status: getGenerationStatus(0),
      isGenerating: true,
      createdAt: Date.now() + 1
    };

    setMessages(prev => {
      const updated = [...prev, userMsg, assistantMsgPlaceholder];
      return updated;
    });
    
    setInput('');
    setRunning(true);

    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      setMessages(prev => prev.map(m =>
        m.id === `a-${queryId}` ? { ...m, status: getGenerationStatus(stage) } : m
      ));

      if (stage >= STAGE_ORDER.length) {
        clearInterval(interval);
        
        // Now call the async pipeline
        const currentSettings = settings.get();
        runFullPipeline(text, currentSettings.model).then(({ orchestrated, session, auditLog }) => {
          
          querySessions.save(session);
          auditLogs.save(auditLog);
          setActiveQuerySessionId(session.id); // BUG FIX: Set active query session
          
          let updatedMessages: Message[] = [];
          setMessages(prev => {
            updatedMessages = prev.map(m => 
              m.id === `a-${queryId}` ? { 
                ...m, 
                status: undefined, 
                isGenerating: false, 
                content: orchestrated.finalAnswer || '', 
                result: orchestrated 
              } : m
            );
            return updatedMessages;
          });
          
          // Persist conversation
          const convId = activeConversationId || `c-${queryId}`;
          const existing = conversations.get(convId);
          conversations.save({
            id: convId,
            title: existing?.title || text.slice(0, 30) + '...',
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            pinned: existing?.pinned || false,
            archived: existing?.archived || false,
            tags: existing?.tags || [],
            messages: updatedMessages,
            lastMessage: orchestrated.finalAnswer?.slice(0, 50) + '...',
          });
          
          if (!activeConversationId) {
            setActiveConversationId(convId);
          }
          
          setRunning(false);
          setExpandedStage('synthesis');
        }).catch((err) => {
          let updatedMessages: Message[] = [];
          setMessages(prev => {
            updatedMessages = prev.map(m => 
              m.id === `a-${queryId}` ? { 
                ...m, 
                status: undefined, 
                isGenerating: false, 
                content: `**Error:** Failed to connect to the OrchestrAI backend.\n\n\`${err.message}\``, 
              } : m
            );
            return updatedMessages;
          });
          
          // Persist conversation even on error
          const convId = activeConversationId || `c-${queryId}`;
          const existing = conversations.get(convId);
          conversations.save({
            id: convId,
            title: existing?.title || text.slice(0, 30) + '...',
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            pinned: existing?.pinned || false,
            archived: existing?.archived || false,
            tags: existing?.tags || [],
            messages: updatedMessages,
          });

          if (!activeConversationId) {
            setActiveConversationId(convId);
          }

          setRunning(false);
        });
      }
    }, 350);
  }, [running, activeConversationId, conversations, querySessions, auditLogs, settings, setActiveConversationId, setActiveQuerySessionId]);

  const latestResult = messages.slice().reverse().find(m => m.role === 'assistant' && m.result)?.result;

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-white">
      {/* Main Conversation Area */}
      <div
        className={cn(
          "flex-1 flex flex-col h-full transition-all duration-300",
          isTransparencyOpen ? "lg:mr-[420px]" : ""
        )}
      >
        {messages.length === 0 ? (
          // Initial Empty State
          <div className="flex h-full w-full items-center justify-center px-6 animate-fade-in">
            <div className="w-full max-w-2xl text-center flex flex-col items-center">
              <div className="mb-12 space-y-4">
                <h2 className="text-3xl font-medium tracking-tight text-ink-900">Ask anything.</h2>
                <div className="flex gap-4 justify-center text-ink-400 font-medium">
                  <span>Research.</span>
                  <span>Code.</span>
                  <span>Analyze.</span>
                  <span>Reason.</span>
                </div>
              </div>

              <div className="relative w-full group shadow-card rounded-2xl border border-line bg-white focus-within:border-ink-300 focus-within:ring-4 focus-within:ring-ink-900/5 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="How can I help you today?"
                  className="w-full resize-none rounded-2xl bg-transparent p-5 pr-14 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none scrollbar-thin"
                  rows={1}
                  style={{ minHeight: '64px' }}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-600 transition-colors">
                    <Paperclip size={16} />
                  </button>
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim()}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white transition-colors hover:bg-ink-800 disabled:opacity-30 disabled:hover:bg-ink-900"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {SAMPLE_QUERY_TEMPLATES.slice(0, 3).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSend(t)}
                    className="rounded-full border border-line bg-white px-4 py-2 text-xs font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 shadow-sm"
                  >
                    {t.length > 50 ? t.slice(0, 50) + '…' : t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Conversation Mode
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-0">
              <div className="mx-auto w-full max-w-3xl py-12 pb-48 space-y-12">
                {messages.map((m) => (
                  <div key={m.id} className="flex flex-col animate-slide-in">
                    {m.role === 'user' ? (
                      <div className="self-end max-w-[85%] rounded-[1.5rem] bg-ink-100 px-5 py-3.5 text-[15px] leading-relaxed text-ink-950">
                        {m.content}
                      </div>
                    ) : (
                      <div className="self-start w-full">
                        {m.isGenerating ? (
                          <div className="flex items-center gap-3 text-ink-500 py-2">
                            <div className="flex h-5 w-5 items-center justify-center">
                              <Loader2 size={16} className="animate-spin text-ink-400" />
                            </div>
                            <span className="text-sm font-medium animate-pulse-soft">{m.status}</span>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-fade-in">
                            <div className="prose prose-base md:prose-lg prose-ink max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex items-center gap-1 pt-2 opacity-60 hover:opacity-100 transition-opacity">
                              {[
                                { icon: Copy, label: 'Copy' },
                                { icon: Edit2, label: 'Edit Prompt' },
                                { icon: RotateCcw, label: 'Regenerate' },
                                { icon: Bookmark, label: 'Bookmark' },
                                { icon: Share, label: 'Share' },
                                { icon: Download, label: 'Export' },
                                { icon: ThumbsUp, label: 'Good Response' },
                                { icon: ThumbsDown, label: 'Bad Response' },
                              ].map((action, i) => (
                                <button
                                  key={i}
                                  title={action.label}
                                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors"
                                >
                                  <action.icon size={14} />
                                </button>
                              ))}
                            </div>

                            {/* Follow up suggestions */}
                            <div className="flex flex-wrap gap-2 pt-6">
                              {FOLLOW_UPS.map(f => (
                                <button
                                  key={f}
                                  onClick={() => handleSend(f)}
                                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 hover:text-ink-900"
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endOfMessagesRef} />
              </div>
            </div>

            {/* Sticky Composer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 md:px-0 pointer-events-none">
              <div className="mx-auto w-full max-w-3xl pointer-events-auto">
                <div className="relative w-full group shadow-card rounded-2xl border border-line bg-white focus-within:border-ink-300 focus-within:ring-4 focus-within:ring-ink-900/5 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(input);
                      }
                    }}
                    placeholder="Message OrchestrAI..."
                    className="w-full resize-none rounded-2xl bg-transparent p-4 pr-14 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none max-h-48 scrollbar-thin"
                    rows={1}
                    style={{ minHeight: '56px' }}
                  />
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-600 transition-colors">
                      <Paperclip size={16} />
                    </button>
                    <button
                      onClick={() => handleSend(input)}
                      disabled={!input.trim() || running}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white transition-colors hover:bg-ink-800 disabled:opacity-30 disabled:hover:bg-ink-900"
                    >
                      {running ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    </button>
                  </div>
                </div>
                <div className="text-center mt-3 text-[11px] text-ink-400">
                  OrchestrAI can make mistakes. Verify critical information.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Drawer (AI Transparency) */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[420px] bg-ink-50 border-l border-line shadow-2xl transform transition-transform duration-300 ease-out z-40 flex flex-col",
          isTransparencyOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-white z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-ink-900" />
            <h2 className="text-sm font-semibold text-ink-900">AI Transparency</h2>
          </div>
          <button
            onClick={onCloseTransparency}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin bg-ink-50">
          {latestResult ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-line shadow-sm">
                <div className="flex items-center gap-4 text-xs font-medium text-ink-600">
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {formatLatency(latestResult.totalLatencyMs ?? 0)}</span>
                  <span className="flex items-center gap-1.5"><DollarSign size={13} /> {formatCost(latestResult.totalCost ?? 0)}</span>
                </div>
                <div className="text-xs font-medium text-ink-900">
                  Total Pipeline
                </div>
              </div>

              <div className="relative border-l-2 border-line ml-3 space-y-6 pb-4">
                {STAGE_ORDER.map((stage) => {
                  const expanded = expandedStage === stage;
                  const Icon = STAGE_ICONS[stage];
                  const label = STAGE_LABELS[stage];
                  return (
                    <div key={stage} className="relative pl-6">
                      <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 border-ink-50 bg-ink-900 flex items-center justify-center text-white">
                        <Icon size={10} />
                      </div>
                      <div className="rounded-xl border border-line bg-white shadow-sm overflow-hidden transition-all duration-200">
                        <button
                          onClick={() => setExpandedStage(expanded ? null : stage)}
                          className="flex w-full items-center justify-between p-3 text-left hover:bg-ink-50/50 transition-colors"
                        >
                          <div>
                            <div className="text-xs font-semibold text-ink-900">{label}</div>
                            <div className="text-2xs text-ink-500 mt-0.5">{getStageSummary(stage, latestResult)}</div>
                          </div>
                          {expanded ? <ChevronDown size={14} className="text-ink-400" /> : <ChevronRight size={14} className="text-ink-400" />}
                        </button>
                        {expanded && (
                          <div className="border-t border-line p-4 bg-white">
                            <StageContent stage={stage} result={latestResult} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-line shadow-sm mb-4">
                <Cpu size={24} className="text-ink-400" />
              </div>
              <h3 className="text-sm font-medium text-ink-900 mb-1">No Active Execution</h3>
              <p className="text-xs text-ink-500 max-w-[240px]">Submit a query to inspect the underlying orchestration pipeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Overlay (mobile only) */}
      {isTransparencyOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink-900/20 z-30"
          onClick={onCloseTransparency}
        />
      )}
    </div>
  );
}

// Helper functions and subcomponents for Transparency Drawer
function getStageSummary(stage: PipelineStage, result: OrchestratedQuery): string {
  switch (stage) {
    case 'intent':
      return result.intent ? `${result.intent.classification} · risk: ${result.intent.risk} · complexity: ${result.intent.complexity}/100` : '';
    case 'planning':
      return result.plan ? `${result.plan.subtasks.length} subtasks · ${formatLatency(result.plan.totalEstimatedLatencyMs)}` : '';
    case 'routing':
      return result.routes ? `${result.routes.length} routes assigned` : '';
    case 'execution':
      return result.results ? `${result.results.length} executions · ${result.results.filter(r => r.status === 'success').length} success` : '';
    case 'collection':
      return result.results ? `${result.results.reduce((a, r) => a + r.citations.length, 0)} citations extracted` : '';
    case 'verification':
      return result.verifications ? `${result.verifications.reduce((a, v) => a + v.checks.length, 0)} checks · avg ${(result.verifications.reduce((a, v) => a + v.overallScore, 0) / result.verifications.length * 100).toFixed(0)}%` : '';
    case 'consensus':
      return result.consensus ? `${result.consensus[0]?.votes.length} models · ${(result.consensus[0]?.agreementScore * 100).toFixed(0)}% agreement` : '';
    case 'synthesis':
      return result.finalAnswer ? 'Trusted answer synthesized' : '';
    default:
      return '';
  }
}

function StageContent({ stage, result }: { stage: PipelineStage; result: OrchestratedQuery }) {
  switch (stage) {
    case 'intent': return <IntentDetail result={result} />;
    case 'planning': return <PlanningDetail result={result} />;
    case 'routing': return <RoutingDetail result={result} />;
    case 'execution': return <ExecutionDetail result={result} />;
    case 'collection': return <CollectionDetail result={result} />;
    case 'verification': return <VerificationDetail result={result} />;
    case 'consensus': return <ConsensusDetail result={result} />;
    case 'synthesis': return <SynthesisDetail result={result} />;
    default: return null;
  }
}

function IntentDetail({ result }: { result: OrchestratedQuery }) {
  const intent = result.intent!;
  const m = MODELS[intent.detectedBy];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Cpu size={13} /> Detected by <span className="mono font-medium text-ink-900">{m.name}</span> in {formatLatency(intent.latencyMs)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Intent Type', value: intent.classification },
          { label: 'Risk Level', value: intent.risk, variant: intent.risk === 'critical' || intent.risk === 'high' ? 'err' : intent.risk === 'medium' ? 'warn' : 'ok' },
          { label: 'Complexity', value: `${intent.complexity}/100` },
          { label: 'Output Format', value: intent.outputFormat },
          { label: 'Requires Tools', value: intent.requiresTools ? 'Yes' : 'No' },
          { label: 'Language', value: intent.language.toUpperCase() },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line p-3 bg-ink-50/50">
            <div className="label">{item.label}</div>
            {item.variant ? (
              <Badge variant={item.variant as 'ok' | 'warn' | 'err'} className="mt-1.5">{item.value}</Badge>
            ) : (
              <div className="mt-1.5 text-sm font-medium text-ink-900">{item.value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanningDetail({ result }: { result: OrchestratedQuery }) {
  const plan = result.plan!;
  const m = MODELS[plan.planner];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Brain size={13} /> Planned by <span className="mono font-medium text-ink-900">{m.name}</span> in {formatLatency(plan.latencyMs)}
      </div>
      <div className="rounded-lg border border-line bg-ink-50 p-3">
        <div className="label mb-3">Execution DAG</div>
        <div className="space-y-2">
          {plan.subtasks.map((s) => (
            <div key={s.id} className="flex items-start gap-2 bg-white p-2 rounded-md border border-line shadow-sm">
              <span className="mono mt-0.5 text-2xs font-semibold text-ink-400">{s.id}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-900 leading-tight">{s.description}</span>
                </div>
                {s.dependencies.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-2xs text-ink-400">
                    <CornerDownRight size={11} /> {s.dependencies.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoutingDetail({ result }: { result: OrchestratedQuery }) {
  const routes = result.routes!;
  return (
    <div className="space-y-2">
      {routes.map((r) => {
        const m = MODELS[r.model];
        return (
          <div key={r.subtaskId} className="rounded-lg border border-line p-3 bg-ink-50/50">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="mono text-2xs font-semibold text-ink-400">{r.subtaskId}</span>
                <Badge>{r.strategy}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-line text-2xs font-semibold text-ink-700">{m.vendor.slice(0, 2)}</span>
                <span className="text-xs font-medium text-ink-900">{m.name}</span>
              </div>
            </div>
            <p className="mt-2 text-2xs text-ink-500">{r.reason}</p>
          </div>
        );
      })}
    </div>
  );
}

function ExecutionDetail({ result }: { result: OrchestratedQuery }) {
  const results = result.results!;
  return (
    <div className="space-y-2">
      {results.map((r) => {
        const m = MODELS[r.model];
        return (
          <div key={r.subtaskId} className="rounded-lg border border-line p-3 bg-ink-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="mono text-2xs font-semibold text-ink-400">{r.subtaskId}</span>
                <span className="text-xs font-medium text-ink-900">{m.name}</span>
              </div>
              <StatusDot status={r.status === 'success' ? 'ok' : 'warn'} />
            </div>
            <div className="mt-2 flex items-center gap-3 text-2xs text-ink-400">
              <span className="flex items-center gap-1"><Clock size={11} /> {formatLatency(r.latencyMs)}</span>
              <span className="flex items-center gap-1"><DollarSign size={11} /> {formatCost(r.cost)}</span>
              <span>{r.citations.length} refs</span>
            </div>
            <div className="mt-2 rounded-md bg-white border border-line p-2">
              <p className="mono text-2xs text-ink-600 line-clamp-2">{r.output}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CollectionDetail({ result }: { result: OrchestratedQuery }) {
  const citations = result.results!.flatMap((r) => r.citations);
  return (
    <div className="space-y-2">
      {citations.map((c) => (
        <div key={c.id} className="rounded-lg border border-line p-3 bg-ink-50/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="mono text-2xs font-medium text-ink-900">{c.source}</span>
            <Badge variant={c.trust > 0.9 ? 'ok' : 'neutral'}>{pct(c.trust)}</Badge>
          </div>
          <p className="text-2xs text-ink-500 leading-snug">{c.snippet}</p>
        </div>
      ))}
    </div>
  );
}

function VerificationDetail({ result }: { result: OrchestratedQuery }) {
  const reports = result.verifications!;
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.subtaskId} className="rounded-lg border border-line p-3 bg-ink-50/50">
          <div className="flex items-center justify-between mb-3">
            <span className="mono text-2xs font-semibold text-ink-400">{report.subtaskId}</span>
            <div className="flex items-center gap-2">
              <ScoreRing value={report.overallScore} size={30} stroke={3} />
            </div>
          </div>
          <div className="grid gap-1.5">
            {report.checks.map((check) => (
              <div key={check.name} className="flex items-center gap-2 rounded-md bg-white border border-line p-2">
                {check.status === 'pass' ? <CheckCircle2 size={13} className="text-emerald-600" /> : check.status === 'warn' ? <AlertTriangle size={13} className="text-amber-500" /> : <AlertTriangle size={13} className="text-red-500" />}
                <span className="flex-1 text-2xs font-medium text-ink-700">{check.name}</span>
                <span className="mono text-2xs tabular-nums text-ink-500">{(check.score * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConsensusDetail({ result }: { result: OrchestratedQuery }) {
  const reports = result.consensus!;
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.subtaskId} className="rounded-lg border border-line p-3 bg-ink-50/50">
          <div className="flex items-center justify-between mb-3">
            <span className="mono text-2xs font-semibold text-ink-400">{report.subtaskId}</span>
            <Badge variant={report.resolution === 'unanimous' ? 'ok' : report.resolution === 'split' ? 'err' : 'neutral'}>
              {report.resolution}
            </Badge>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-2xs text-ink-500">
                <span>Agreement</span>
                <span className="tabular-nums text-ink-900 font-medium">{pct(report.agreementScore)}</span>
              </div>
              <Bar value={report.agreementScore} className="mt-1" color="ok" />
            </div>
            <div className="space-y-1.5 bg-white p-2 rounded-md border border-line">
              {report.votes.map((v) => {
                const m = MODELS[v.model];
                return (
                  <div key={v.model} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-ink-100 text-2xs font-semibold text-ink-600">{m.vendor.slice(0, 2)}</span>
                    <span className="flex-1 text-2xs text-ink-700">{m.name}</span>
                    <span className="text-2xs tabular-nums text-ink-500">{pct(v.confidence)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SynthesisDetail({ result }: { result: OrchestratedQuery }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Sparkles size={13} /> Synthesized by <span className="mono font-medium text-ink-900">Claude Opus 4.5</span>
      </div>
      <div className="grid gap-2 grid-cols-2">
        <div className="rounded-lg border border-line p-3 bg-ink-50/50 text-center">
          <ScoreRing value={result.finalConfidence ?? 0} size={40} label="conf" />
        </div>
        <div className="rounded-lg border border-line p-3 bg-ink-50/50">
          <div className="label">Sources</div>
          <div className="mt-1 text-sm font-semibold text-ink-900">{result.results?.reduce((a, r) => a + r.citations.length, 0)}</div>
        </div>
      </div>
    </div>
  );
}

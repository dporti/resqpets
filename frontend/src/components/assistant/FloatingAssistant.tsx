import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parseActions, executeAction, renderMarkdown, DetectedAction } from '../../lib/assistant/actions';

// ── TYPES ─────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: DetectedAction[];
  loading?: boolean;
}

interface Props {
  onNavigate: (vista: string) => void;
  onClose: () => void;
}

// ── SUGGESTIONS ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: '🐾', text: '¿Qué animales llevan más de 90 días sin movimiento?' },
  { icon: '📧', text: 'Genera un email de seguimiento para el último adoptante' },
  { icon: '📊', text: '¿Cuántas adopciones hemos completado este mes?' },
  { icon: '🏡', text: '¿Qué familias de acogida tienen plaza disponible ahora?' },
  { icon: '🚨', text: 'Resume el estado de los avisos SOS activos' },
  { icon: '✅', text: '¿Qué tareas están vencidas hoy?' },
];

// ── FLOATING BUTTON ───────────────────────────────────────────────────
export function AssistantButton({ onClick, hasUrgent }: { onClick: () => void; hasUrgent?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 900 }}>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 56, right: 0,
          background: '#111827', color: '#fff', fontSize: 12, padding: '5px 10px',
          borderRadius: 8, whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          Asistente IA (Ctrl+K)
        </div>
      )}
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Abrir asistente IA"
        style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg,#16a34a,#059669)',
          border: 'none', cursor: 'pointer', fontSize: 22,
          boxShadow: '0 4px 16px rgba(22,163,74,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .15s, box-shadow .15s',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          position: 'relative',
        }}
      >
        ✨
        {hasUrgent && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 10, height: 10, borderRadius: '50%',
            background: '#ef4444', border: '2px solid #fff',
          }} />
        )}
      </button>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export function FloatingAssistant({ onNavigate, onClose }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus input on mount
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const query = text.trim();
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: new Date(), loading: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    // Prepare history (exclude the new assistant message)
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const token = localStorage.getItem('resqpet_token');

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history, query }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Error del servidor');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id
                  ? { ...m, content: fullText, loading: false }
                  : m,
              ));
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch { /* ignore parse errors */ }
        }
      }

      // Parse actions from final text
      const { clean, actions } = parseActions(fullText);
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: clean, loading: false, actions: actions.length ? actions : undefined }
          : m,
      ));

    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return;
      const errMsg = e instanceof Error ? e.message : 'Error desconocido';
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: `⚠️ ${errMsg}. Inténtalo de nuevo.`, loading: false }
          : m,
      ));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleAction = async (action: DetectedAction, msgId: string) => {
    const result = await executeAction(action, onNavigate);
    setMessages(prev => prev.map(m =>
      m.id === msgId
        ? { ...m, actions: m.actions?.filter(a => a !== action) }
        : m,
    ));
    const confirmMsg: Message = {
      id: Date.now().toString(), role: 'assistant',
      content: result, timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  const initials = user?.nombre?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <>
      {/* Overlay */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Asistente IA ResQPet"
        aria-modal="true"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 640, maxWidth: 'calc(100vw - 32px)',
          maxHeight: '75vh',
          background: '#fff', borderRadius: 18,
          boxShadow: '0 24px 80px rgba(0,0,0,.25)',
          zIndex: 1001, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#16a34a,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
              Asistente ResQPet
              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>IA</span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {streaming ? '🟢 Escribiendo...' : `Claude · ${user?.refugioNombre || 'ResQPet'}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} style={{
                padding: '4px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8,
                background: '#fff', cursor: 'pointer', fontSize: 11, color: '#6b7280',
              }}>
                Nueva conversación
              </button>
            )}
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: '#f3f4f6', cursor: 'pointer', fontSize: 18, color: '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {messages.length === 0 ? (
            /* Suggestions */
            <div>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px', textAlign: 'center' }}>
                👋 Hola, {user?.nombre?.split(' ')[0] || 'coordinador'}. ¿En qué puedo ayudarte?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s.text} onClick={() => sendMessage(s.text)} style={{
                    padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10,
                    background: '#fafafa', cursor: 'pointer', textAlign: 'left',
                    fontSize: 12, color: '#374151', lineHeight: 1.4,
                    transition: 'border-color .15s, background .15s',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#16a34a'; (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.background = '#fafafa'; }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? '#dcfce7' : 'linear-gradient(135deg,#16a34a,#059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: msg.role === 'user' ? 12 : 16,
                  fontWeight: 700, color: msg.role === 'user' ? '#16a34a' : '#fff',
                }}>
                  {msg.role === 'user' ? initials : '✨'}
                </div>

                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Bubble */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg,#16a34a,#059669)' : '#fff',
                    border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                    color: msg.role === 'user' ? '#fff' : '#111827',
                    fontSize: 13, lineHeight: 1.6,
                    boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,.06)' : 'none',
                  }}>
                    {msg.loading ? (
                      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} style={{
                            width: 6, height: 6, borderRadius: '50%', background: '#9ca3af',
                            animation: `dotPulse 1.4s ${i * 0.2}s infinite`,
                          }} />
                        ))}
                      </span>
                    ) : msg.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {msg.actions.map((action, i) => (
                        <div key={i} style={{
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          borderRadius: 10, padding: '10px 14px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        }}>
                          <span style={{ fontSize: 13, color: '#374151' }}>
                            <span style={{ marginRight: 6 }}>{action.icon}</span>
                            {action.label}
                          </span>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => handleAction(action, msg.id)} style={{
                              padding: '5px 14px', background: '#16a34a', color: '#fff',
                              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}>Ejecutar</button>
                            <button onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actions: m.actions?.filter((_, j) => j !== i) } : m))} style={{
                              padding: '5px 10px', background: '#fff', color: '#6b7280',
                              border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                            }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <span style={{ fontSize: 10, color: '#9ca3af', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', paddingInline: 4 }}>
                    {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', flexShrink: 0, background: '#fff' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta algo sobre tu protectora... (Enter para enviar)"
              rows={1}
              disabled={streaming}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1.5px solid #e5e7eb', fontSize: 13, resize: 'none',
                fontFamily: 'inherit', outline: 'none', lineHeight: 1.5,
                minHeight: 42, maxHeight: 100, overflowY: 'auto',
                background: streaming ? '#f9fafb' : '#fff',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: input.trim() && !streaming ? 'linear-gradient(135deg,#16a34a,#059669)' : '#e5e7eb',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background .15s',
              }}
              aria-label="Enviar mensaje"
            >
              {streaming ? '⏸' : '➤'}
            </button>
          </div>
          <p style={{ fontSize: 10, color: '#d1d5db', margin: '6px 0 0', textAlign: 'center' }}>
            IA generativa — puede cometer errores · Ctrl+K para abrir/cerrar
          </p>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: .2; transform: scale(.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

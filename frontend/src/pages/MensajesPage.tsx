import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ErrorState, SkeletonList } from '../components/ui';

// ── TYPES ─────────────────────────────────────────────────────────────
interface Participant { id: number; nombre: string; avatar_url?: string; rol?: string }
interface Conversation {
  id: number; type: 'internal' | 'adoptant' | 'foster'; name?: string;
  contact_name?: string; contact_email?: string; last_message?: string;
  last_message_type?: string; last_message_at?: string; unread_count?: number;
  other_participants?: Participant[]; animal_nombre?: string;
}
interface Message {
  id: number; conversation_id: number; sender_id?: number; sender_name?: string;
  sender_nombre?: string; sender_avatar?: string; content?: string;
  message_type: string; file_url?: string; file_name?: string; created_at: string;
}
interface CRMUser { id: number; nombre: string; rol: string; avatar_url?: string }

// ── HELPERS ───────────────────────────────────────────────────────────
const EMOJIS = ['👍','❤️','😊','🎉','😢','🐾','✅','⚠️','📅','🏠','💊','📞'];
function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function relativeTime(dt?: string) {
  if (!dt) return '';
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Ayer';
  if (d < 7) return new Date(dt).toLocaleDateString('es-ES', { weekday: 'short' });
  return new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function dateLabel(dt: string) {
  const d = new Date(dt);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yday = new Date(today); yday.setDate(yday.getDate() - 1);
  if (d >= today) return 'Hoy';
  if (d >= yday) return 'Ayer';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
function convName(c: Conversation, myId: number): string {
  if (c.name) return c.name;
  if (c.contact_name) return c.contact_name;
  const other = c.other_participants?.find(p => p.id !== myId) || c.other_participants?.[0];
  return other?.nombre || 'Conversación';
}
const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  internal: { label: 'Interno', color: '#8b5cf6' },
  adoptant: { label: 'Adoptante', color: '#16a34a' },
  foster:   { label: 'Acogida', color: '#f97316' },
};

// ── AVATAR ────────────────────────────────────────────────────────────
function Avatar({ name, url, size = 36 }: { name?: string; url?: string; size?: number }) {
  const colors = ['#16a34a','#3b82f6','#f97316','#8b5cf6','#ef4444','#0d9488'];
  const color = colors[(name || '?').charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: url ? '#f3f4f6' : color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      overflow: 'hidden',
    }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
    </div>
  );
}

// ── NEW CONVERSATION MODAL ────────────────────────────────────────────
function NewConvModal({ onClose, onCreated, users }: {
  onClose: () => void;
  onCreated: (id: number) => void;
  users: CRMUser[];
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'internal' | 'adoptant' | 'foster' | 'group'>('internal');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [firstMsg, setFirstMsg] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredUsers = users.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { first_message: firstMsg || undefined };
      if (type === 'internal') {
        payload.type = 'internal';
        payload.participant_ids = selectedUsers;
      } else if (type === 'group') {
        payload.type = 'internal';
        payload.name = groupName;
        payload.participant_ids = selectedUsers;
      } else {
        payload.type = type;
        payload.contact_name = contactName;
        payload.contact_email = contactEmail;
      }
      const r = await api.post<{ id: number }>('/mensajes/conversations', payload);
      onCreated(r.id);
    } finally {
      setLoading(false);
    }
  };

  const canNext = step === 1 ? true :
    step === 2 ? (type === 'internal' ? selectedUsers.length > 0 :
      type === 'group' ? selectedUsers.length > 1 :
      contactName.length > 0) : true;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 50px rgba(0,0,0,.25)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nueva conversación</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { v: 'internal', label: '👤 Conversación interna', desc: 'Con un voluntario o coordinador' },
                { v: 'group',    label: '👥 Grupo interno',       desc: 'Múltiples miembros del equipo' },
                { v: 'adoptant', label: '🏠 Adoptante',           desc: 'Vinculada a una solicitud' },
                { v: 'foster',   label: '❤️ Familia de acogida',  desc: 'Vinculada a una acogida' },
              ] as const).map(o => (
                <button key={o.v} onClick={() => setType(o.v)} style={{
                  padding: '12px 16px', borderRadius: 10, border: '2px solid',
                  borderColor: type === o.v ? '#16a34a' : '#e5e7eb',
                  background: type === o.v ? '#f0fdf4' : '#fff',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: type === o.v ? '#16a34a' : '#111827' }}>{o.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{o.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (type === 'internal' || type === 'group') && (
            <div>
              {type === 'group' && (
                <input value={groupName} onChange={e => setGroupName(e.target.value)}
                  placeholder="Nombre del grupo..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
                />
              )}
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar usuarios..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredUsers.map(u => {
                  const sel = selectedUsers.includes(u.id);
                  return (
                    <button key={u.id} onClick={() => setSelectedUsers(prev =>
                      type === 'internal' ? [u.id] : sel ? prev.filter(id => id !== u.id) : [...prev, u.id],
                    )} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                      border: '1.5px solid', borderColor: sel ? '#16a34a' : '#e5e7eb',
                      background: sel ? '#f0fdf4' : '#fff', borderRadius: 8, cursor: 'pointer',
                    }}>
                      <Avatar name={u.nombre} url={u.avatar_url} size={32} />
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{u.nombre}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{u.rol}</p>
                      </div>
                      {sel && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (type === 'adoptant' || type === 'foster') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nombre *</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                  placeholder={type === 'adoptant' ? 'Nombre del adoptante' : 'Nombre de la familia'} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Email</label>
                <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} type="email"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                  placeholder="email@ejemplo.com" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                Mensaje inicial (opcional)
              </label>
              <textarea value={firstMsg} onChange={e => setFirstMsg(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', minHeight: 90, boxSizing: 'border-box', fontFamily: 'inherit' }}
                placeholder="Escribe el primer mensaje..." />
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>← Atrás</button>}
          {step < 3
            ? <button disabled={!canNext} onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: canNext ? '#16a34a' : '#d1d5db', color: '#fff', cursor: canNext ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600 }}>Siguiente →</button>
            : <button disabled={loading} onClick={handleCreate} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                {loading ? 'Creando...' : 'Crear conversación'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────
export default function MensajesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [crmUsers, setCrmUsers] = useState<CRMUser[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [errorConvs, setErrorConvs] = useState(false);
  const [errorMsgs, setErrorMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const activeConv = conversations.find(c => c.id === activeId);

  // Load conversations
  const loadConvs = useCallback(async () => {
    setErrorConvs(false);
    try {
      const qs = filter !== 'all' && filter !== 'unread' ? `?type=${filter}` : filter === 'unread' ? '?type=unread' : '';
      const data = await api.get<Conversation[]>(`/mensajes/conversations${qs}`);
      setConversations(data);
    } catch (e) { console.error(e); setErrorConvs(true); }
    setLoadingConvs(false);
  }, [filter]);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  // Load messages for active conversation + poll every 3s
  const loadMessages = useCallback(async (id: number) => {
    setErrorMsgs(false);
    try {
      const data = await api.get<Message[]>(`/mensajes/conversations/${id}/messages`);
      setMessages(data);
    } catch (e) { console.error(e); setErrorMsgs(true); }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    loadMessages(activeId).then(() => setLoadingMsgs(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadMessages(activeId);
      loadConvs();
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeId, loadMessages, loadConvs]);

  useEffect(() => {
    api.get<CRMUser[]>('/mensajes/users').then(setCrmUsers).catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMsgInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeId) return;
    const content = msgInput.trim();
    setMsgInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      const msg = await api.post<Message>(`/mensajes/conversations/${activeId}/messages`, { content });
      setMessages(prev => [...prev, msg]);
      loadConvs();
    } catch { /* ignore */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, m) => {
    const label = dateLabel(m.created_at);
    const last = acc[acc.length - 1];
    if (last && last.date === label) { last.msgs.push(m); }
    else { acc.push({ date: label, msgs: [m] }); }
    return acc;
  }, []);

  const totalUnread = conversations.reduce((s, c) => s + (Number(c.unread_count) || 0), 0);
  const filteredConvs = conversations.filter(c => {
    if (!search) return true;
    const name = convName(c, user?.id || 0).toLowerCase();
    return name.includes(search.toLowerCase()) || (c.last_message || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', height: '100vh', background: '#fff', overflow: 'hidden' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{
        width: 300, flexShrink: 0, borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', background: '#fff',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              Mensajes {totalUnread > 0 && <span style={{ background: '#16a34a', color: '#fff', fontSize: 11, padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>{totalUnread}</span>}
            </h2>
            <button onClick={() => setShowNewModal(true)} style={{
              padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>+ Nuevo</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversaciones..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}
          />
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'internal', label: 'Internos' },
              { id: 'adoptant', label: 'Adoptantes' },
              { id: 'foster', label: 'Acogidas' },
              { id: 'unread', label: `No leídos${totalUnread > 0 ? ` (${totalUnread})` : ''}` },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11.5, fontWeight: filter === f.id ? 700 : 400,
                color: filter === f.id ? '#16a34a' : '#6b7280',
                borderBottom: filter === f.id ? '2px solid #16a34a' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? <SkeletonList rows={6} /> : errorConvs ? <ErrorState onRetry={loadConvs} /> : <>
          {filteredConvs.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: 32 }}>💬</p>
              <p style={{ fontSize: 13 }}>Sin conversaciones</p>
            </div>
          )}
          {filteredConvs.map(c => {
            const name = convName(c, user?.id || 0);
            const isActive = c.id === activeId;
            const unread = Number(c.unread_count) || 0;
            const badge = TYPE_BADGE[c.type];
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', background: isActive ? '#f0fdf4' : '#fff',
                border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                textAlign: 'left', transition: 'background .1s',
              }}>
                <Avatar name={name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{name}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{relativeTime(c.last_message_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                      {c.last_message || 'Sin mensajes'}
                    </span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ background: badge.color + '20', color: badge.color, fontSize: 9, padding: '1px 5px', borderRadius: 8, fontWeight: 600 }}>{badge.label}</span>
                      {unread > 0 && <span style={{ background: '#16a34a', color: '#fff', fontSize: 10, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread > 9 ? '9+' : unread}</span>}
                    </div>
                  </div>
                  {c.animal_nombre && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 500 }}>🐾 {c.animal_nombre}</span>}
                </div>
              </button>
            );
          })}
          </>}
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f9fafb' }}>
        {!activeConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 12 }}>
            <span style={{ fontSize: 64 }}>💬</span>
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Selecciona una conversación</p>
            <p style={{ fontSize: 14, margin: 0 }}>o inicia una nueva con el botón de arriba</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Avatar name={convName(activeConv, user?.id || 0)} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>
                  {convName(activeConv, user?.id || 0)}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                  {TYPE_BADGE[activeConv.type]?.label}
                  {activeConv.contact_email && ` — ${activeConv.contact_email}`}
                </p>
              </div>
              {activeConv.animal_nombre && (
                <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  🐾 {activeConv.animal_nombre}
                </span>
              )}
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {loadingMsgs && <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: 13 }}>Cargando mensajes...</p>}
              {errorMsgs && <ErrorState onRetry={() => activeId && loadMessages(activeId)} />}
              {!errorMsgs && groupedMessages.map(group => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div style={{ textAlign: 'center', margin: '12px 0' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '3px 12px', borderRadius: 20 }}>
                      {group.date}
                    </span>
                  </div>
                  {group.msgs.map((m, idx) => {
                    const isMine = m.sender_id === user?.id;
                    const showAvatar = !isMine && (idx === 0 || group.msgs[idx - 1]?.sender_id !== m.sender_id);
                    const senderName = m.sender_nombre || m.sender_name || 'Externo';
                    return (
                      <div key={m.id} style={{
                        display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
                        marginBottom: 4, gap: 8, alignItems: 'flex-end',
                      }}>
                        {!isMine && (
                          <div style={{ width: 28, flexShrink: 0 }}>
                            {showAvatar && <Avatar name={senderName} url={m.sender_avatar} size={28} />}
                          </div>
                        )}
                        <div style={{ maxWidth: '68%' }}>
                          {!isMine && showAvatar && (
                            <p style={{ margin: '0 0 2px 2px', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{senderName}</p>
                          )}
                          <div style={{
                            padding: m.message_type === 'text' ? '9px 13px' : '8px 10px',
                            borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: isMine ? '#dcfce7' : '#fff',
                            border: isMine ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                            fontSize: 14, color: '#111827', lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}>
                            {m.message_type === 'file' && m.file_url ? (
                              <a href={m.file_url} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
                                📎 {m.file_name || 'Archivo adjunto'}
                              </a>
                            ) : m.message_type === 'image' && m.file_url ? (
                              <img src={m.file_url} alt="imagen" style={{ maxWidth: 200, borderRadius: 8, display: 'block' }} />
                            ) : (
                              m.content
                            )}
                          </div>
                          <p style={{ margin: '2px 4px 8px', fontSize: 10, color: '#9ca3af', textAlign: isMine ? 'right' : 'left' }}>
                            {new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            {isMine && ' ✓✓'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{
              padding: '12px 16px', background: '#fff', borderTop: '1px solid #e5e7eb',
              display: 'flex', gap: 10, alignItems: 'flex-end',
            }}>
              <button onClick={() => setShowEmoji(!showEmoji)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '0 4px', color: '#9ca3af',
                flexShrink: 0, alignSelf: 'flex-end', marginBottom: 4,
              }}>😊</button>
              <div style={{ flex: 1, position: 'relative' }}>
                {showEmoji && (
                  <div style={{
                    position: 'absolute', bottom: '110%', left: 0, background: '#fff',
                    border: '1px solid #e5e7eb', borderRadius: 12, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 4,
                    boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10, width: 220,
                  }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => { setMsgInput(prev => prev + e); setShowEmoji(false); }} style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 2, borderRadius: 4,
                      }}>{e}</button>
                    ))}
                  </div>
                )}
                <textarea ref={textareaRef} value={msgInput}
                  onChange={handleInputChange} onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para salto de línea)"
                  rows={1}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 12,
                    border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'none',
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                    lineHeight: 1.5, minHeight: 42, maxHeight: 120, overflowY: 'auto',
                  }}
                />
              </div>
              <button onClick={sendMessage} disabled={!msgInput.trim()} style={{
                width: 42, height: 42, borderRadius: '50%',
                background: msgInput.trim() ? '#16a34a' : '#e5e7eb',
                border: 'none', cursor: msgInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0, transition: 'background .15s',
              }}>➤</button>
            </div>
          </>
        )}
      </div>

      {showNewModal && (
        <NewConvModal users={crmUsers} onClose={() => setShowNewModal(false)}
          onCreated={id => { setShowNewModal(false); loadConvs(); setActiveId(id); }}
        />
      )}
    </div>
  );
}

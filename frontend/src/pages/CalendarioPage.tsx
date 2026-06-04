import { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { EventDropArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// ── TYPES ─────────────────────────────────────────────────────────────
interface CalEvent {
  id: number; title: string; event_type: string; color?: string;
  start_at: string; end_at?: string; all_day: boolean;
  location?: string; description?: string;
  animal_id?: number; animal_nombre?: string; animal_foto?: string;
  assigned_to?: number[]; assignees_info?: { id: number; nombre: string }[];
  reminder_minutes?: number; is_recurring?: boolean;
  recurrence_rule?: string; recurrence_end_date?: string;
  auto_generated?: boolean; created_by?: number; creator_nombre?: string;
  backgroundColor?: string; borderColor?: string;
}
interface CRMUser { id: number; nombre: string; avatar_url?: string }
interface Animal { id: number; nombre: string; especie: string; foto_principal?: string }

// ── CONFIG ────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { id: 'adoption',   label: '🟢 Adopción',   color: '#16a34a' },
  { id: 'veterinary', label: '🔵 Veterinario', color: '#3b82f6' },
  { id: 'foster',     label: '🟠 Acogida',     color: '#f97316' },
  { id: 'volunteer',  label: '🟣 Voluntarios', color: '#8b5cf6' },
  { id: 'urgent',     label: '🔴 Urgente',     color: '#ef4444' },
  { id: 'campaign',   label: '🟡 Campaña',     color: '#f59e0b' },
];

function typeColor(t: string) {
  return EVENT_TYPES.find(e => e.id === t)?.color || '#6b7280';
}

function formatDT(dt?: string) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── EVENT MODAL ───────────────────────────────────────────────────────
function EventModal({ event, defaultStart, defaultEnd, users, animals, onClose, onSave, onDelete }: {
  event?: CalEvent; defaultStart?: string; defaultEnd?: string;
  users: CRMUser[]; animals: Animal[];
  onClose: () => void;
  onSave: (data: Partial<CalEvent>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [title, setTitle] = useState(event?.title || '');
  const [type, setType] = useState(event?.event_type || 'other');
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [startAt, setStartAt] = useState(event?.start_at?.slice(0, 16) || defaultStart || '');
  const [endAt, setEndAt] = useState(event?.end_at?.slice(0, 16) || defaultEnd || '');
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');
  const [animalId, setAnimalId] = useState<number | ''>(event?.animal_id || '');
  const [assignedTo, setAssignedTo] = useState<number[]>(event?.assigned_to || []);
  const [reminder, setReminder] = useState<number | ''>(event?.reminder_minutes || '');
  const [isRecurring, setIsRecurring] = useState(event?.is_recurring || false);
  const [recRule, setRecRule] = useState(event?.recurrence_rule || 'weekly');
  const [loading, setLoading] = useState(false);

  const toggleAssignee = (id: number) =>
    setAssignedTo(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!title || !startAt) return;
    setLoading(true);
    try {
      await onSave({
        title, event_type: type, all_day: allDay,
        start_at: allDay ? startAt.slice(0, 10) : startAt,
        end_at: endAt ? (allDay ? endAt.slice(0, 10) : endAt) : undefined,
        location: location || undefined, description: description || undefined,
        animal_id: animalId || undefined, assigned_to: assignedTo.length ? assignedTo : undefined,
        reminder_minutes: reminder || undefined,
        is_recurring: isRecurring, recurrence_rule: isRecurring ? recRule : undefined,
      });
    } finally { setLoading(false); }
  };

  const isAutoGen = event?.auto_generated;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: typeColor(type) }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{event ? 'Editar evento' : 'Nuevo evento'}</h3>
            {isAutoGen && <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20 }}>Auto-generado</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Título */}
          <div>
            <label style={lbl}>Título *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} disabled={!!isAutoGen}
              style={inp} placeholder="Nombre del evento" />
          </div>

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EVENT_TYPES.map(t => (
                <button key={t.id} onClick={() => !isAutoGen && setType(t.id)} style={{
                  padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                  borderColor: type === t.id ? t.color : '#e5e7eb',
                  background: type === t.id ? t.color + '15' : '#fff',
                  color: type === t.id ? t.color : '#374151',
                  cursor: isAutoGen ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: type === t.id ? 700 : 400,
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Todo el día + fechas */}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ accentColor: '#16a34a' }} />
            Todo el día
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Inicio *</label>
              <input type={allDay ? 'date' : 'datetime-local'} value={startAt} onChange={e => setStartAt(e.target.value)}
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Fin</label>
              <input type={allDay ? 'date' : 'datetime-local'} value={endAt} onChange={e => setEndAt(e.target.value)}
                style={inp} />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label style={lbl}>Ubicación</label>
            <input value={location} onChange={e => setLocation(e.target.value)} style={inp} placeholder="Dirección o lugar" />
          </div>

          {/* Animal relacionado */}
          <div>
            <label style={lbl}>Animal relacionado</label>
            <select value={animalId} onChange={e => setAnimalId(Number(e.target.value) || '')} style={{ ...inp, background: '#fff' }}>
              <option value="">Sin animal específico</option>
              {animals.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.especie})</option>)}
            </select>
          </div>

          {/* Asignados */}
          <div>
            <label style={lbl}>Asignar a</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {users.map(u => {
                const sel = assignedTo.includes(u.id);
                return (
                  <button key={u.id} onClick={() => toggleAssignee(u.id)} style={{
                    padding: '4px 12px', borderRadius: 20, border: '1.5px solid',
                    borderColor: sel ? '#16a34a' : '#e5e7eb', background: sel ? '#f0fdf4' : '#fff',
                    color: sel ? '#16a34a' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: sel ? 700 : 400,
                  }}>
                    {sel ? '✓ ' : ''}{u.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recordatorio */}
          <div>
            <label style={lbl}>Recordatorio</label>
            <select value={reminder} onChange={e => setReminder(Number(e.target.value) || '')} style={{ ...inp, background: '#fff' }}>
              <option value="">Sin recordatorio</option>
              <option value="15">15 minutos antes</option>
              <option value="60">1 hora antes</option>
              <option value="1440">1 día antes</option>
              <option value="10080">1 semana antes</option>
            </select>
          </div>

          {/* Recurrencia */}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} style={{ accentColor: '#16a34a' }} />
            Es un evento recurrente
          </label>
          {isRecurring && (
            <select value={recRule} onChange={e => setRecRule(e.target.value)} style={{ ...inp, background: '#fff' }}>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensualmente</option>
            </select>
          )}

          {/* Descripción */}
          <div>
            <label style={lbl}>Descripción / Notas</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              style={{ ...inp, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }}
              placeholder="Detalles adicionales..." />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          {onDelete && !isAutoGen && (
            <button onClick={onDelete} style={{
              padding: '10px 16px', background: '#fef2f2', color: '#ef4444',
              border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>🗑️ Eliminar</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: '10px 18px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          {!isAutoGen && (
            <button onClick={handleSave} disabled={loading || !title || !startAt} style={{
              padding: '10px 20px', background: (!title || !startAt) ? '#d1d5db' : '#16a34a', color: '#fff',
              border: 'none', borderRadius: 8, cursor: (!title || !startAt) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700,
            }}>
              {loading ? 'Guardando...' : event ? 'Guardar cambios' : 'Crear evento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 };
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' };

// ── MAIN PAGE ─────────────────────────────────────────────────────────
export default function CalendarioPage() {
  const { user } = useAuth();
  const calRef = useRef<InstanceType<typeof FullCalendar>>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalEvent[]>([]);
  const [view, setView] = useState('dayGridMonth');
  const [activeTypes, setActiveTypes] = useState<Record<string, boolean>>(
    () => Object.fromEntries(EVENT_TYPES.map(t => [t.id, true])),
  );
  const [mineOnly, setMineOnly] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; event?: CalEvent; start?: string; end?: string }>({ open: false });
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (mineOnly) qs.set('mine', 'true');
      const data = await api.get<CalEvent[]>(`/calendario/events?${qs}`);
      setEvents(data);
      setLoading(false);
    } catch { setLoading(false); }
  }, [mineOnly]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    api.get<CRMUser[]>('/mensajes/users').then(setUsers).catch(() => {});
    api.get<{ data: Animal[] }>('/animales?limit=100').then(r => setAnimals(r.data || [])).catch(() => {});
    api.get<CalEvent[]>('/calendario/events/upcoming').then(setUpcoming).catch(() => {});
  }, []);

  const filteredEvents: EventInput[] = events
    .filter(e => activeTypes[e.event_type] !== false)
    .map(e => ({
      id: String(e.id),
      title: e.title,
      start: e.start_at,
      end: e.end_at || undefined,
      allDay: e.all_day,
      backgroundColor: e.backgroundColor || typeColor(e.event_type),
      borderColor: e.borderColor || typeColor(e.event_type),
      textColor: '#fff',
      extendedProps: e,
    }));

  const handleEventClick = (info: EventClickArg) => {
    setModal({ open: true, event: info.event.extendedProps as CalEvent });
  };

  const handleDateSelect = (info: DateSelectArg) => {
    setModal({ open: true, start: info.startStr, end: info.endStr });
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const { event } = info;
    try {
      await api.post(`/calendario/events/${event.id}`, {
        start_at: event.startStr,
        end_at: event.endStr || undefined,
        all_day: event.allDay,
      });
      loadEvents();
    } catch {
      info.revert();
    }
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    try {
      await api.post(`/calendario/events/${info.event.id}`, {
        end_at: info.event.endStr,
      });
    } catch { info.revert(); }
  };

  const handleSave = async (data: Partial<CalEvent>) => {
    const ev = modal.event;
    if (ev?.id) {
      await api.post(`/calendario/events/${ev.id}`, data);
    } else {
      await api.post('/calendario/events', data);
    }
    setModal({ open: false });
    loadEvents();
    api.get<CalEvent[]>('/calendario/events/upcoming').then(setUpcoming).catch(() => {});
  };

  const handleDelete = async () => {
    if (!modal.event?.id) return;
    if (!confirm('¿Eliminar este evento?')) return;
    await api.post(`/calendario/events/${modal.event.id}/delete`, {}).catch(() =>
      api.get(`/calendario/events/${modal.event!.id}`), // fallback
    );
    // Use the proper delete endpoint
    await fetch(`/api/calendario/events/${modal.event.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('resqpet_token')}` },
    });
    setModal({ open: false });
    loadEvents();
  };

  const changeView = (v: string) => {
    setView(v);
    calRef.current?.getApi().changeView(v);
  };

  const toggleType = (id: string) =>
    setActiveTypes(prev => ({ ...prev, [id]: !prev[id] }));

  const VIEW_OPTIONS = [
    { id: 'dayGridMonth', label: 'Mes' },
    { id: 'timeGridWeek', label: 'Semana' },
    { id: 'timeGridDay',  label: 'Día' },
    { id: 'listWeek',     label: 'Agenda' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#fafafa', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button onClick={() => setModal({ open: true })} style={{
          width: '100%', padding: '10px', background: '#16a34a', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
        }}>
          + Nuevo evento
        </button>

        {/* Filtros de tipo */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>Tipos de evento</p>
          {EVENT_TYPES.map(t => (
            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}>
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                background: activeTypes[t.id] ? t.color : '#e5e7eb',
                border: `2px solid ${t.color}`, flexShrink: 0, cursor: 'pointer',
              }} onClick={() => toggleType(t.id)} />
              <span style={{ color: activeTypes[t.id] ? '#111827' : '#9ca3af' }}>{t.label}</span>
            </label>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', fontSize: 12 }}>
            <input type="checkbox" checked={mineOnly} onChange={e => setMineOnly(e.target.checked)} style={{ accentColor: '#16a34a' }} />
            Solo mis eventos
          </label>
        </div>

        {/* Próximos eventos */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>Próximos 7 días</p>
          {upcoming.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af' }}>Sin eventos próximos</p>}
          {upcoming.map(e => (
            <div key={e.id} onClick={() => setModal({ open: true, event: e })} style={{
              padding: '8px 10px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
              borderLeft: `3px solid ${typeColor(e.event_type)}`,
              background: '#fff', border: `1px solid #e5e7eb`,
              borderLeftColor: typeColor(e.event_type), borderLeftWidth: 3,
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{e.title}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                {new Date(e.start_at).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                {!e.all_day && ` · ${new Date(e.start_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
              {e.animal_nombre && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#16a34a' }}>🐾 {e.animal_nombre}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CALENDAR AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{
          padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          {/* Nav */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => calRef.current?.getApi().prev()} style={navBtn}>‹</button>
            <button onClick={() => calRef.current?.getApi().today()} style={{ ...navBtn, padding: '6px 14px' }}>Hoy</button>
            <button onClick={() => calRef.current?.getApi().next()} style={navBtn}>›</button>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', flex: 1 }} id="cal-title" />
          {/* Views */}
          <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', padding: 3, borderRadius: 8 }}>
            {VIEW_OPTIONS.map(v => (
              <button key={v.id} onClick={() => changeView(v.id)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                background: view === v.id ? '#fff' : 'transparent',
                color: view === v.id ? '#16a34a' : '#6b7280',
                fontWeight: view === v.id ? 700 : 400,
                boxShadow: view === v.id ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              }}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* FullCalendar */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 4px 4px' }}>
          <style>{`
            .fc { font-family: 'Inter', sans-serif; height: 100%; }
            .fc-toolbar-title { font-size: 16px; font-weight: 700; }
            .fc-button { display: none !important; }
            .fc-event { cursor: pointer; font-size: 12px; border-radius: 5px; padding: 1px 4px; }
            .fc-daygrid-event { border-radius: 5px; }
            .fc-timegrid-event { border-radius: 5px; }
            .fc-list-event:hover td { background: #f0fdf4 !important; }
            .fc-col-header-cell { background: #f9fafb; font-weight: 600; }
            .fc-day-today { background: #f0fdf4 !important; }
            .fc-timegrid-now-indicator-line { border-color: #ef4444; }
            @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
          `}</style>
          {loading ? (
            <div style={{ padding: 24 }}>
              <div style={{ height: 500, background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 12 }} />
            </div>
          ) : (
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={view}
              events={filteredEvents}
              locale="es"
              height="calc(100vh - 56px)"
              headerToolbar={{ left: '', center: 'title', right: '' }}
              editable={user?.rol !== 'voluntario'}
              selectable
              selectMirror
              dayMaxEvents={4}
              nowIndicator
              eventClick={handleEventClick}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Agenda' }}
              allDayText="Todo el día"
              moreLinkText={n => `+${n} más`}
              noEventsText="Sin eventos"
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
              slotMinTime="07:00:00"
              slotMaxTime="22:00:00"
              firstDay={1}
              weekText="S"
            />
          )}
        </div>
      </div>

      {modal.open && (
        <EventModal
          event={modal.event}
          defaultStart={modal.start}
          defaultEnd={modal.end}
          users={users}
          animals={animals}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
          onDelete={modal.event ? handleDelete : undefined}
        />
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  padding: '6px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb',
  borderRadius: 7, cursor: 'pointer', fontSize: 16, color: '#374151',
};

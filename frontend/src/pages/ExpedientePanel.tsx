import { useState, useEffect } from 'react';
import { AdoptionExpedient, ChecklistItem } from '../types';
import { api } from '../api/client';
import { Spinner, ErrorState, formatDate, formatDateTime } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface Props {
  expedienteId: number;
  onClose: () => void;
  onCerrado: () => void;
}

const CHECKLIST_DEF: Record<number, { key: string; label: string; hasFile?: boolean }[]> = {
  1: [
    { key: 'contrato_firmado', label: 'Contrato de adopción firmado', hasFile: true },
    { key: 'dni_recibido', label: 'DNI del adoptante recibido' },
    { key: 'cuota_pagada', label: 'Pago de cuota de adopción confirmado' },
  ],
  2: [
    { key: 'visita_hogar', label: 'Visita al hogar realizada' },
    { key: 'entrega_cartilla', label: 'Entrega de cartilla sanitaria' },
    { key: 'entrega_pasaporte', label: 'Entrega de pasaporte (si aplica)' },
    { key: 'charla_bienvenida', label: 'Charla de bienvenida completada' },
  ],
  3: [
    { key: 'fecha_entrega', label: 'Fecha de entrega confirmada' },
    { key: 'foto_entrega', label: 'Foto de entrega tomada', hasFile: true },
    { key: 'baja_crm', label: 'Animal dado de baja en el CRM' },
    { key: 'aviso_registro', label: 'Aviso al registro municipal enviado' },
  ],
  4: [
    { key: 'llamada_1semana', label: 'Llamada de seguimiento a 1 semana' },
    { key: 'llamada_1mes', label: 'Llamada de seguimiento a 1 mes' },
    { key: 'llamada_3meses', label: 'Llamada de seguimiento a 3 meses' },
    { key: 'caso_cerrado', label: 'Caso cerrado con éxito' },
  ],
};

const FASE_LABELS = ['', 'Documentación', 'Preparación', 'Entrega', 'Seguimiento post-adopción'];
const FASE_ICONS = ['', '📄', '🎒', '🤝', '📞'];

function FaseProgress({ exp }: { exp: AdoptionExpedient }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
      {[1, 2, 3, 4].map(f => {
        const items = CHECKLIST_DEF[f] || [];
        const checklist = exp.checklist || [];
        const done = items.filter(i => checklist.find(c => c.item_key === i.key)?.completado).length;
        const all = items.length;
        const isActive = exp.fase_actual === f;
        const isComplete = done === all;
        return (
          <div key={f} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', margin: '0 auto 4px',
              background: isComplete ? '#16a34a' : isActive ? '#2563eb' : 'var(--bg-subtle-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>{isComplete ? '✓' : FASE_ICONS[f]}</div>
            <div style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 400, color: isActive ? '#2563eb' : isComplete ? '#16a34a' : 'var(--text-faint)' }}>
              F{f} {FASE_LABELS[f]}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{done}/{all}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function ExpedientePanel({ expedienteId, onClose, onCerrado }: Props) {
  const { can, user } = useAuth();
  const [exp, setExp] = useState<AdoptionExpedient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [showCerrarConfirm, setShowCerrarConfirm] = useState(false);
  const [fase3Done, setFase3Done] = useState(false);

  const load = () => {
    setError(false);
    api.getExpediente(expedienteId).then(e => {
      setExp(e);
      const f3items = CHECKLIST_DEF[3] || [];
      const f3done = f3items.every(i => e.checklist?.find(c => c.item_key === i.key)?.completado);
      setFase3Done(f3done);
    }).catch(e => { console.error(e); setError(true); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [expedienteId]);

  const handleToggle = async (itemKey: string, currentVal: boolean, fase: number) => {
    if (!exp) return;
    setToggling(itemKey);
    try {
      await api.toggleChecklist(exp.id, itemKey, !currentVal);
      load();
    } finally { setToggling(null); }
  };

  const handleCerrar = async () => {
    if (!exp) return;
    setCerrando(true);
    try {
      await api.cerrarExpediente(exp.id);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#16a34a', '#4ade80', '#86efac', '#fde047', '#f59e0b'] });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.7, x: 0.3 } }), 300);
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.7, x: 0.7 } }), 600);
      setShowCerrarConfirm(false);
      onCerrado();
    } finally { setCerrando(false); }
  };

  const getItem = (key: string): ChecklistItem | undefined =>
    exp?.checklist?.find(c => c.item_key === key);

  if (loading) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 620, background: 'var(--bg-surface)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={36} />
      </div>
    </>
  );
  if (error) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 620, background: 'var(--bg-surface)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ErrorState onRetry={load} />
      </div>
    </>
  );
  if (!exp) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 620, background: 'var(--bg-surface)', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Expediente #{exp.id}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {exp.animal_nombre} → {exp.adoptante_nombre}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-faint)' }}>×</button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* Animal + adoptante */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, overflow: 'hidden' }}>
              {exp.animal_foto ? <img src={exp.animal_foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : exp.animal_especie === 'perro' ? '🐕' : '🐈'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{exp.animal_nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'capitalize' }}>{exp.animal_especie} {exp.animal_raza && `· ${exp.animal_raza}`}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{exp.adoptante_nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{exp.adoptante_email}</div>
              {exp.adoptante_telefono && <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{exp.adoptante_telefono}</div>}
            </div>
          </div>

          {/* Progreso de fases */}
          <FaseProgress exp={exp} />

          {/* Checklist por fase */}
          {[1, 2, 3, 4].map(fase => {
            const items = CHECKLIST_DEF[fase] || [];
            const isCurrentOrPast = exp.fase_actual >= fase;
            return (
              <div key={fase} style={{ opacity: isCurrentOrPast ? 1 : 0.45 }}>
                <div style={{
                  fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    background: exp.fase_actual === fase ? '#dbeafe' : exp.fase_actual > fase ? '#dcfce7' : 'var(--bg-subtle-2)',
                    color: exp.fase_actual === fase ? '#1d4ed8' : exp.fase_actual > fase ? '#15803d' : 'var(--text-faint)',
                    padding: '2px 8px', borderRadius: 20, fontSize: 11.5,
                  }}>Fase {fase}</span>
                  {FASE_LABELS[fase]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => {
                    const ci = getItem(item.key);
                    const done = ci?.completado ?? false;
                    const isToggling = toggling === item.key;
                    return (
                      <div key={item.key} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                        background: done ? '#f0fdf4' : '#f9fafb', borderRadius: 9,
                        border: `1px solid ${done ? '#bbf7d0' : 'var(--border-subtle)'}`,
                        opacity: !isCurrentOrPast ? 0.6 : 1,
                      }}>
                        <button
                          disabled={!can('adopciones:manage') || !isCurrentOrPast || isToggling}
                          onClick={() => handleToggle(item.key, done, fase)}
                          style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            border: `2px solid ${done ? '#16a34a' : 'var(--border)'}`,
                            background: done ? '#16a34a' : 'var(--bg-surface)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: can('adopciones:manage') && isCurrentOrPast ? 'pointer' : 'default',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            transition: 'all 0.2s', marginTop: 1,
                          }}
                        >
                          {isToggling ? '...' : done ? '✓' : ''}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: done ? 600 : 400, color: done ? '#15803d' : 'var(--text-secondary)', textDecoration: done ? 'none' : 'none' }}>
                            {item.label}
                          </div>
                          {done && ci?.completado_at && (
                            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
                              {formatDate(ci.completado_at)}{ci.completado_por_nombre && ` · ${ci.completado_por_nombre}`}
                            </div>
                          )}
                          {done && ci?.notas && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{ci.notas}</div>}
                          {done && ci?.file_url && (
                            <a href={ci.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', marginTop: 3, display: 'block' }}>📎 Ver documento</a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Cerrar expediente */}
          {fase3Done && can('adopciones:manage') && (
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d', marginBottom: 6 }}>¡Fase de entrega completada!</div>
              <div style={{ fontSize: 13, color: '#166534', marginBottom: 16 }}>Cierra el expediente para registrar la adopción como completada.</div>
              <button onClick={() => setShowCerrarConfirm(true)} style={{
                padding: '11px 28px', background: '#16a34a', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
              }}>
                🐾 Cerrar expediente y marcar como adoptado
              </button>
            </div>
          )}

          {/* Timeline */}
          {exp.timeline && exp.timeline.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 10 }}>Timeline del proceso</div>
              {exp.timeline.map(t => (
                <div key={t.id} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{t.descripcion}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{formatDateTime(t.created_at)}{t.usuario_nombre && ` · ${t.usuario_nombre}`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmar cierre */}
      {showCerrarConfirm && (
        <>
          <div onClick={() => setShowCerrarConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-surface)', borderRadius: 16, width: 420, padding: 28, zIndex: 70, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🐾❤️</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>¡Confirmar adopción!</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Esto marcará a <strong>{exp.animal_nombre}</strong> como adoptado, lo retirará del portal web y cerrará el expediente.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => setShowCerrarConfirm(false)} style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg-surface)', cursor: 'pointer', fontSize: 13.5, fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handleCerrar} disabled={cerrando} style={{ padding: '10px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                {cerrando ? <><Spinner size={16} /> Procesando...</> : '🎉 Confirmar adopción'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

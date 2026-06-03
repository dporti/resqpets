interface Props {
  titulo: string;
  subtitulo?: string;
  onNew?: () => void;
  showNew?: boolean;
  avisosCount?: number;
  newLabel?: string;
}

export default function TopBar({ titulo, subtitulo, onNew, showNew = true, avisosCount, newLabel = '+ Nuevo' }: Props) {
  return (
    <div style={{
      height: 60, padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', background: '#fff',
      borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111', lineHeight: 1.3 }}>{titulo}</div>
        {subtitulo && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{subtitulo}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {avisosCount !== undefined && avisosCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#fef9c3', border: '1px solid #fde047',
            borderRadius: 7, padding: '5px 10px', fontSize: 12.5, fontWeight: 500,
            color: '#92400e',
          }}>
            🔔 {avisosCount} aviso{avisosCount !== 1 ? 's' : ''} activo{avisosCount !== 1 ? 's' : ''}
          </div>
        )}
        {showNew && onNew && (
          <button onClick={onNew} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#16a34a', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}>
            {newLabel}
          </button>
        )}
      </div>
    </div>
  );
}

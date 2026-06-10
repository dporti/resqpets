import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { api } from '../../api/client';
import { Period, periodToParams } from './shared';

interface Props { period: Period; refugioNombre: string; onClose: () => void; }

export function ExportModal({ period, refugioNombre, onClose }: Props) {
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [reportName, setReportName] = useState(`Informe ResQPet — ${period.label} ${new Date().getFullYear()}`);
  const [sections, setSections] = useState({ resumen: true, animales: true, adopciones: true, acogidas: true, sos: true });
  const [includeAI, setIncludeAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const toggleSection = (k: keyof typeof sections) => setSections(prev => ({ ...prev, [k]: !prev[k] }));

  const exportCSV = async () => {
    setLoading(true);
    setProgress('Cargando datos...');
    try {
      const JSZip = (await import('jszip')).default;
      const qs = new URLSearchParams(periodToParams(period)).toString();
      const data = await api.get<Record<string, Record<string, unknown>[]>>(`/reportes/export?${qs}`);

      const zip = new JSZip();

      const toCSV = (rows: Record<string, unknown>[]) => {
        if (!rows.length) return 'Sin datos';
        const headers = Object.keys(rows[0]);
        const lines = [headers.join(',')];
        rows.forEach(row => lines.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(',')));
        return lines.join('\n');
      };

      const slug = period.label.toLowerCase().replace(/\s+/g, '_');
      zip.file(`animales_${slug}.csv`, toCSV(data.animales));
      zip.file(`adopciones_${slug}.csv`, toCSV(data.adopciones));
      zip.file(`acogidas_${slug}.csv`, toCSV(data.acogidas));
      zip.file(`sos_${slug}.csv`, toCSV(data.sos));

      setProgress('Generando ZIP...');
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ResQPet_Datos_${refugioNombre.replace(/\s/g, '_')}_${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      console.error(e);
      setProgress('Error al generar CSV');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      let pageN = 1;

      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`${refugioNombre} — ${period.label}`, 14, H - 8);
        doc.text(`${pageN}`, W - 14, H - 8, { align: 'right' });
        // Marca de agua
        doc.setFontSize(36);
        doc.setTextColor(240);
        doc.saveGraphicsState();
        doc.text('CONFIDENCIAL', W / 2, H / 2, { align: 'center', angle: 45 });
        doc.restoreGraphicsState();
        doc.setTextColor(0);
      };

      // ── PORTADA ────────────────────────────────────────────────────
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, W, 60, 'F');
      doc.setTextColor(255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('🐾 ResQPet', W / 2, 28, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Informe de Actividad', W / 2, 40, { align: 'center' });
      doc.setFontSize(12);
      doc.text(refugioNombre, W / 2, 50, { align: 'center' });

      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text(reportName, W / 2, 90, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Período: ${period.label}`, W / 2, 102, { align: 'center' });
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, W / 2, 112, { align: 'center' });

      addFooter();

      // ── ÍNDICE ─────────────────────────────────────────────────────
      doc.addPage(); pageN++;
      doc.setFontSize(18); doc.setTextColor(0); doc.setFont('helvetica', 'bold');
      doc.text('Índice', 14, 24);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(60);
      let y = 40;
      const secs = [
        sections.resumen    && '1. Resumen General',
        sections.animales   && '2. Animales',
        sections.adopciones && '3. Adopciones',
        sections.acogidas   && '4. Acogidas',
        sections.sos        && '5. SOS Pet',
        includeAI           && '6. Resumen Ejecutivo (IA)',
      ].filter(Boolean) as string[];
      secs.forEach(s => { doc.text(s, 20, y); y += 10; });
      addFooter();

      // ── DATOS POR SECCIÓN ──────────────────────────────────────────
      const qs = new URLSearchParams(periodToParams(period)).toString();

      const addSection = (title: string, kpis: [string, string | number][], extra?: string) => {
        doc.addPage(); pageN++;
        doc.setFillColor(240, 253, 244);
        doc.rect(0, 0, W, 16, 'F');
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74);
        doc.text(title, 14, 11);
        doc.setTextColor(0); doc.setFont('helvetica', 'normal');

        let y = 28;
        kpis.forEach(([label, value]) => {
          doc.setFontSize(10); doc.setTextColor(120);
          doc.text(label, 14, y);
          doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
          doc.text(String(value), 14, y + 8);
          doc.setFont('helvetica', 'normal');
          y += 22;
          if (y > H - 30) { addFooter(); doc.addPage(); pageN++; y = 20; }
        });

        if (extra) {
          doc.setFontSize(10); doc.setTextColor(80);
          const lines = doc.splitTextToSize(extra, W - 28);
          doc.text(lines, 14, y + 6);
        }
        addFooter();
      };

      if (sections.resumen) {
        setProgress('Cargando resumen...');
        const d = await api.get<Record<string, Record<string, number>>>(`/reportes/resumen?${qs}`);
        const k = d.kpis;
        addSection('Resumen General', [
          ['Animales ingresados', k.ingresos],
          ['Adopciones completadas', k.adopciones],
          ['Tasa de adopción', `${k.tasa_adopcion}%`],
          ['Tiempo medio en refugio', `${k.tiempo_medio} días`],
          ['Animales en acogida', k.acogidas_activas],
          ['Avisos SOS resueltos', k.sos_resueltos],
        ]);
      }

      if (sections.animales) {
        setProgress('Cargando animales...');
        const d = await api.get<Record<string, Record<string, number>>>(`/reportes/animales?${qs}`);
        const k = d.kpis;
        addSection('Animales', [
          ['Total gestionados', k.total],
          ['Media ingresos/semana', k.media_semana],
          ['Tiempo medio estancia', `${k.tiempo_medio} días`],
          ['Necesidades especiales', k.necesidades_especiales],
        ]);
      }

      if (sections.adopciones) {
        setProgress('Cargando adopciones...');
        const d = await api.get<Record<string, Record<string, number>>>(`/reportes/adopciones?${qs}`);
        const k = d.kpis;
        addSection('Adopciones', [
          ['Solicitudes recibidas', k.solicitudes],
          ['Adopciones completadas', k.completadas],
          ['Tasa de conversión', `${k.tasa_conversion}%`],
          ['Tiempo medio proceso', `${k.tiempo_proceso} días`],
        ]);
      }

      if (sections.acogidas) {
        setProgress('Cargando acogidas...');
        const d = await api.get<Record<string, Record<string, number>>>(`/reportes/acogidas?${qs}`);
        const k = d.kpis;
        addSection('Acogidas', [
          ['Familias activas', k.activas],
          ['Acogidas iniciadas', k.iniciadas],
          ['Acogidas completadas', k.completadas],
          ['% termina en adopción', `${k.pct_adopcion_familia}%`],
        ]);
      }

      if (sections.sos) {
        setProgress('Cargando SOS...');
        const d = await api.get<Record<string, Record<string, number>>>(`/reportes/sos?${qs}`);
        const k = d.kpis;
        addSection('SOS Pet', [
          ['Avisos creados', k.creados],
          ['Avisos resueltos', k.resueltos],
          ['Tasa de resolución', `${k.tasa_resolucion}%`],
          ['Tiempo medio resolución', `${k.tiempo_medio_h}h`],
        ]);
      }

      if (includeAI) {
        setProgress('Generando resumen con IA...');
        try {
          const resumenD = await api.get<Record<string, Record<string, number>>>(`/reportes/resumen?${qs}`);
          const aiRes = await api.post<{ summary: string }>('/reportes/ai-summary', {
            kpis: resumenD.kpis,
            periodo: period.label,
            refugio_nombre: refugioNombre,
          });
          doc.addPage(); pageN++;
          doc.setFillColor(255, 251, 235);
          doc.rect(0, 0, W, 16, 'F');
          doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 83, 9);
          doc.text('✨ Resumen Ejecutivo (generado por IA)', 14, 11);
          doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
          const lines = doc.splitTextToSize(aiRes.summary, W - 28);
          doc.text(lines, 14, 28);
          addFooter();
        } catch {
          // AI optional, continue without
        }
      }

      setProgress('Guardando PDF...');
      const slug = period.label.toLowerCase().replace(/\s+/g, '_');
      doc.save(`ResQPet_Informe_${refugioNombre.replace(/\s/g, '_')}_${slug}.pdf`);
      onClose();
    } catch (e) {
      console.error('PDF error:', e);
      setProgress('Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => format === 'pdf' ? exportPDF() : exportCSV();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 50px rgba(0,0,0,.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Exportar informe</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-faint)' }}>✕</button>
        </div>

        {/* Formato */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {(['pdf', 'csv'] as const).map(f => (
            <button key={f} onClick={() => setFormat(f)} style={{
              flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 600,
              border: '2px solid', borderColor: format === f ? '#16a34a' : 'var(--border)',
              background: format === f ? '#f0fdf4' : 'var(--bg-surface)', color: format === f ? '#16a34a' : '#374151',
              fontSize: 14,
            }}>
              {f === 'pdf' ? '📄 PDF' : '📊 CSV (ZIP)'}
            </button>
          ))}
        </div>

        {format === 'pdf' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Nombre del informe
              </label>
              <input value={reportName} onChange={e => setReportName(e.target.value)} style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
                fontSize: 13, boxSizing: 'border-box',
              }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                Secciones a incluir
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(sections).map(([k, v]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={v} onChange={() => toggleSection(k as keyof typeof sections)}
                      style={{ accentColor: '#16a34a' }} />
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
              <input type="checkbox" checked={includeAI} onChange={e => setIncludeAI(e.target.checked)}
                style={{ accentColor: '#16a34a' }} />
              <span>✨ Incluir resumen ejecutivo generado por IA</span>
            </label>
          </>
        )}

        <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          📅 Período: <strong>{period.label}</strong> — {new Date().toLocaleDateString('es-ES')}
        </div>

        {progress && (
          <p style={{ color: '#16a34a', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
            {loading ? '⏳ ' : '✓ '}{progress}
          </p>
        )}

        <button onClick={handleExport} disabled={loading} style={{
          width: '100%', padding: '13px', background: loading ? '#9ca3af' : '#16a34a', color: '#fff',
          border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 15,
        }}>
          {loading ? 'Generando...' : `Exportar ${format.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}

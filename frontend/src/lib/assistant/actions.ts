import { api } from '../../api/client';

export interface DetectedAction {
  type: 'navigate' | 'create_task' | 'copy_email';
  label: string;
  icon: string;
  payload?: Record<string, unknown>;
  text?: string;
}

// Parsea el texto de respuesta buscando directivas ACTION:
export function parseActions(text: string): { clean: string; actions: DetectedAction[] } {
  const actions: DetectedAction[] = [];
  let clean = text;

  // ACTION:NAVIGATE:seccion
  const navMatches = text.matchAll(/ACTION:NAVIGATE:(\w+)/g);
  for (const m of navMatches) {
    const seccion = m[1];
    const LABELS: Record<string, string> = {
      inicio: 'Ir al Dashboard', animales: 'Ir a Animales',
      adopciones: 'Ir a Adopciones', acogidas: 'Ir a Acogidas',
      voluntarios: 'Ir a Voluntarios', reportes: 'Ir a Reportes',
      mensajes: 'Ir a Mensajes', calendario: 'Ir al Calendario',
      donaciones: 'Ir a Donaciones', configuracion: 'Ir a Configuración',
    };
    actions.push({ type: 'navigate', label: LABELS[seccion] || `Ir a ${seccion}`, icon: '🧭', payload: { vista: seccion } });
    clean = clean.replace(m[0], '');
  }

  // ACTION:CREATE_TASK:{...}
  const taskMatches = text.matchAll(/ACTION:CREATE_TASK:(\{[^}]+\})/g);
  for (const m of taskMatches) {
    try {
      const data = JSON.parse(m[1]);
      actions.push({ type: 'create_task', label: `Crear tarea: "${data.titulo}"`, icon: '✅', payload: data });
      clean = clean.replace(m[0], '');
    } catch { /* ignore parse errors */ }
  }

  // ACTION:COPY_EMAIL — next paragraph is the email
  if (text.includes('ACTION:COPY_EMAIL')) {
    const emailContent = text.split('ACTION:COPY_EMAIL')[1]?.trim() || '';
    actions.push({ type: 'copy_email', label: 'Copiar email al portapapeles', icon: '📋', text: emailContent });
    clean = clean.replace('ACTION:COPY_EMAIL', '');
  }

  return { clean: clean.trim(), actions };
}

// Ejecuta una acción detectada
export async function executeAction(
  action: DetectedAction,
  onNavigate: (vista: string) => void,
): Promise<string> {
  switch (action.type) {
    case 'navigate':
      onNavigate(action.payload?.vista as string);
      return `Navegando a ${action.payload?.vista}...`;

    case 'create_task': {
      const r = await api.post<{ id: number; titulo: string }>('/assistant/create-task', action.payload || {});
      return `✅ Tarea "${r.titulo}" creada con ID #${r.id}`;
    }

    case 'copy_email':
      if (action.text) {
        await navigator.clipboard.writeText(action.text).catch(() => {});
        return '📋 Email copiado al portapapeles';
      }
      return 'No hay email para copiar';

    default:
      return 'Acción no reconocida';
  }
}

// Simple markdown → HTML renderer
export function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```[\s\S]*?```/g, m => {
      const inner = m.slice(3, -3).replace(/^[a-z]*\n/, '');
      return `<pre style="background:#f3f4f6;padding:10px 12px;border-radius:8px;overflow-x:auto;font-size:12px;margin:8px 0"><code>${inner}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Tables
    .replace(/(\|.+\|\n)+/g, (table) => {
      const rows = table.trim().split('\n').filter(r => !r.match(/^\|[-| :]+\|$/));
      const tableRows = rows.map((row, i) => {
        const cells = row.split('|').filter(c => c.trim()).map(c => c.trim());
        const tag = i === 0 ? 'th' : 'td';
        const style = i === 0 ? 'background:#f9fafb;fontWeight:600;' : '';
        return `<tr>${cells.map(c => `<${tag} style="padding:6px 10px;border:1px solid #e5e7eb;${style}">${c}</${tag}>`).join('')}</tr>`;
      });
      return `<table style="border-collapse:collapse;font-size:12px;margin:8px 0;width:100%">${tableRows.join('')}</table>`;
    })
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ul style="margin:6px 0;padding-left:18px">${m}</ul>`)
    // Headings
    .replace(/^### (.+)$/gm, '<h4 style="margin:12px 0 4px;font-size:14px;font-weight:700">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin:12px 0 6px;font-size:15px;font-weight:700">$1</h3>')
    // Line breaks (but not inside block elements)
    .replace(/\n\n/g, '</p><p style="margin:6px 0">')
    .replace(/\n/g, '<br/>');

  return `<p style="margin:0">${html}</p>`;
}

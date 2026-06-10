import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AnimalListProvider } from './context/AnimalListContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DetalleAnimalPage from './pages/DetalleAnimalPage';
import AnimalesPage from './pages/AnimalesPage';
import AdopcionesPage from './pages/AdopcionesPage';
import AcogidasPage from './pages/AcogidasPage';
import VoluntariosPage from './pages/VoluntariosPage';
import AvisosPage from './pages/AvisosPage';
import UsuariosPage from './pages/UsuariosPage';
import ReportesPage from './pages/ReportesPage';
import MensajesPage from './pages/MensajesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import DonacionesPage from './pages/DonacionesPage';
import FinanzasPage from './pages/FinanzasPage';
import { FloatingAssistant, AssistantButton } from './components/assistant/FloatingAssistant';
import { PlanProvider } from './lib/billing/PlanContext';

function AssistantFull({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(p => !p); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <>
      <AssistantButton onClick={() => setOpen(true)} />
      {open && <FloatingAssistant onNavigate={(v) => { onNavigate(v); setOpen(false); }} onClose={() => setOpen(false)} />}
    </>
  );
}
import CalendarioPage from './pages/CalendarioPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { Spinner, EmptyState } from './components/ui';
import { Animal } from './types';

function PlaceholderPage({ titulo, icon }: { titulo: string; icon: string }) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--bg-page)', minHeight: '100vh' }}>
      <TopBar titulo={titulo} showNew={false} />
      <EmptyState icon={icon} title="Sección en desarrollo" subtitle="Próximamente disponible" />
    </div>
  );
}

function AppShell() {
  const { user, loading, can } = useAuth();
  const [vista, setVista] = useState('inicio');
  const [animalActivo, setAnimalActivo] = useState<Animal | null>(null);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    const fetchUnread = () =>
      import('./api/client').then(({ api }) =>
        api.get<{ unread: number }>('/mensajes/unread').then(r => setUnreadMsgs(r.unread)).catch(() => {})
      );
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
          <Spinner size={36} />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const irADetalle = (animal: Animal) => {
    setAnimalActivo(animal);
    setVista('detalle');
  };

  const volverLista = () => {
    setAnimalActivo(null);
    setVista('animales');
  };

  const irAAnimales = () => setVista('animales');

  const renderContent = () => {
    if (vista === 'detalle' && animalActivo) {
      return <DetalleAnimalPage
        animalId={animalActivo.id}
        onVolver={volverLista}
        onNavigate={(id) => { setAnimalActivo({ ...animalActivo, id }); }}
      />;
    }

    switch (vista) {
      case 'inicio':
        return <DashboardPage onVerAnimal={irADetalle} onNew={irAAnimales} />;

      case 'animales':
        return <AnimalesPage onVerAnimal={irADetalle} />;

      case 'adopciones':
        return can('adopciones:read')
          ? <AdopcionesPage />
          : <PlaceholderPage titulo="Sin acceso" icon="🔒" />;

      case 'acogidas':
        return <AcogidasPage />;

      case 'voluntarios':
        return <VoluntariosPage />;

      case 'avisos':
        return <AvisosPage />;

      case 'donaciones':
        return <DonacionesPage />;

      case 'finanzas':
        return can('finanzas:read')
          ? <FinanzasPage />
          : <PlaceholderPage titulo="Sin acceso" icon="🔒" />;

      case 'reportes':
        return can('reportes:read')
          ? <ReportesPage />
          : <PlaceholderPage titulo="Sin acceso" icon="🔒" />;

      case 'calendario':
        return <CalendarioPage />;

      case 'mensajes':
        return <MensajesPage />;

      case 'mensajes_placeholder_removed': // keep linter happy
        return <PlaceholderPage titulo="Mensajes" icon="✉️" />;

      case 'configuracion':
        return <ConfiguracionPage />;

      default:
        return <DashboardPage onVerAnimal={irADetalle} onNew={() => {}} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar vista={vista} setVista={setVista} unreadMsgs={unreadMsgs} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--bg-page)' }}>
        {renderContent()}
      </div>
      <AssistantFull onNavigate={(v) => setVista(v)} />
    </div>
  );
}

export default function App() {
  return (
    <PlanProvider>
      <AppShell />
    </PlanProvider>
  );
}

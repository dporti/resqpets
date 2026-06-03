import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AnimalListProvider } from './context/AnimalListContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DetalleAnimalPage from './pages/DetalleAnimalPage';
import AnimalesPage from './pages/AnimalesPage';
import AdopcionesPage from './pages/AdopcionesPage';
import AcogidasPage from './pages/AcogidasPage';
import UsuariosPage from './pages/UsuariosPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { Spinner, EmptyState } from './components/ui';
import { Animal } from './types';

function PlaceholderPage({ titulo, icon }: { titulo: string; icon: string }) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar titulo={titulo} showNew={false} />
      <EmptyState icon={icon} title="Sección en desarrollo" subtitle="Próximamente disponible" />
    </div>
  );
}

function AppShell() {
  const { user, loading, can } = useAuth();
  const [vista, setVista] = useState('inicio');
  const [animalActivo, setAnimalActivo] = useState<Animal | null>(null);

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
        return <UsuariosPage />;

      case 'avisos':
        return <PlaceholderPage titulo="Avisos y rescates" icon="🔔" />;

      case 'donaciones':
        return can('donaciones:read')
          ? <PlaceholderPage titulo="Donaciones" icon="💝" />
          : <PlaceholderPage titulo="Sin acceso" icon="🔒" />;

      case 'reportes':
        return can('reportes:read')
          ? <PlaceholderPage titulo="Reportes" icon="📊" />
          : <PlaceholderPage titulo="Sin acceso" icon="🔒" />;

      case 'calendario':
        return <PlaceholderPage titulo="Calendario" icon="📅" />;

      case 'mensajes':
        return <PlaceholderPage titulo="Mensajes" icon="✉️" />;

      case 'configuracion':
        return can('config:manage')
          ? <PlaceholderPage titulo="Configuración" icon="⚙️" />
          : <PlaceholderPage titulo="Sin acceso" icon="🔒" />;

      default:
        return <DashboardPage onVerAnimal={irADetalle} onNew={() => {}} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar vista={vista} setVista={setVista} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#f9fafb' }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AnimalListProvider>
      <AppShell />
    </AnimalListProvider>
  );
}

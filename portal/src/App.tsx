import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { HomePage } from './pages/HomePage';
import { AdoptarPage } from './pages/AdoptarPage';
import { AnimalDetailPage } from './pages/AnimalDetailPage';
import { SosPage } from './pages/SosPage';
import { ProtectorasPage } from './pages/ProtectorasPage';
import { ProtectoraDetailPage } from './pages/ProtectoraDetailPage';
import { ComoFuncionaPage } from './pages/ComoFuncionaPage';
import { SobreNosotrosPage } from './pages/SobreNosotrosPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/adoptar" element={<AdoptarPage />} />
        <Route path="/adoptar/:id" element={<AnimalDetailPage />} />
        <Route path="/sos" element={<SosPage />} />
        <Route path="/protectoras" element={<ProtectorasPage />} />
        <Route path="/protectoras/:slug" element={<ProtectoraDetailPage />} />
        <Route path="/como-funciona" element={<ComoFuncionaPage />} />
        <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

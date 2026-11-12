import { lazy, Suspense } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { AppStateProvider } from './app/AppState';
import { useAppState } from './app/context';
import { I18nProvider, useI18n } from './i18n';
import { CaseView } from './pages/CaseView';
import { Home } from './pages/Home';
import { MyCases } from './pages/MyCases';
import { NewCase } from './pages/NewCase';

// Officer-only screens are split out of the farmer bundle.
const Station = lazy(() => import('./pages/Station').then((m) => ({ default: m.Station })));
const Eval = lazy(() => import('./pages/Eval').then((m) => ({ default: m.Eval })));

function Shell() {
  const { t, lang, setLang } = useI18n();
  const { online, configured, authError } = useAppState();
  return (
    <>
      <header className="topbar">
        <NavLink to="/" className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>{t('appName')}</span>
        </NavLink>
        <nav>
          <NavLink to="/new">{t('navNew')}</NavLink>
          <NavLink to="/cases">{t('navCases')}</NavLink>
          <NavLink to="/station">{t('navStation')}</NavLink>
        </nav>
        <div className="topbar-right">
          <span className={`net ${online ? 'net-on' : 'net-off'}`}>{online ? t('online') : t('offline')}</span>
          <button className="lang" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} aria-label="Language">
            {lang === 'vi' ? 'EN' : 'VI'}
          </button>
        </div>
      </header>
      {!configured && <p className="banner">{t('notConfigured')}</p>}
      {authError && <p className="banner">{authError}</p>}
      <main>
        <Suspense fallback={<div className="page">…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewCase />} />
          <Route path="/cases" element={<MyCases />} />
          <Route path="/case/:id" element={<CaseView />} />
          <Route path="/station" element={<Station />} />
          <Route path="/eval" element={<Eval />} />
        </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppStateProvider>
          <Shell />
        </AppStateProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

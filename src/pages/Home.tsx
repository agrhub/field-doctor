import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { DeviceCard } from '../ui/DeviceCard';

export function Home() {
  const { t } = useI18n();
  return (
    <div className="page">
      <section className="hero">
        <h1>{t('appName')}</h1>
        <p>{t('tagline')}</p>
        <Link to="/new" className="btn btn-big">
          🌾 {t('startCheck')}
        </Link>
      </section>
      <DeviceCard />
      <section className="card">
        <h3>{t('howItWorks')}</h3>
        <ol className="steps">
          <li>{t('step1')}</li>
          <li>{t('step2')}</li>
          <li>{t('step3')}</li>
        </ol>
      </section>
    </div>
  );
}

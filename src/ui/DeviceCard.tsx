import { useAppState } from '../app/context';
import { useI18n } from '../i18n';

export function DeviceCard() {
  const { device, downloadProgress, downloadDeviceModel } = useAppState();
  const { t } = useI18n();

  const text =
    device === 'available'
      ? t('deviceAvailable')
      : device === 'downloadable'
        ? t('deviceDownloadable')
        : device === 'downloading'
          ? t('deviceDownloading')
          : t('deviceUnavailable');

  return (
    <section className={`card device device-${device}`}>
      <div className="device-icon" aria-hidden>
        {device === 'available' ? '⚡' : device === 'downloadable' || device === 'downloading' ? '⬇️' : '☁️'}
      </div>
      <div>
        <h3>{t('deviceTitle')}</h3>
        <p>{text}</p>
        {device === 'downloadable' && (
          <button className="btn" onClick={() => void downloadDeviceModel()}>
            {t('downloadModel')}
          </button>
        )}
        {downloadProgress !== null && (
          <progress value={downloadProgress} max={1} aria-label={t('deviceDownloading')} />
        )}
      </div>
    </section>
  );
}

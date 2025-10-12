// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/pwa-service-worker.js');
  });
}

// Import board converter for on-demand conversion
import '/client/lib/boardConverter';
import '/client/components/boardConversionProgress';

// Import migration manager and progress UI
import '/client/lib/migrationManager';
import '/client/components/migrationProgress';

// Import cron settings
import '/client/components/settings/cronSettings';

// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/pwa-service-worker.js');
  });
}

// Import board converter for on-demand conversion
import '/imports/lib/boardConverter';
import '/imports/components/boardConversionProgress';

// Import migration manager and progress UI
import '/imports/lib/migrationManager';
import '/imports/components/migrationProgress';

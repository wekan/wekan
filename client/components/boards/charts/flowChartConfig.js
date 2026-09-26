// Loaded only after an advanced chart is opened. Chart.js itself is loaded
// by the existing cached dynamic import in boardCharts.js.
const BLUE = '#2878b5';
const RED = '#c0392b';
const GREEN = '#23834d';

export function flowChartConfigs(key, data, t, text) {
  if (!data) return [];
  const title = label => ({ display: true, text: label });
  const options = (x, y) => ({ responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { x: { title: title(x) }, y: { title: title(y), beginAtZero: true } } });
  const line = (label, values, color = BLUE) => ({ label, data: values, borderColor: color,
    backgroundColor: color, pointRadius: 2, borderWidth: 2, spanGaps: false });
  const days = t('days');
  if (key === 'agingWip') {
    const points = data.points.filter(p => p.ageDays !== null);
    return [{ type: 'bar', data: { labels: points.map(p => `${text(p.title)} (${text(p.list)})`), datasets: [
      { label: t('flow-age-days'), data: points.map(p => p.ageDays), backgroundColor: points.map(p => p.unusual ? RED : BLUE) },
      { ...line(t('flow-p85'), points.map(p => p.threshold), GREEN), type: 'line' },
    ] }, options: options(t('card'), days) }];
  }
  if (key === 'blockerAnalysis') return [{ type: 'bar', data: {
    labels: data.groups.map(g => text(g.title)), datasets: [
      { label: t('flow-blocked-days'), data: data.groups.map(g => g.days), backgroundColor: RED },
    ],
  }, options: options(t('flow-blocker'), t('flow-blocked-days')) }];
  if (key === 'monteCarlo') return [
    { type: 'bar', data: { labels: data.forecasts.map(p => `${p.probability}%`), datasets: [
      { label: t('flow-finish-days'), data: data.forecasts.map(p => p.days), backgroundColor: BLUE },
    ] }, options: options(t('flow-confidence'), days) },
    { type: 'bar', data: { labels: data.forecasts.map(p => `${p.probability}%`), datasets: [
      { label: t('flow-capacity'), data: data.forecasts.map(p => p.count), backgroundColor: GREEN },
    ] }, options: options(t('flow-confidence'), t('cards')) },
  ];
  if (key === 'processBehavior' && data.limits) {
    const labels = data.points.map(p => `${new Date(p.completedAt).toISOString().slice(0, 10)} · ${text(p.title)}`);
    const limit = (name, value, color) => ({ ...line(name, labels.map(() => value), color), pointRadius: 0, borderDash: [5, 5] });
    return [
      { type: 'line', data: { labels, datasets: [
        { ...line(t('flow-cycle-days'), data.points.map(p => p.cycleDays)), pointBackgroundColor: data.points.map(p => p.signal ? RED : BLUE) },
        limit(t('flow-mean'), data.limits.average, GREEN),
        limit('UCL', data.limits.upper, RED), limit('LCL', data.limits.lower, RED),
      ] }, options: options(t('completed'), days) },
      { type: 'line', data: { labels, datasets: [
        line(t('flow-moving-range'), data.points.map(p => p.movingRange)),
        limit(t('flow-mr-mean'), data.limits.mrAverage, GREEN),
        limit('UCL', data.limits.mrUpper, RED), limit('LCL', 0, RED),
      ] }, options: options(t('completed'), days) },
    ];
  }
  if (key === 'sizeCycleTime') {
    const labels = data.points.map(p => text(p.title));
    const config = { type: 'scatter', data: { datasets: [{ label: t('flow-cycle-days'),
      data: data.points.map(p => ({ x: p.size, y: p.cycleDays })), backgroundColor: BLUE,
    }] }, options: options(t('flow-size'), t('flow-cycle-days')) };
    config.options.plugins.tooltip = { callbacks: {
      label: context => `${labels[context.dataIndex]}: ${context.parsed.x}, ${context.parsed.y.toFixed(2)} ${days}`,
    } };
    return [config];
  }
  return [];
}

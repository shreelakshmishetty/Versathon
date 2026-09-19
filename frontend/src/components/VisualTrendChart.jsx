import { useState } from 'react';
import { TrendingUp, Activity, CheckCircle2 } from 'lucide-react';

export default function VisualTrendChart({ reports = [] }) {
  // Extract historical points for common metrics across all available reports
  // Find parameters that appear in multiple reports
  const metricOptions = ['Hemoglobin', 'Fasting Blood Glucose', 'Total Cholesterol', 'Platelets', 'WBC Count'];
  const [selectedMetric, setSelectedMetric] = useState('Hemoglobin');

  // Collect data points for selected metric
  const points = [];
  reports.forEach((rep) => {
    // If report has tests
    if (rep.tests && rep.tests.length > 0) {
      const match = rep.tests.find(t => t.test_name.toLowerCase().includes(selectedMetric.toLowerCase()) || selectedMetric.toLowerCase().includes(t.test_name.toLowerCase()));
      if (match && match.value) {
        const num = parseFloat(match.value.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          points.push({
            date: rep.report_date || rep.created_at?.slice(0, 10) || 'Recent',
            value: num,
            unit: match.unit || '',
            reference: match.reference_range || '',
            reportName: rep.original_filename
          });
        }
      }
    }
  });

  // Sort by date if multiple
  points.sort((a, b) => (a.date > b.date ? 1 : -1));

  if (points.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-teal-600" />
          <h3 className="text-base font-bold text-slate-900">Longitudinal Trend Tracker</h3>
        </div>
        <p className="text-xs text-slate-500">
          Upload 2 or more reports to generate interactive visual timeline charts tracking your biological parameters.
        </p>
      </div>
    );
  }

  // Calculate SVG scales
  const values = points.map(p => p.value);
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const range = maxVal - minVal || 1;

  const width = 540;
  const height = 180;
  const padding = 40;

  const coords = points.map((p, idx) => {
    const x = padding + (idx / (points.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((p.value - minVal) / range) * (height - 2 * padding);
    return { ...p, x, y };
  });

  const polylineStr = coords.map(c => `${c.x},${c.y}`).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Longitudinal Trend Tracker</h3>
            <p className="text-xs text-slate-500">Tracking numeric shifts across your uploaded timeline</p>
          </div>
        </div>

        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500"
        >
          {metricOptions.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* SVG Interactive Graph */}
      <div className="relative overflow-x-auto bg-slate-50/70 rounded-xl p-4 border border-slate-200">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

          {/* Trend Line */}
          <polyline
            fill="none"
            stroke="#0d9488"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Points */}
          {coords.map((c, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={c.x} cy={c.y} r="6" fill="#0d9488" stroke="#ffffff" strokeWidth="2" className="transition-transform hover:scale-125" />
              <text x={c.x} y={c.y - 12} textAnchor="middle" className="text-[11px] font-bold fill-slate-900">
                {c.value} {c.unit}
              </text>
              <text x={c.x} y={height - padding + 18} textAnchor="middle" className="text-[10px] font-medium fill-slate-500">
                {c.date}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Timeline spans {points.length} recorded lab report(s)</span>
        <span className="font-bold text-teal-700">Ref: {points[0]?.reference || 'Available on report'}</span>
      </div>
    </div>
  );
}

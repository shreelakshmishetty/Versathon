import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Loader2,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { reportsService, comparisonsService } from '../services/api';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const initialNewId = searchParams.get('new') || '';

  const [reports, setReports] = useState([]);
  const [oldReportId, setOldReportId] = useState('');
  const [newReportId, setNewReportId] = useState(initialNewId);
  const [loadingReports, setLoadingReports] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const res = await reportsService.getAll('desc');
        setReports(res.data);

        // Auto-select if at least 2 reports exist
        if (res.data.length >= 2) {
          if (!newReportId) {
            setNewReportId(String(res.data[0].id));
            setOldReportId(String(res.data[1].id));
          } else {
            const olderCandidate = res.data.find((r) => String(r.id) !== newReportId);
            if (olderCandidate) setOldReportId(String(olderCandidate.id));
          }
        } else if (res.data.length === 1 && !newReportId) {
          setNewReportId(String(res.data[0].id));
        }
      } catch (err) {
        setError('Failed to fetch available reports for comparison.');
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, []);

  const handleCompare = async (e) => {
    if (e) e.preventDefault();
    if (!oldReportId || !newReportId) {
      setError('Please select both an older report and a newer report.');
      return;
    }
    if (oldReportId === newReportId) {
      setError('Please select two different reports to compare.');
      return;
    }

    setError('');
    setComparing(true);

    try {
      const res = await comparisonsService.createComparison(oldReportId, newReportId);
      setComparisonData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to compare reports. Please ensure both reports are accessible.');
    } finally {
      setComparing(false);
    }
  };

  // Run initial comparison if both IDs are pre-selected
  useEffect(() => {
    if (oldReportId && newReportId && oldReportId !== newReportId && !comparisonData) {
      handleCompare();
    }
  }, [oldReportId, newReportId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Report Evolution Tracking
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Historical Report Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare matching laboratory test parameters between two reports to track numeric changes over time.
          </p>
        </div>

        <MedicalDisclaimer compact />

        {/* Report Selectors Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm my-6">
          {loadingReports ? (
            <div className="py-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-teal-600" />
              <span>Loading your reports list...</span>
            </div>
          ) : reports.length < 2 ? (
            <div className="text-center py-6 space-y-3">
              <FileText size={32} className="text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">At least 2 reports are required for comparison</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You currently have {reports.length} report uploaded. Upload another laboratory report to compare historical values.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow transition-all"
              >
                <span>Upload Another Report</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCompare} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* Older Report Selector */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    1. Older / Baseline Report
                  </label>
                  <select
                    value={oldReportId}
                    onChange={(e) => setOldReportId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Select Older Report...</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id} disabled={String(r.id) === newReportId}>
                        {r.original_filename} {r.report_date ? `(${r.report_date})` : ''} - {r.test_count || 0} tests
                      </option>
                    ))}
                  </select>
                </div>

                {/* Newer Report Selector */}
                <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
                  <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider">
                    2. Newer / Recent Report
                  </label>
                  <select
                    value={newReportId}
                    onChange={(e) => setNewReportId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Select Newer Report...</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id} disabled={String(r.id) === oldReportId}>
                        {r.original_filename} {r.report_date ? `(${r.report_date})` : ''} - {r.test_count || 0} tests
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={comparing || !oldReportId || !newReportId || oldReportId === newReportId}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
              >
                {comparing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Comparing Reports...</span>
                  </>
                ) : (
                  <>
                    <GitCompare size={16} />
                    <span>Run Comparative Analysis</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Comparison Results */}
        {comparisonData && (
          <div className="space-y-6">
            {/* Reports Comparison Summary Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div className="space-y-1 pr-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Older Report</span>
                  <h4 className="text-sm font-bold text-slate-900">{comparisonData.old_report?.filename}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Date: {comparisonData.old_report?.date || 'Not specified'}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                  <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Newer Report</span>
                  <h4 className="text-sm font-bold text-slate-900">{comparisonData.new_report?.filename}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar size={13} className="text-teal-600" />
                    <span>Date: {comparisonData.new_report?.date || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Parameter Comparison Matrix</h3>
                  <p className="text-xs text-slate-500">
                    Comparing {comparisonData.comparisons?.length || 0} parameter(s) across both reports
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Test Parameter</th>
                      <th className="py-3.5 px-4">Older Value</th>
                      <th className="py-3.5 px-4">Newer Value</th>
                      <th className="py-3.5 px-4">Change / Delta</th>
                      <th className="py-3.5 px-4 max-w-md">Neutral Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonData.comparisons?.map((c, idx) => {
                      const isComparable = c.status === 'comparable';
                      const numChange = parseFloat(c.change);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{c.test_name}</td>
                          <td className="py-3.5 px-4 text-slate-700 font-semibold">
                            {c.previous ? `${c.previous} ${c.unit || ''}` : <span className="text-slate-400 italic">None</span>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 font-bold">
                            {c.current ? `${c.current} ${c.unit || ''}` : <span className="text-slate-400 italic">None</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            {isComparable ? (
                              <div className="flex items-center gap-1.5 font-bold">
                                {numChange > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                    <TrendingUp size={13} />
                                    <span>{c.change}</span>
                                    {c.pct_change && <small className="font-normal opacity-80">({c.pct_change})</small>}
                                  </span>
                                ) : numChange < 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    <TrendingDown size={13} />
                                    <span>{c.change}</span>
                                    {c.pct_change && <small className="font-normal opacity-80">({c.pct_change})</small>}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    <Minus size={13} />
                                    <span>0.00 (Unchanged)</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs">
                                <HelpCircle size={12} />
                                <span>Not comparable</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 leading-relaxed max-w-md">
                            {c.description}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

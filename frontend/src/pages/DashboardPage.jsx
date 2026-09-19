import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  GitCompare,
  Activity,
  Calendar,
  Building2,
  Eye,
  Download,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Stethoscope
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import VisualTrendChart from '../components/VisualTrendChart';
import { usersService, reportsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({
    welcome: `Welcome, ${user?.name || 'Patient'}`,
    total_reports: 0,
    total_tests_analyzed: 0,
    comparisons_count: 0,
    recent_reports: [],
  });
  const [fullReports, setFullReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await usersService.getDashboard();
      setData(res.data);

      // Fetch detailed report records for visual trend plotting
      const historyRes = await reportsService.getAll('desc');
      
      // Load detailed tests for up to 5 reports for graphing
      const loadedFull = await Promise.all(
        historyRes.data.slice(0, 5).map(async (r) => {
          try {
            const detail = await reportsService.getById(r.id);
            return detail.data;
          } catch {
            return r;
          }
        })
      );
      setFullReports(loadedFull);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      await reportsService.delete(id);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadPdf = async (id, filename) => {
    try {
      setActionLoadingId(id);
      const res = await reportsService.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `H2_Summary_${filename.replace(/\.[^/.]+$/, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF summary. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Patient Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {data.welcome}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review your medical reports, track parameter trends, and access AI explanations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all"
            >
              <Plus size={16} />
              <span>Upload New Report</span>
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <GitCompare size={16} />
              <span>Compare Reports</span>
            </Link>
          </div>
        </div>

        {/* Medical Safety Disclaimer Alert */}
        <MedicalDisclaimer compact />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded Reports</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? '...' : data.total_reports}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests Analyzed</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? '...' : data.total_tests_analyzed}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Activity size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comparisons Tracked</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? '...' : data.comparisons_count}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitCompare size={24} />
            </div>
          </div>
        </div>

        {/* Standout Feature: Visual Trend Chart */}
        {fullReports.length >= 2 && (
          <VisualTrendChart reports={fullReports} />
        )}

        {/* Recent Reports Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Reports</h3>
              <p className="text-xs text-slate-500">Your latest uploaded laboratory tests and analyses</p>
            </div>
            <Link
              to="/history"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
            >
              View Full History →
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <Loader2 size={28} className="animate-spin text-teal-600 mx-auto mb-2" />
              <p className="text-xs">Loading your report records...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs flex flex-col items-center gap-2">
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          ) : data.recent_reports.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">No medical reports uploaded yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first laboratory report (PDF, JPG, PNG) to get started with AI explanations.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow transition-all"
              >
                <UploadCloud size={15} />
                <span>Upload Report</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent_reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 hover:text-teal-700 transition-colors">
                        <Link to={`/report/${report.id}`}>{report.original_filename}</Link>
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {report.report_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-slate-400" />
                            Report Date: {report.report_date}
                          </span>
                        )}
                        {report.laboratory_name && (
                          <span className="flex items-center gap-1">
                            <Building2 size={13} className="text-slate-400" />
                            {report.laboratory_name}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {report.test_count || 0} tests detected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View, Compare, Download Summary, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      to={`/report/${report.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-colors"
                      title="View Report Analysis"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </Link>

                    <Link
                      to={`/compare?new=${report.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                      title="Compare with another report"
                    >
                      <GitCompare size={13} />
                      <span>Compare</span>
                    </Link>

                    <button
                      onClick={() => handleDownloadPdf(report.id, report.original_filename)}
                      disabled={actionLoadingId === report.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                      title="Download PDF Summary"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => handleDelete(report.id, report.original_filename)}
                      disabled={actionLoadingId === report.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      title="Delete Report"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

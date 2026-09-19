import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Building2,
  Eye,
  GitCompare,
  Download,
  Trash2,
  ArrowUpDown,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { reportsService } from '../services/api';

export default function ReportHistoryPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchReports = async (sort = sortOrder) => {
    try {
      setLoading(true);
      const res = await reportsService.getAll(sort);
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(sortOrder);
  }, [sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This will permanently remove all extracted tests and analysis.`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      await reportsService.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadPdf = async (id, filename) => {
    try {
      setActionLoadingId(id);
      const res = await reportsService.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const baseName = filename.replace(/\.[^/.]+$/, '');
      link.download = `H2_Summary_${baseName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Could not download the summary PDF.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.original_filename.toLowerCase().includes(q) ||
      (r.laboratory_name && r.laboratory_name.toLowerCase().includes(q)) ||
      (r.report_date && r.report_date.includes(q))
    );
  });

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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Document Archive
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Report History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse, search, compare, and manage all your uploaded medical test reports.
            </p>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all self-start sm:self-center"
          >
            <Plus size={16} />
            <span>Upload New Report</span>
          </Link>
        </div>

        <MedicalDisclaimer compact />

        {/* Filter and Sort Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by filename, lab, or date..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={toggleSortOrder}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ArrowUpDown size={14} />
              <span>Sorting: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>

        {/* Reports Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <Loader2 size={28} className="animate-spin text-teal-600 mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading report history...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs flex flex-col items-center gap-2">
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <FileText size={36} className="text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No medical reports found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery ? 'No results matched your search query.' : 'You have not uploaded any laboratory reports yet.'}
              </p>
              {!searchQuery && (
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow transition-all mt-2"
                >
                  <Plus size={14} />
                  <span>Upload First Report</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Report Name</th>
                    <th className="py-3.5 px-4">Report Date</th>
                    <th className="py-3.5 px-4">Laboratory / Facility</th>
                    <th className="py-3.5 px-4">Tests Detected</th>
                    <th className="py-3.5 px-4">Upload Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <Link to={`/report/${report.id}`} className="hover:text-teal-700 transition-colors flex items-center gap-2">
                          <FileText size={16} className="text-teal-600 shrink-0" />
                          <span>{report.original_filename}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {report.report_date || <span className="text-slate-400 italic">Not detected</span>}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {report.laboratory_name || <span className="text-slate-400 italic">Not detected</span>}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          {report.test_count || 0} tests
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {report.upload_date ? new Date(report.upload_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/report/${report.id}`}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors"
                            title="View Analysis"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            to={`/compare?new=${report.id}`}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                            title="Compare with another report"
                          >
                            <GitCompare size={15} />
                          </Link>
                          <button
                            onClick={() => handleDownloadPdf(report.id, report.original_filename)}
                            disabled={actionLoadingId === report.id}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                            title="Download PDF Summary"
                          >
                            <Download size={15} />
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

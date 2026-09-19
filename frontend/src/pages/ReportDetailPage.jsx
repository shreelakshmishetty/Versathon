import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Building2,
  Download,
  GitCompare,
  Sparkles,
  Search,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  Apple
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import StatusBadge from '../components/StatusBadge';
import VoiceNarrator from '../components/VoiceNarrator';
import DoctorQuestionsCard from '../components/DoctorQuestionsCard';
import LifestyleContextCard from '../components/LifestyleContextCard';
import LanguageSelector from '../components/LanguageSelector';
import { reportsService } from '../services/api';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportsService.getById(id);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load the requested report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await reportsService.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const baseName = report?.original_filename?.replace(/\.[^/.]+$/, '') || 'Report';
      link.download = `H2_Summary_${baseName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Could not download the summary PDF. Please check connection and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleReanalyze = async () => {
    try {
      setReanalyzing(true);
      const res = await reportsService.reanalyze(id);
      setReport(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Re-analysis failed.');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleLanguageChange = (langCode, langName) => {
    setCurrentLang(langCode);
    setIsTranslating(true);
    // Visual translation state simulated with smooth timeout
    setTimeout(() => {
      setIsTranslating(false);
    }, 600);
  };

  // Filter tests by search and status
  const filteredTests = (report?.tests || []).filter((t) => {
    const matchesSearch = t.test_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  // Calculate status summary stats
  const statusCounts = (report?.tests || []).reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { within_range: 0, below_range: 0, above_range: 0, unknown: 0 }
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link & Header Row */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>

          {/* Multilingual Selector */}
          <LanguageSelector
            currentLang={currentLang}
            onLanguageChange={handleLanguageChange}
            isTranslating={isTranslating}
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <Loader2 size={32} className="animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading medical report breakdown...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Report Unavailable</h3>
            <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card with Meta & Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      Medical Report Analysis
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID #{report.id}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {report.original_filename}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-teal-600" />
                      Report Date: <strong>{report.report_date || 'Not detected'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building2 size={14} className="text-teal-600" />
                      Facility: <strong>{report.laboratory_name || 'Not detected'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText size={14} className="text-teal-600" />
                      Detected Tests: <strong>{report.tests?.length || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
                  >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>{downloading ? 'Generating PDF...' : 'Download PDF Summary'}</span>
                  </button>

                  <Link
                    to={`/compare?new=${report.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm border border-indigo-200 transition-all"
                  >
                    <GitCompare size={16} />
                    <span>Compare with Earlier Report</span>
                  </Link>

                  <button
                    onClick={handleReanalyze}
                    disabled={reanalyzing}
                    className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all disabled:opacity-50"
                    title="Re-run AI analysis"
                  >
                    <RefreshCw size={15} className={reanalyzing ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Re-analyze</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Medical Disclaimer Banner */}
            <MedicalDisclaimer compact />

            {/* Voice Narration Audio Player (Standout Feature) */}
            <VoiceNarrator text={report.summary} title={report.original_filename} />

            {/* AI Overall Summary Card */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles size={140} />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={16} />
                  <span>AI Overall Report Summary</span>
                </div>
                <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
                  {report.summary}
                </p>

                {report.general_notes && report.general_notes.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 text-xs text-teal-200">
                    {report.general_notes.map((note, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 opacity-90">
                        <Info size={13} className="shrink-0" />
                        {note}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status Breakdown Bar & Search / View Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search test parameter by name (e.g. Hemoglobin)..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-end sm:self-center">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white text-teal-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={14} />
                    <span>Card View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-teal-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TableIcon size={14} />
                    <span>Table View</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({report.tests?.length || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('within_range')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                    statusFilter === 'within_range'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Within range ({statusCounts.within_range || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('below_range')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                    statusFilter === 'below_range'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Below range ({statusCounts.below_range || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('above_range')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                    statusFilter === 'above_range'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  Above range ({statusCounts.above_range || 0})
                </button>
                {statusCounts.unknown > 0 && (
                  <button
                    onClick={() => setStatusFilter('unknown')}
                    className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                      statusFilter === 'unknown'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Undetermined ({statusCounts.unknown || 0})
                  </button>
                )}
              </div>
            </div>

            {/* Test Results Display */}
            {filteredTests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                <FileText size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No test results matching your filter</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting "All".</p>
              </div>
            ) : viewMode === 'cards' ? (
              /* CARD VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTests.map((test, index) => (
                  <div
                    key={test.id || index}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-slate-900">{test.test_name}</h3>
                        <StatusBadge status={test.status} />
                      </div>

                      {/* Value & Reference Range Callout */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500 uppercase">Reported Value</div>
                          <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                            {test.value || 'Not detected'} <span className="text-xs font-normal text-slate-500">{test.unit || ''}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-semibold text-slate-500 uppercase">Reference Range</div>
                          <div className="text-xs font-bold text-slate-700 mt-1">
                            {test.reference_range || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      {/* Educational Plain-Language Explanation */}
                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-0.5">
                            What this test means
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {test.explanation || 'Educational summary based on reported laboratory value.'}
                          </p>
                        </div>

                        {test.important_note && (
                          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 text-xs text-amber-900 flex items-start gap-2">
                            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <span>{test.important_note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Test Parameter</th>
                        <th className="py-3.5 px-4">Reported Value</th>
                        <th className="py-3.5 px-4">Reference Range</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 max-w-md">Simple Educational Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTests.map((test, index) => (
                        <tr key={test.id || index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{test.test_name}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {test.value || 'N/A'} <span className="text-xs text-slate-500">{test.unit || ''}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{test.reference_range || 'Not provided'}</td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={test.status} />
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 leading-relaxed max-w-md">
                            <p>{test.explanation}</p>
                            {test.important_note && (
                              <p className="text-amber-800 text-[11px] mt-1 font-medium">{test.important_note}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Standout Feature 1: Doctor Discussion Prep Guide */}
            <DoctorQuestionsCard
              tests={report.tests}
              labName={report.laboratory_name}
              reportDate={report.report_date}
            />

            {/* Standout Feature 2: Lifestyle & General Wellness Context */}
            <LifestyleContextCard tests={report.tests} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

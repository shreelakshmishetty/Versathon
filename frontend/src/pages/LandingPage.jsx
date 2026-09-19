import { Link } from 'react-router-dom';
import { UploadCloud, FileText, Sparkles, GitCompare, Download, ShieldAlert, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-teal-800 to-slate-900 text-white py-20 lg:py-28">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold backdrop-blur">
                  <Sparkles size={14} className="text-teal-300" />
                  <span>AI-Powered Medical Report Comprehension</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                  What does my medical report <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">actually mean?</span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  Understand your laboratory reports in simple language with AI-assisted explanations. Decode complex clinical metrics, compare values to reported reference ranges, and track changes over time with complete clarity.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    to={isAuthenticated ? "/upload" : "/register"}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    <UploadCloud size={18} />
                    <span>Upload Report</span>
                  </Link>
                  {!isAuthenticated && (
                    <>
                      <Link
                        to="/login"
                        className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 backdrop-blur transition-all text-sm sm:text-base"
                      >
                        <span>Login</span>
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-950/60 hover:bg-teal-900 text-teal-200 font-semibold border border-teal-700/50 transition-all text-sm sm:text-base"
                      >
                        <span>Register</span>
                      </Link>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-6 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-teal-400" /> PDF & Image OCR</span>
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-teal-400" /> Reference Range Checking</span>
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-teal-400" /> Historical Trend Tracking</span>
                </div>
              </div>

              {/* Hero Interactive Card Preview */}
              <div className="lg:col-span-5">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4 text-slate-100">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                    <span className="font-semibold text-teal-300">Sample Report Analysis</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">CBC Panel</span>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Hemoglobin</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Within reported range
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">13.2</span>
                      <span className="text-xs text-slate-400">g/dL</span>
                      <span className="text-xs text-slate-400 ml-auto">Ref: 12.0 – 16.0 g/dL</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug pt-1">
                      Hemoglobin is the essential protein in red blood cells that transports oxygen from your lungs to your bodily tissues.
                    </p>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Fasting Blood Glucose</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Above reference range
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">108</span>
                      <span className="text-xs text-slate-400">mg/dL</span>
                      <span className="text-xs text-slate-400 ml-auto">Ref: 70 – 99 mg/dL</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug pt-1">
                      Your reported value is above the reference interval shown on this report. Discuss this result with your healthcare professional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Medical Disclaimer Box */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <MedicalDisclaimer />
        </div>

        {/* How It Works Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Workflow Overview</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How H2 Simplifies Your Lab Reports</h3>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Transforming complex medical documents into patient-friendly insights in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg mb-4 border border-teal-100">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Upload Report</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your digital PDF or scanned image (JPG, PNG, JPEG) of any laboratory report.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-lg mb-4 border border-cyan-100">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">OCR & Text Extraction</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-precision extraction engine reads tabular data, test parameters, units, and laboratory details.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-100">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">AI Plain-Language Analysis</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI translates jargon into clear educational explanations without making medical diagnoses.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4 border border-emerald-100">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Compare & Download</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track historical changes over time and export a structured ReportLab PDF summary.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-slate-100/70 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Platform Capabilities</h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Key Features of H2</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Simple Language Explanations</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every test result is explained in simple terms, describing what the parameter represents in the body without confusing medical terminology.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Reference Range Comparison</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Values are compared objectively against the reference intervals printed on your report, categorized with neutral status badges.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <GitCompare size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Historical Report Comparison</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Select an older and newer report to track numeric changes (+/- delta, percentage change) using neutral, objective language.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Download size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Downloadable PDF Summaries</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Generate and download clean, formatted PDF summaries with your account name, lab details, test tables, and safety disclaimers.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Multi-Format OCR Support</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Works seamlessly on digital PDFs, scanned documents, and phone camera photos (JPG, PNG, JPEG) with image preprocessing.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Strict Medical Safety</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Information-understanding tool only. Never makes clinical diagnoses, never prescribes medications, and protects your data per user.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 bg-gradient-to-r from-teal-800 to-slate-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="text-2xl sm:text-4xl font-extrabold mb-4">
              Ready to understand your medical test results?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Upload your medical laboratory report today for instant, clear, and reassuring AI-assisted explanations.
            </p>
            <Link
              to={isAuthenticated ? "/upload" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold shadow-xl transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

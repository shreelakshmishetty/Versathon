import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
  FileCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import LoadingProgress from '../components/LoadingProgress';
import { reportsService } from '../services/api';

const MAX_FILE_SIZE_MB = 15;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg'];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [uploadStep, setUploadStep] = useState(0); // 0: idle, 1: uploading, 2: extracting, 3: analyzing, 4: completed
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const validateAndSelectFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(selectedFile.type)) {
      setError(`Unsupported file format. Please upload a PDF, JPG, JPEG, or PNG document.`);
      return;
    }

    const sizeMb = selectedFile.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      setError(`File is too large (${sizeMb.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a medical report file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setError('');
    setUploadStep(1);
    setStatusMessage('Uploading medical report document...');

    try {
      // Step 1: Uploading
      const uploadTimer = setTimeout(() => {
        setUploadStep(2);
        setStatusMessage('Extracting document text & running high-accuracy OCR...');
      }, 1200);

      const aiTimer = setTimeout(() => {
        setUploadStep(3);
        setStatusMessage('AI analyzing test parameters, values, and reference ranges...');
      }, 2800);

      const response = await reportsService.upload(formData, (progress) => {
        setUploadProgress(progress);
      });

      clearTimeout(uploadTimer);
      clearTimeout(aiTimer);

      setUploadStep(4);
      setStatusMessage('Report analysis completed successfully!');
      setResult(response.data);
    } catch (err) {
      setUploadStep(0);
      setError(err.response?.data?.detail || err.message || 'Failed to process the uploaded report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            AI Medical Report Explainer
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Upload Your Medical Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload your laboratory blood test, lipid panel, metabolic profile, or general medical report.
          </p>
        </div>

        {/* Safety Disclaimer */}
        <MedicalDisclaimer compact />

        {/* Active Multi-stage Progress Stepper */}
        {uploadStep > 0 && (
          <LoadingProgress currentStep={uploadStep} statusMessage={statusMessage} />
        )}

        {/* Success Card */}
        {result ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-6 text-center my-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Analysis Complete!</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Successfully extracted <strong>{result.tests?.length || 0} test parameter(s)</strong> from "{result.original_filename}".
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span><strong>Report Date:</strong> {result.report_date || 'Not specified'}</span>
                <span><strong>Facility:</strong> {result.laboratory_name || 'Not detected'}</span>
              </div>
              <p className="text-slate-800 leading-relaxed pt-1 font-medium">
                {result.summary}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate(`/report/${result.id}`)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all"
              >
                <span>View Full Report Results</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setUploadStep(0);
                }}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
              >
                Upload Another Report
              </button>
            </div>
          </div>
        ) : (
          /* Upload Form Card */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm my-6">
            <form onSubmit={handleUpload} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-rose-700">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                    : file
                    ? 'border-teal-400 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => validateAndSelectFile(e.target.files?.[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
                      {file.type === 'application/pdf' || file.name.endsWith('.pdf') ? (
                        <FileCheck size={32} />
                      ) : (
                        <ImageIcon size={32} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{file.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold pt-1"
                    >
                      <X size={14} />
                      <span>Remove File</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                      <UploadCloud size={30} />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        Drag and drop your report here, or <span className="text-teal-600 underline">browse</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports PDF (digital or scanned), JPG, JPEG, and PNG up to 15 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Supported Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100">
                  <FileText size={13} className="text-teal-600" /> Digital PDF
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100">
                  <ImageIcon size={13} className="text-cyan-600" /> Scanned Document OCR
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Automatic Reference Range Detection
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!file || uploadStep > 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm sm:text-base shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UploadCloud size={18} />
                <span>{uploadStep > 0 ? 'Analyzing Report...' : 'Upload and Analyze Report'}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

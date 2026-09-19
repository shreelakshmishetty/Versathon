import { ShieldAlert } from 'lucide-react';

export default function MedicalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
        <ShieldAlert size={16} className="text-amber-600 shrink-0" />
        <span>
          <strong>Educational Tool:</strong> H2 explains report data in simple language. It does not diagnose diseases or prescribe medication. Consult a qualified healthcare professional.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-blue-50 border border-teal-200 rounded-xl p-5 my-6 shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-teal-600 text-white rounded-lg shadow-sm shrink-0">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-1 text-slate-700">
          <h4 className="text-sm font-bold text-teal-950 flex items-center gap-2">
            Important Medical & Safety Disclaimer
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This application provides AI-assisted explanations of information contained in uploaded medical reports. It is <strong>not a medical diagnosis</strong> and does not replace professional medical advice, consultation, or treatment. Always discuss your results with a licensed doctor or qualified healthcare provider before making any health or medication decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

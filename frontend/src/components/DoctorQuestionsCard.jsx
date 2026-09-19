import { useState } from 'react';
import { Stethoscope, Copy, Check, Printer, HelpCircle, ArrowRight } from 'lucide-react';

export default function DoctorQuestionsCard({ tests = [], labName = '', reportDate = '' }) {
  const [copied, setCopied] = useState(false);

  // Generate customized questions based on out-of-range test values
  const abnormalTests = tests.filter((t) => t.status === 'below_range' || t.status === 'above_range');

  const generatedQuestions = [];

  if (abnormalTests.length > 0) {
    abnormalTests.forEach((t) => {
      if (t.status === 'below_range') {
        generatedQuestions.push(`My ${t.test_name} result was reported at ${t.value} ${t.unit || ''} (below reference range). What factors or lifestyle habits might contribute to this?`);
      } else if (t.status === 'above_range') {
        generatedQuestions.push(`My ${t.test_name} result is ${t.value} ${t.unit || ''} (above reference range). Do you recommend repeating this test in a few weeks to monitor the trend?`);
      }
    });
  }

  // Add standard insightful medical discussion questions
  generatedQuestions.push("Are there any dietary adjustments, supplements, or hydration changes that would be appropriate for these results?");
  generatedQuestions.push("Should we schedule any follow-up blood work or additional diagnostic panels in 3–6 months?");
  generatedQuestions.push("Could any of my current medications or recent physical activity have influenced these specific test values?");

  const handleCopy = () => {
    const textToCopy = `Questions for My Doctor (Report: ${labName || 'Laboratory'} - ${reportDate || 'Recent'}):\n\n` +
      generatedQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-teal-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <Stethoscope size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Doctor Discussion Guide</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Prep Tool
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Personalized questions tailored to your results to bring to your next medical appointment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy Questions"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all"
          >
            <Printer size={14} />
            <span>Print Guide</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {generatedQuestions.map((question, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-teal-200 transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {question}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
        <HelpCircle size={13} className="text-teal-600 shrink-0" />
        <span>Tip: Doctors appreciate informed, prepared questions. Show this list during your consultation.</span>
      </div>
    </div>
  );
}

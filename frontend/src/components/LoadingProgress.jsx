import { UploadCloud, FileSearch, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoadingProgress({ currentStep = 1, statusMessage = '' }) {
  const steps = [
    { id: 1, label: 'Uploading Document', icon: UploadCloud, desc: 'Securely transmitting report file' },
    { id: 2, label: 'Extracting & OCR', icon: FileSearch, desc: 'Parsing digital text & running image OCR' },
    { id: 3, label: 'AI Report Analysis', icon: Sparkles, desc: 'Generating plain-language explanations' },
    { id: 4, label: 'Completed', icon: CheckCircle2, desc: 'Ready for review' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm my-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          let stepClass = 'border-slate-200 bg-slate-50/50 text-slate-400';
          let iconClass = 'bg-slate-200 text-slate-500';

          if (isDone) {
            stepClass = 'border-emerald-200 bg-emerald-50/50 text-emerald-900';
            iconClass = 'bg-emerald-600 text-white';
          } else if (isCurrent) {
            stepClass = 'border-teal-500 bg-teal-50/70 text-teal-950 ring-2 ring-teal-500/20';
            iconClass = 'bg-teal-600 text-white animate-pulse';
          }

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all ${stepClass}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${iconClass}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Step {step.id}
                </div>
                <div className="text-sm font-semibold">{step.label}</div>
                <div className="text-xs opacity-75 mt-0.5">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {statusMessage && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            {statusMessage}
          </span>
          <span className="font-medium text-teal-700">Please do not close this window</span>
        </div>
      )}
    </div>
  );
}

import { Activity, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                <Activity size={16} />
              </div>
              <span className="text-white font-bold text-lg">H2 Medical Explainer</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering individuals to understand their laboratory reports clearly through AI-assisted educational explanations.
            </p>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Safety & Compliance</h4>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-teal-400 shrink-0 mt-0.5" />
              <span>
                Non-diagnostic healthcare communication platform. Does not store unnecessary sensitive patient records. All reports are isolated per user.
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Supported Formats</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">PDF</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">JPG</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">JPEG</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">PNG</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 H2 Medical Report Explanation System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={13} className="text-rose-500 fill-rose-500" /> for healthcare accessibility
          </p>
        </div>
      </div>
    </footer>
  );
}

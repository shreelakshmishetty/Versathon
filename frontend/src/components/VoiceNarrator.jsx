import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';

export default function VoiceNarrator({ text, title = "Audio Summary" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [rate, setRate] = useState(1.0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const handlePlay = () => {
    if (!supported || !text) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!supported) return null;

  return (
    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-teal-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0">
          <Volume2 size={20} className={isPlaying ? "animate-pulse text-teal-200" : ""} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Voice Narration</span>
            {isPlaying && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                Playing
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-300">
            Listen to a clear spoken explanation of your report summary.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-center">
        {isPlaying ? (
          <button
            onClick={handlePause}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all"
          >
            <Pause size={14} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
          >
            <Play size={14} />
            <span>{isPaused ? "Resume Audio" : "Listen Aloud"}</span>
          </button>
        )}

        {(isPlaying || isPaused) && (
          <button
            onClick={handleStop}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
            title="Stop Audio"
          >
            <RotateCcw size={14} />
          </button>
        )}

        <select
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 outline-none"
        >
          <option value="0.8">0.8x Speed</option>
          <option value="1.0">1.0x Speed</option>
          <option value="1.2">1.2x Speed</option>
        </select>
      </div>
    </div>
  );
}

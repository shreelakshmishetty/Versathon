import { useState } from 'react';
import { Apple, Droplets, Moon, Activity, Info, ChevronRight } from 'lucide-react';

const WELLNESS_DATA = {
  hemoglobin: {
    title: "Hemoglobin & Red Blood Cells",
    icon: Droplets,
    badge: "Oxygen Transport",
    summary: "Hemoglobin is responsible for carrying oxygen throughout your body.",
    generalFactors: [
      "Dietary Iron: Leafy greens (spinach, kale), legumes (lentils, chickpeas), fortified cereals, and lean poultry.",
      "Vitamin C: Helps enhance the absorption of non-heme (plant-based) dietary iron.",
      "Hydration: Staying properly hydrated supports healthy blood volume and circulation.",
      "Rest: Adequate recovery allows the bone marrow to produce healthy red blood cells."
    ]
  },
  glucose: {
    title: "Blood Glucose & Energy Balance",
    icon: Activity,
    badge: "Metabolism",
    summary: "Blood glucose is the primary sugar your body uses for cellular energy.",
    generalFactors: [
      "Fiber Intake: Whole grains, oats, vegetables, and beans slow sugar absorption and help maintain steady energy.",
      "Regular Movement: A 15-minute post-meal walk stimulates muscular glucose uptake naturally.",
      "Sleep Quality: Consistent 7–8 hours of sleep supports healthy insulin sensitivity.",
      "Hydration: Water helps kidneys flush excess circulating sugars through urine."
    ]
  },
  cholesterol: {
    title: "Lipids & Heart Health",
    icon: Apple,
    badge: "Cardiovascular",
    summary: "Cholesterol is a waxy lipid essential for cell membranes and hormone production.",
    generalFactors: [
      "Heart-Healthy Fats: Extra virgin olive oil, avocados, walnuts, and flaxseeds provide unsaturated fatty acids.",
      "Soluble Fiber: Oats, barley, apples, and beans bind with cholesterol in the digestive system.",
      "Physical Activity: 150 minutes per week of moderate aerobic exercise supports HDL levels.",
      "Stress Management: Chronic stress can stimulate cortisol and lipid release."
    ]
  },
  creatinine: {
    title: "Kidney Function & Hydration",
    icon: Droplets,
    badge: "Filtration",
    summary: "Creatinine is a natural waste byproduct of normal muscle metabolism filtered by the kidneys.",
    generalFactors: [
      "Optimal Hydration: Drinking adequate water throughout the day helps kidneys filter waste effectively.",
      "Protein Moderation: High-dose protein powders or heavy red meat intake can temporarily elevate serum values.",
      "Medication Awareness: Avoid overuse of NSAID painkillers (like ibuprofen) without medical guidance."
    ]
  }
};

export default function LifestyleContextCard({ tests = [] }) {
  // Find which wellness topics match the tests in this report
  const relevantTopics = [];
  const testNames = tests.map(t => (t.test_name || '').toLowerCase());

  if (testNames.some(n => n.includes('hemo') || n.includes('rbc') || n.includes('iron'))) {
    relevantTopics.push('hemoglobin');
  }
  if (testNames.some(n => n.includes('gluc') || n.includes('sugar') || n.includes('hba1c'))) {
    relevantTopics.push('glucose');
  }
  if (testNames.some(n => n.includes('chol') || n.includes('lipid') || n.includes('triglyceride') || n.includes('hdl') || n.includes('ldl'))) {
    relevantTopics.push('cholesterol');
  }
  if (testNames.some(n => n.includes('creat') || n.includes('bun') || n.includes('urea') || n.includes('gfr') || n.includes('kidney'))) {
    relevantTopics.push('creatinine');
  }

  // If none matched, default to general overview
  if (relevantTopics.length === 0) {
    relevantTopics.push('hemoglobin', 'glucose');
  }

  const [activeTab, setActiveTab] = useState(relevantTopics[0]);
  const currentData = WELLNESS_DATA[activeTab] || WELLNESS_DATA['hemoglobin'];
  const Icon = currentData.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Apple size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Lifestyle & General Educational Context</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Educational
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              General evidence-based information regarding common dietary and lifestyle factors.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        {relevantTopics.map((key) => {
          const item = WELLNESS_DATA[key];
          const isSelected = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Active Content Box */}
      <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icon size={16} className="text-emerald-600" />
            <span>{currentData.title}</span>
          </h4>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            {currentData.badge}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {currentData.summary}
        </p>

        <div className="space-y-2 pt-2 border-t border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            General Supportive Habits:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentData.generalFactors.map((fact, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                <ChevronRight size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{fact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 italic">
        * Note: These are general educational wellness insights and do not substitute for personalized medical advice or prescription diets.
      </div>
    </div>
  );
}

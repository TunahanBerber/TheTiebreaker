import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scale, 
  ArrowRightLeft, 
  Target, 
  Loader2, 
  Sparkles, 
  History,
  Trash2,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AnalysisType, generateDecisionAnalysis, AnalysisResult } from "./services/geminiService";
import { cn } from "./lib/utils";

interface HistoryItem extends AnalysisResult {
  id: string;
  decision: string;
  type: AnalysisType;
  timestamp: number;
}

export default function App() {
  const [isPremium, setIsPremium] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [decision, setDecision] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedType, setSelectedType] = useState<AnalysisType>(AnalysisType.PROS_CONS);

  const FREE_LIMIT = 5;
  const HISTORY_LIMIT_FREE = 3;
  const HISTORY_LIMIT_PREMIUM = 20;

  const handleAnalyze = async () => {
    if (!decision.trim()) return;

    // Check limits for free users
    if (!isPremium && usageCount >= FREE_LIMIT) {
      alert("Ücretsiz 5 analiz sınırına ulaştınız. Sınırsız erişim için Premium'a yükseltin!");
      return;
    }

    // Check restricted modes for free users
    if (!isPremium && selectedType !== AnalysisType.PROS_CONS) {
      alert("Karşılaştırma Tablosu ve SWOT Analizi Premium özelliklerdir. Kilidi açmak için yükseltin!");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await generateDecisionAnalysis(decision, selectedType, isPremium);
      setResult(data);
      
      const newHistoryItem: HistoryItem = {
        ...data,
        id: crypto.randomUUID(),
        decision,
        type: selectedType,
        timestamp: Date.now(),
      };
      
      const limit = isPremium ? HISTORY_LIMIT_PREMIUM : HISTORY_LIMIT_FREE;
      setHistory(prev => [newHistoryItem, ...prev].slice(0, limit));
      setUsageCount(prev => prev + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `# ${result.title}\n\n${result.content}\n\n> ${result.summary}`;
    navigator.clipboard.writeText(text);
    alert("Analiz panoya kopyalandı!");
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Scale className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">The Tiebreaker</h1>
          </div>
          <div className="flex items-center gap-3">
            {!isPremium && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Ücretsiz: {usageCount}/{FREE_LIMIT}
                </span>
              </div>
            )}
            <button 
              onClick={() => setIsPremium(!isPremium)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                isPremium 
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              )}
            >
              {isPremium ? "★ Premium Aktif" : "Premium'a Yükselt"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Kararınız nedir?
            </label>
            <textarea
              className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none text-zinc-800 placeholder:text-zinc-400"
              placeholder="Örn: New York'a mı taşınmalıyım yoksa Londra'da mı kalmalıyım? veya Tesla Model 3 almalı mıyım?"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            />

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-zinc-900">
                  Analiz Türü
                </label>
                {!isPremium && (
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Premium kilitleri aktif</span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: AnalysisType.PROS_CONS, label: "Artılar & Eksiler", icon: Scale, desc: "Avantaj ve dezavantajların dengeli bir listesi.", premium: false },
                  { id: AnalysisType.COMPARISON, label: "Karşılaştırma Tablosu", icon: ArrowRightLeft, desc: "Seçeneklerinizin yan yana dökümü.", premium: true },
                  { id: AnalysisType.SWOT, label: "SWOT Analizi", icon: Target, desc: "Güçlü, zayıf yönler, fırsatlar ve tehditlere stratejik bakış.", premium: true },
                ].map((type) => {
                  const isLocked = !isPremium && type.premium;
                  return (
                    <button
                      key={type.id}
                      disabled={isLocked}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all text-left group relative",
                        selectedType === type.id
                          ? "bg-zinc-900 border-zinc-900 text-white shadow-md"
                          : isLocked 
                            ? "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
                            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      )}
                    >
                      <type.icon className={cn("w-5 h-5 mt-0.5", 
                        selectedType === type.id ? "text-zinc-300" : isLocked ? "text-zinc-200" : "text-zinc-400 group-hover:text-zinc-600"
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{type.label}</span>
                          {type.premium && (
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded",
                              selectedType === type.id ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                            )}>
                              Pro
                            </span>
                          )}
                        </div>
                        <div className={cn("text-xs mt-0.5", 
                          selectedType === type.id ? "text-zinc-400" : isLocked ? "text-zinc-200" : "text-zinc-400"
                        )}>
                          {type.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !decision.trim() || (!isPremium && usageCount >= FREE_LIMIT)}
              className="w-full mt-8 bg-zinc-900 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-zinc-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {isPremium ? "Analiz Oluştur" : `Analiz Et (${FREE_LIMIT - usageCount} kaldı)`}
                </>
              )}
            </button>
          </section>

          {/* History */}
          {history.length > 0 && (
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-zinc-900 font-semibold">
                  <History className="w-4 h-4" />
                  Geçmiş Kararlar
                  <span className="text-[10px] font-normal text-zinc-400 ml-1">
                    ({history.length}/{isPremium ? HISTORY_LIMIT_PREMIUM : HISTORY_LIMIT_FREE})
                  </span>
                </div>
                <button 
                  onClick={clearHistory}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setResult(item);
                      setDecision(item.decision);
                      setSelectedType(item.type);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all flex items-center justify-between group"
                  >
                    <div className="truncate pr-4">
                      <div className="text-sm font-medium text-zinc-900 truncate">{item.decision}</div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{item.type.replace('_', ' ')}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors flex-shrink-0" />
                  </button>
                ))}
                {!isPremium && history.length >= HISTORY_LIMIT_FREE && (
                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => setIsPremium(true)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors"
                    >
                      Daha fazla geçmiş için yükseltin
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[400px]"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-zinc-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-zinc-900 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-zinc-900">Bilgeye Danışılıyor</h3>
                  <p className="text-zinc-500 text-sm max-w-xs">
                    Sizin için seçenekleri tartıyor ve sonuçları analiz ediyoruz.
                  </p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Analiz Tamamlandı</span>
                    </div>
                    {isPremium && (
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors text-xs font-semibold"
                      >
                        <ArrowRightLeft className="w-3 h-3 rotate-90" />
                        Markdown Olarak Dışa Aktar
                      </button>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-zinc-900 mb-6 leading-tight">{result.title}</h2>
                  
                  <div className="markdown-body">
                    <ReactMarkdown>{result.content}</ReactMarkdown>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-2xl p-8 text-white shadow-xl shadow-zinc-200">
                  <div className="flex items-center gap-2 mb-3 text-zinc-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Karar (Özet)</span>
                  </div>
                  <p className="text-xl font-medium leading-relaxed italic">
                    "{result.summary}"
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-12 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[400px]"
              >
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center">
                  <Scale className="w-10 h-10 text-zinc-300" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-xl font-bold text-zinc-900">Düğümü çözmeye hazır mısınız?</h3>
                  <p className="text-zinc-500">
                    Soldaki alana kararınızı girin ve bir analiz stili seçin.
                    Yapay zekamız durumu her açıdan görmenize yardımcı olacaktır.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Artılar & Eksiler", "Karşılaştırma", "SWOT"].map(t => (
                    <span key={t} className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium border border-zinc-200">
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-8 border-t border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-zinc-400 text-xs font-medium">
            © {new Date().getFullYear()} The Tiebreaker. Gemini AI tarafından desteklenmektedir.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-400 hover:text-zinc-900 text-xs font-medium transition-colors">Gizlilik</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 text-xs font-medium transition-colors">Şartlar</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 text-xs font-medium transition-colors">Geri Bildirim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

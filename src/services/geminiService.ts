import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export enum AnalysisType {
  PROS_CONS = "PROS_CONS",
  COMPARISON = "COMPARISON",
  SWOT = "SWOT",
}

export interface AnalysisResult {
  title: string;
  content: string;
  summary: string;
}

export async function generateDecisionAnalysis(
  decision: string,
  type: AnalysisType,
  isPremium: boolean = false
): Promise<AnalysisResult> {
  // Use a more capable model for premium users if desired, 
  // though gemini-3-flash-preview is already excellent.
  const model = isPremium ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";

  let systemInstruction = "";
  let prompt = "";

  switch (type) {
    case AnalysisType.PROS_CONS:
      systemInstruction = "Mantıklı bir karar verme asistanısın. Verilen karar için detaylı bir Artı ve Eksi listesi sun. Objektif ve kapsamlı ol. Yanıtını Türkçe ver.";
      prompt = `Şu kararı analiz et: "${decision}". Artıları ve Eksileri listeleyerek kısa bir özet sun.`;
      break;
    case AnalysisType.COMPARISON:
      systemInstruction = "Karşılaştırma uzmanısın. Kararda sunulan seçenekler için detaylı bir karşılaştırma tablosu (Markdown formatında) oluştur. Sadece bir seçenek sunulmuşsa, onu mevcut durumla veya yaygın bir alternatifle karşılaştır. Yanıtını Türkçe ver.";
      prompt = `Bu karardaki seçenekleri karşılaştır: "${decision}". Karşılaştırma için bir Markdown tablosu kullan ve kısa bir özet sun.`;
      break;
    case AnalysisType.SWOT:
      systemInstruction = "Stratejik bir analistsin. Verilen karar veya proje için bir SWOT (Güçlü Yönler, Zayıf Yönler, Fırsatlar, Tehditler) analizi yap. Yanıtını Türkçe ver.";
      prompt = `Şunun için bir SWOT analizi yap: "${decision}". Her bölüm için Markdown başlıkları kullan ve kısa bir özet sun.`;
      break;
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Analiz başlığı" },
          content: { type: Type.STRING, description: "Markdown formatında ana analiz içeriği" },
          summary: { type: Type.STRING, description: "Tek cümlelik öneri veya özet" },
        },
        required: ["title", "content", "summary"],
      },
    },
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return {
      title: result.title || "Karar Analizi",
      content: result.content || "İçerik oluşturulamadı.",
      summary: result.summary || "Özet mevcut değil.",
    };
  } catch (e) {
    console.error("Yapay zeka yanıtı ayrıştırılamadı", e);
    return {
      title: "Analiz Hatası",
      content: "Maalesef analiz oluşturulamadı. Lütfen tekrar deneyin.",
      summary: "Hata oluştu.",
    };
  }
}

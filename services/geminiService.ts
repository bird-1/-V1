
import { GoogleGenAI, Type } from "@google/genai";
import { ANALYSIS_PROMPT, SYLLABUS } from "../constants";
import { AnalysisResult, FileData } from "../types";

export class GeminiService {
  async analyzeQuestions(files: FileData[]): Promise<AnalysisResult> {
    // 严格遵循规范：直接使用环境预设的 API_KEY，无需用户干预
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY 缺失。请确保您的运行环境已自动配置该密钥。");
    }

    const ai = new GoogleGenAI({ apiKey });
    const syllabusStr = JSON.stringify(SYLLABUS, null, 2);
    const prompt = ANALYSIS_PROMPT(syllabusStr);

    const fileParts = files.map(file => ({
      inlineData: {
        mimeType: file.type,
        data: file.base64.split(',')[1]
      }
    }));

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ 
          parts: [
            ...fileParts, 
            { text: prompt }
          ] 
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topicScores: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topicId: { type: Type.STRING },
                    score: { type: Type.NUMBER }
                  },
                  required: ["topicId", "score"]
                }
              },
              missingTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topicId: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    suggestion: { type: Type.STRING }
                  },
                  required: ["topicId", "reason", "suggestion"]
                }
              },
              overallScore: { type: Type.NUMBER },
              aiCommentary: { type: Type.STRING },
              questionCount: { type: Type.NUMBER }
            },
            required: ["topicScores", "missingTopics", "overallScore", "aiCommentary", "questionCount"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("AI 分析报告生成失败。");

      return JSON.parse(text);
    } catch (e: any) {
      console.error("Gemini SDK Analysis Error:", e);
      throw e;
    }
  }
}

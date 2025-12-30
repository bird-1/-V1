
import { GoogleGenAI, Type } from "@google/genai";
import { ANALYSIS_PROMPT, SYLLABUS } from "../constants";
import { AnalysisResult, FileData } from "../types";

export class GeminiService {
  async analyzeQuestions(files: FileData[]): Promise<AnalysisResult> {
    // 每次分析前重新获取环境变量中的最新 API Key
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("未检测到 API Key。请点击左侧控制台重新选择 Key。");
    }

    // 重新实例化以确保使用对话框中最新的 Key
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
      if (!text) throw new Error("AI 分析报告生成失败，返回数据为空。");

      return JSON.parse(text);
    } catch (e: any) {
      console.error("Gemini SDK Analysis Error:", e);
      throw e; // 抛出错误由 App.tsx 统一处理逻辑（如重置 Key 状态）
    }
  }
}

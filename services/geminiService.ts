
import { GoogleGenAI, Type } from "@google/genai";
import { ANALYSIS_PROMPT, SYLLABUS } from "../constants";
import { AnalysisResult, FileData } from "../types";

export class GeminiService {
  async analyzeQuestions(files: FileData[]): Promise<AnalysisResult> {
    // 优先尝试从系统环境变量获取 API_KEY
    let apiKey = '';
    try {
      // 这里的 process.env.API_KEY 是由 AI Studio 环境自动注入的
      apiKey = (typeof process !== 'undefined' && process.env.API_KEY) ? process.env.API_KEY : '';
    } catch (e) {
      console.warn("环境变量访问受限");
    }
    
    if (!apiKey) {
      throw new Error("未检测到 API Key。请确保您在 AI Studio 或相关运行环境中已获得访问授权。");
    }

    // 每次分析动态创建实例，确保使用最新的环境上下文
    const ai = new GoogleGenAI({ apiKey });
    const syllabusStr = JSON.stringify(SYLLABUS, null, 2);
    const prompt = ANALYSIS_PROMPT(syllabusStr);

    // 将上传的多个文件（PDF 或图片）转换为 AI 支持的 inlineData 格式
    const fileParts = files.map(file => ({
      inlineData: {
        mimeType: file.type,
        data: file.base64.split(',')[1]
      }
    }));

    try {
      // 使用 gemini-3-flash-preview。
      // 在预览环境中，Flash 模型往往不需要用户通过 openSelectKey() 显式授权付费项目即可运行。
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      if (!text) throw new Error("AI 分析模块未返回有效内容。");

      return JSON.parse(text);
    } catch (e: any) {
      console.error("Gemini API 执行异常:", e);
      // 优化错误透传，方便本地调试排查
      if (e.message?.includes('403') || e.message?.includes('API key not valid')) {
        throw new Error("API Key 权限受限或已失效。请检查 AI Studio 的 Key 设置状态。");
      }
      throw e;
    }
  }
}

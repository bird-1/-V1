
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import { FileData, AnalysisResult } from './types';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // 检查是否已经选择了 API Key (Gemini 3 系列模型强制要求)
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // 根据规范，触发后直接假设成功并进入应用
      setHasApiKey(true);
      setError(null);
    }
  };

  const handleFilesAdded = (newFiles: FileData[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const runAnalysis = async () => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const gemini = new GeminiService();
      const result = await gemini.analyzeQuestions(files);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      
      let msg = err.message || '分析失败：未知错误。';
      
      // 处理特定的权限或失效错误
      if (msg.includes('Requested entity was not found') || msg.includes('API key not valid')) {
        msg = '当前 API Key 无效或不具备 Gemini 3 Pro 访问权限。请重新选择具有付费账单的 GCP 项目 Key。';
        setHasApiKey(false); // 强制重新选择
      } else if (msg.includes('403')) {
        msg = '权限拒绝 (403)。请检查您的 API Key 是否已启用 Generative Language API。';
      }
      
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-key text-blue-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">需要配置 API Key</h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            由于本系统使用 <b>Gemini 3 Pro</b> 深度推理模型进行数学题目分析，您需要选择一个已关联付费账单项目的 API Key。
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 mb-4"
          >
            选择 API Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline flex items-center justify-center gap-1"
          >
            了解如何设置付费账单 <i className="fas fa-external-link-alt scale-75"></i>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 左侧控制栏 */}
          <div className="lg:col-span-4 space-y-6">
            <FileUpload 
              onFilesAdded={handleFilesAdded} 
              files={files} 
              onRemoveFile={handleRemoveFile}
              isLoading={isAnalyzing}
            />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <i className="fas fa-terminal text-blue-600"></i>
                 分析控制台
               </h3>
               <button 
                onClick={runAnalysis}
                disabled={files.length === 0 || isAnalyzing}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all 
                  ${files.length === 0 || isAnalyzing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg active:scale-95'}`}
              >
                {isAnalyzing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    AI 正在诊断题目...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search-plus"></i>
                    生成深度遗漏报告
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
               <div className="relative z-10">
                 <h4 className="font-bold text-sm mb-2 text-blue-400">苏教版同步 2024</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   系统已载入四年级上册所有必考知识点。AI 会逐一对比题目描述与考纲细则。
                 </p>
               </div>
               <i className="fas fa-book absolute -right-4 -bottom-4 text-7xl text-slate-800 opacity-40"></i>
            </div>
          </div>

          {/* 右侧主展示区 */}
          <div className="lg:col-span-8">
            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-700 px-6 py-5 rounded-2xl mb-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 font-bold text-red-800">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>分析中断</span>
                </div>
                <p className="text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {!isAnalyzing && !analysisResult && !error && (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                <i className="fas fa-upload text-slate-200 text-5xl mb-6"></i>
                <h2 className="text-xl font-bold text-slate-700 mb-2">等待上传题目</h2>
                <p className="text-slate-400 text-sm max-w-xs">上传学生练习卷或题目合集，我们将为您分析苏教版考点的覆盖情况。</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">正在研读试卷内容</h2>
                <p className="text-slate-400 text-sm animate-pulse">正在提取题目特征并对标苏教版大纲...</p>
              </div>
            )}

            {analysisResult && <AnalysisDashboard result={analysisResult} />}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 text-center">
        <p className="text-slate-400 text-xs">© 2024 苏教版数学遗漏分析系统 · 旗舰版</p>
      </footer>
    </div>
  );
};

export default App;


import React from 'react';
import { AnalysisResult } from '../types';
import { SYLLABUS } from '../constants';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface AnalysisDashboardProps {
  result: AnalysisResult;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result }) => {
  // 构建雷达图数据，确保所有单元都有数据点
  const chartData = SYLLABUS.map(unit => {
    const scoreObj = result.topicScores.find(s => s.topicId === unit.id);
    return {
      subject: unit.title,
      score: scoreObj ? scoreObj.score : 0,
      fullMark: 100
    };
  });

  const getTopicTitle = (id: string) => SYLLABUS.find(t => t.id === id)?.title || id;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 综合得分卡片 */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[340px]">
          
          <div className="relative z-10 flex flex-col items-center justify-center py-4">
             <div className="flex flex-col items-center">
                <span className="text-7xl font-black text-slate-800 tracking-tighter leading-none">
                  {result.overallScore}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-px w-8 bg-slate-200"></div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Score</span>
                  <div className="h-px w-8 bg-slate-200"></div>
                </div>
             </div>
          </div>
          
          <div className="mt-4 mb-6 text-center">
            <h3 className="text-lg font-bold text-slate-800">综合覆盖评分</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">对标苏教版 4A 数学大纲标准</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">识别题目</p>
              <p className="text-lg font-black text-blue-600">{result.questionCount}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">达标单元</p>
              <p className="text-lg font-black text-green-600">
                {result.topicScores.filter(s => s.score >= 60).length}/{SYLLABUS.length}
              </p>
            </div>
          </div>
        </div>

        {/* 知识点覆盖雷达图 */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-spider text-blue-500"></i>
              单元覆盖权重雷达
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-[10px] text-slate-500 font-bold">考点深度</span>
              </div>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={false} 
                  axisLine={false} 
                />
                <Radar 
                  name="覆盖评分" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fill="#3b82f6" 
                  fillOpacity={0.15} 
                  animationDuration={1500}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 遗漏清单 */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-bold text-red-600 flex items-center gap-2">
              <i className="fas fa-layer-group"></i>
              待补充知识点
            </h3>
            <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg uppercase">
              Priority: High
            </span>
          </div>
          
          <div className="space-y-4">
            {result.missingTopics.length > 0 ? (
              result.missingTopics.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    <h4 className="font-bold text-slate-800 text-sm">{getTopicTitle(item.topicId)}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    <span className="font-bold text-slate-400 mr-1 italic">Reason:</span>
                    {item.reason}
                  </p>
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-red-50 shadow-sm">
                    <div className="bg-amber-100 p-1.5 rounded-lg">
                      <i className="fas fa-lightbulb text-amber-600 text-[10px]"></i>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium leading-relaxed italic">{item.suggestion}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-green-50/30 rounded-3xl border border-dashed border-green-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check text-green-600 text-2xl"></i>
                </div>
                <p className="text-slate-600 font-bold">知识点覆盖完整</p>
                <p className="text-[10px] text-slate-400 mt-1">当前资料已完美闭环所有核心考点</p>
              </div>
            )}
          </div>
        </div>

        {/* AI 点评与复习视图 */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-brain text-indigo-500"></i>
            教研员深度点评
          </h3>
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic relative">
             <i className="fas fa-quote-left absolute -top-3 -left-1 text-2xl text-indigo-200"></i>
             {result.aiCommentary}
          </div>
          
          <div className="mt-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">全册考点对标详情</h4>
            <div className="space-y-2">
              {SYLLABUS.map(topic => {
                const topicScore = result.topicScores.find(s => s.topicId === topic.id)?.score || 0;
                return (
                  <div key={topic.id} className="group p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-700 font-bold">{topic.title}</span>
                      <span className={`text-[10px] font-black ${topicScore >= 80 ? 'text-green-600' : topicScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {topicScore}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${topicScore >= 80 ? 'bg-green-500' : topicScore >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${topicScore}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;

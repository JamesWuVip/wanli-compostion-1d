// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Badge } from '@/components/ui';

export function ScoreDisplay({
  score,
  grade
}) {
  const getScoreColor = score => {
    if (score >= 90) return 'bg-green-500 hover:bg-green-600';
    if (score >= 80) return 'bg-blue-500 hover:bg-blue-600';
    if (score >= 70) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-red-500 hover:bg-red-600';
  };
  const getGradeText = score => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '待提高';
  };
  return <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
      <div className="text-6xl font-bold text-gray-800 mb-2">{score || 0}</div>
      <Badge className={`text-lg px-4 py-2 ${getScoreColor(score)}`}>
        {getGradeText(score)}
      </Badge>
      <p className="text-sm text-gray-600 mt-2">{grade || getGradeText(score)}</p>
    </div>;
}
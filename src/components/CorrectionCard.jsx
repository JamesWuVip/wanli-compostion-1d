// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
// @ts-ignore;
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function CorrectionCard({
  type,
  title,
  content,
  suggestions
}) {
  const getTypeConfig = type => {
    switch (type) {
      case 'error':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          color: 'text-red-600',
          bg: 'bg-red-50'
        };
      case 'warning':
        return {
          icon: <Info className="w-5 h-5 text-yellow-500" />,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50'
        };
      case 'good':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          color: 'text-green-600',
          bg: 'bg-green-50'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        };
    }
  };
  const config = getTypeConfig(type);
  return <Card className={`${config.bg} border-0`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {config.icon}
          <CardTitle className={`text-lg ${config.color}`}>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">{content}</p>
        {suggestions && suggestions.length > 0 && <div>
            <p className="text-sm font-medium text-gray-600 mb-2">改进建议：</p>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {suggestion}
                </li>)}
            </ul>
          </div>}
      </CardContent>
    </Card>;
}
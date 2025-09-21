// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { Star, Download, Share2, ArrowLeft, Loader2, Heart, RotateCcw } from 'lucide-react';

// @ts-ignore;
import { dataService } from '@/lib/dataService';
// @ts-ignore;
import { ErrorHandler } from '@/components/ErrorHandler';
// @ts-ignore;
import { ScoreDisplay } from '@/components/ScoreDisplay';
// @ts-ignore;
import { CorrectionCard } from '@/components/CorrectionCard';
export default function Result(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [corrections, setCorrections] = useState([]);
  useEffect(() => {
    loadRecord();
  }, []);
  const loadRecord = async () => {
    try {
      const recordId = props.$w.page.dataset.params.recordId;
      if (!recordId) {
        toast({
          title: '错误',
          description: '未找到批改记录',
          variant: 'destructive'
        });
        return;
      }
      const result = await dataService.essayRecords.getRecordDetail(recordId, $w);
      if (result) {
        setRecord(result);
        setIsFavorite(result.is_favorite || false);

        // 模拟批改数据（实际项目中应从AI服务获取）
        setCorrections([{
          type: 'good',
          title: '内容完整',
          content: '作文内容完整，有条理地描述了去公园游玩的经历。',
          suggestions: ['继续保持这种清晰的叙述方式']
        }, {
          type: 'warning',
          title: '词汇运用',
          content: '可以运用更多生动的形容词来丰富描写。',
          suggestions: ['尝试使用"绚丽多彩"代替"美丽"', '可以用"欢快跳跃"形容小松鼠']
        }, {
          type: 'error',
          title: '标点符号',
          content: '部分句子缺少必要的标点符号。',
          suggestions: ['注意句末使用句号', '列举时正确使用逗号']
        }, {
          type: 'good',
          title: '情感表达',
          content: '结尾表达了快乐的情感，升华了主题。',
          suggestions: ['情感真挚，继续保持']
        }]);
      }
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    } finally {
      setLoading(false);
    }
  };
  const handleFavorite = async () => {
    try {
      const newFavorite = !isFavorite;
      await dataService.essayRecords.updateRecord(record._id, {
        is_favorite: newFavorite
      }, $w);
      setIsFavorite(newFavorite);
      toast({
        title: newFavorite ? '已收藏' : '已取消收藏',
        duration: 2000
      });
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    }
  };
  const handleBack = () => {
    $w.utils.navigateBack();
  };
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `作文批改结果 - ${record?.title || '我的作文'}`,
        text: `我的作文获得了${record?.score || 0}分，快来看看吧！`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: '分享',
        description: '链接已复制到剪贴板',
        duration: 2000
      });
    }
  };
  const handleRetry = () => {
    $w.utils.navigateTo({
      pageId: 'camera'
    });
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>;
  }
  if (!record) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未找到批改记录</p>
          <Button onClick={handleBack}>返回</Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={handleFavorite} className={isFavorite ? 'text-red-500' : 'text-gray-500'}>
              <Heart className={`w-4 h-4 mr-1 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? '已收藏' : '收藏'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              分享
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRetry}>
              <RotateCcw className="w-4 h-4 mr-1" />
              继续批改
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 作文信息卡片 */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{record.title || '作文批改结果'}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">批改时间：{new Date(record.createdAt).toLocaleString()}</p>
                </div>
                <ScoreDisplay score={record.score || 85} grade={record.grade} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">原文内容：</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{record.original_text || record.ocr_text}</p>
              </div>
            </CardContent>
          </Card>

          {/* 批改建议 */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">批改建议</h3>
            <div className="space-y-4">
              {corrections.map((correction, index) => <CorrectionCard key={index} {...correction} />)}
            </div>
          </div>

          {/* 综合评语 */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">综合评语</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                这篇作文内容充实，结构清晰，能够生动地描述公园游玩的经历。建议在词汇运用上更加丰富，
                注意标点符号的正确使用。继续保持这种积极向上的写作态度，相信你会写得越来越好！
              </p>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-center space-x-4">
            <Button onClick={handleBack} variant="outline">
              返回列表
            </Button>
            <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
              继续批改新作文
            </Button>
          </div>
          </div>
      </div>
    </div>;
}
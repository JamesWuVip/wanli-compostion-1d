// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Heart, Share2, Download, Printer, RotateCcw } from 'lucide-react';

// @ts-ignore;
import { dataService } from '@/lib/dataService';
// @ts-ignore;
import { ErrorHandler } from '@/components/ErrorHandler';
// @ts-ignore;
import { ScoreDisplay } from '@/components/ScoreDisplay';
// @ts-ignore;
import { CorrectionCard } from '@/components/CorrectionCard';
export default function HistoryDetail(props) {
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
          description: '未找到记录ID',
          variant: 'destructive'
        });
        return;
      }
      const result = await dataService.essayRecords.getRecordDetail(recordId, $w);
      if (result) {
        setRecord(result);
        setIsFavorite(result.is_favorite || false);

        // 模拟批改数据
        setCorrections([{
          type: 'good',
          title: '内容完整',
          content: '作文内容完整，有条理地描述了事件经过。',
          suggestions: ['继续保持这种清晰的叙述方式']
        }, {
          type: 'warning',
          title: '词汇运用',
          content: '可以运用更多生动的形容词来丰富描写。',
          suggestions: ['尝试使用更具体的词汇', '增加感官描写的词汇']
        }, {
          type: 'error',
          title: '标点符号',
          content: '部分句子缺少必要的标点符号。',
          suggestions: ['注意句末使用句号', '列举时正确使用逗号']
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
        text: `我的作文《${record?.title || '我的作文'}》获得了${record?.score || 0}分，快来看看吧！`,
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
  const handlePrint = () => {
    window.print();
  };
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>;
  }
  if (!record) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未找到记录</p>
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
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              打印
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 作文信息 */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{record.title || '作文详情'}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">批改时间：{formatDate(record.createdAt)}</p>
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

          {/* 详细批改 */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">详细批改</h3>
            <div className="space-y-4">
              {corrections.map((correction, index) => <CorrectionCard key={index} {...correction} />)}
            </div>
          </div>

          {/* 综合评语 */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">老师评语</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                这篇作文展现了良好的观察力和表达能力。内容具体生动，情感真挚，能够引起读者共鸣。
                建议在今后的写作中注意细节描写，让文章更加丰富多彩。继续保持这种积极向上的写作态度！
              </p>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-center space-x-4">
            <Button onClick={handleBack} variant="outline">
              返回列表
            </Button>
            <Button onClick={() => $w.utils.navigateTo({
            pageId: 'camera'
          })} className="bg-blue-600 hover:bg-blue-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              继续批改
            </Button>
          </div>
        </div>
      </div>
    </div>;
}
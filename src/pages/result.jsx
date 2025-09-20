// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Download, Share2, Save } from 'lucide-react';

export default function Result(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = localStorage.getItem('userId');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const originalText = $w.page.dataset.params?.text;
  const image = $w.page.dataset.params?.image;
  useEffect(() => {
    if (!originalText) {
      $w.utils.navigateBack();
      return;
    }
    processEssay();
  }, []);
  const processEssay = async () => {
    try {
      setLoading(true);
      // 模拟AI批改
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResult = {
        title: '我的快乐一天',
        original_text: originalText,
        annotated_text: originalText.replace('今天天气真好', '<span class="text-red-500 underline">今天天气真好</span><span class="text-blue-500 text-sm">（可以改为：今天阳光明媚）</span>'),
        score: 85,
        grade: '良好',
        feedback: '这篇作文写得很好！能够清楚地描述一天的活动，语言生动形象。建议：1. 可以增加更多细节描写；2. 注意标点符号的使用；3. 结尾可以更有深度。',
        corrections: [{
          original: '我和妈妈一起去公园玩',
          corrected: '我和妈妈一同前往公园游玩',
          type: '表达优化'
        }, {
          original: '真漂亮',
          corrected: '绚丽多彩',
          type: '词汇提升'
        }]
      };
      setResult(mockResult);
    } catch (error) {
      toast({
        title: '批改失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!result || !userId) return;
    setSaving(true);
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: userId,
            title: result.title,
            original_text: result.original_text,
            annotated_text: result.annotated_text,
            score: result.score,
            grade: result.grade,
            feedback: result.feedback,
            image_url: image || '',
            search_text: result.original_text.substring(0, 100),
            is_favorite: false
          }
        }
      });
      toast({
        title: '保存成功'
      });
    } catch (error) {
      toast({
        title: '保存失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/history_detail?recordId=mock&shared=true`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: '分享链接已复制'
    });
  };
  const handleExport = () => {
    if (!result) return;
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>${result.title} - 作文批改结果</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .score-badge {
              display: inline-block;
              padding: 8px 16px;
              background: #007bff;
              color: white;
              border-radius: 20px;
              font-weight: bold;
            }
            .section { 
              margin-bottom: 30px; 
            }
            .correction-item {
              background: #f8f9fa;
              padding: 15px;
              margin: 10px 0;
              border-left: 4px solid #007bff;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>作文批改结果</h1>
            <div class="score-badge">${result.score}分 (${result.grade})</div>
          </div>
          
          <div class="section">
            <h2>原文</h2>
            <div>${result.original_text}</div>
          </div>
          
          <div class="section">
            <h2>批改建议</h2>
            <div>${result.annotated_text}</div>
          </div>
          
          <div class="section">
            <h2>评语</h2>
            <div>${result.feedback}</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">AI正在批改中，请稍候...</div>
      </div>;
  }
  if (!result) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">获取结果失败</div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">批改结果</h1>
            <Button variant="ghost" onClick={() => $w.utils.navigateBack()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{result.title}</CardTitle>
                <Badge className="text-lg px-4 py-2">
                  {result.score}分 ({result.grade})
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">原文</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {result.original_text}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">批改建议</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div dangerouslySetInnerHTML={{
                    __html: result.annotated_text
                  }} />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">评语</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    {result.feedback}
                  </div>
                </div>
                
                {result.corrections && result.corrections.length > 0 && <div>
                    <h3 className="font-semibold mb-2">具体修改</h3>
                    <div className="space-y-2">
                      {result.corrections.map((correction, index) => <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <p className="text-sm text-gray-600">
                            <span className="line-through">{correction.original}</span> → {correction.corrected}
                          </p>
                          <p className="text-xs text-blue-600">{correction.type}</p>
                        </div>)}
                    </div>
                  </div>}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleSave} disabled={saving} className="bg-green-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存记录'}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </div>
      </div>
    </div>;
}
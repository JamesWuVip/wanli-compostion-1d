// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Download, Share2, Save, CheckCircle, AlertCircle, Info } from 'lucide-react';

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
  const correctionResult = $w.page.dataset.params?.correctionResult;
  useEffect(() => {
    if (!originalText) {
      $w.utils.navigateBack();
      return;
    }
    loadCorrectionResult();
  }, []);
  const loadCorrectionResult = async () => {
    try {
      setLoading(true);

      // 如果从ocr_confirm页面传递了批改结果，直接使用
      if (correctionResult) {
        setResult(correctionResult);
        return;
      }

      // 否则调用作文批改API
      const apiResult = await $w.cloud.callFunction({
        name: 'essayCorrection',
        data: {
          essayText: originalText,
          image: image
        }
      });
      if (apiResult.success && apiResult.correctionResult) {
        setResult(apiResult.correctionResult);
      } else {
        throw new Error(apiResult.error || '作文批改失败');
      }
    } catch (error) {
      console.error('作文批改错误:', error);
      toast({
        title: '批改失败',
        description: error.message || '请检查网络连接后重试',
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
            title: result.title || '作文批改',
            original_text: originalText,
            search_text: originalText.substring(0, 100),
            ocr_text: originalText,
            score: result.score || 0,
            grade: result.grade || '待评定',
            is_favorite: false,
            annotated_text: result.annotated_text || [],
            errors: result.errors || [],
            positives: result.positives || [],
            optimizations: result.optimizations || [],
            feedback: result.feedback || {},
            image_url: image || ''
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
    const shareUrl = `${window.location.origin}/history_detail?recordId=${result.id || 'mock'}&shared=true`;
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
          <title>${result.title || '作文批改结果'} - 作文批改结果</title>
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
            .error-item {
              background: #fff5f5;
              border-left-color: #dc3545;
            }
            .positive-item {
              background: #f0fff4;
              border-left-color: #28a745;
            }
            .optimization-item {
              background: #fff3cd;
              border-left-color: #ffc107;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>作文批改结果</h1>
            <div class="score-badge">${result.score || 0}分 (${result.grade || '待评定'})</div>
          </div>
          
          <div class="section">
            <h2>原文</h2>
            <div>${originalText}</div>
          </div>
          
          ${result.annotated_text && result.annotated_text.length > 0 ? `
          <div class="section">
            <h2>批改标注</h2>
            ${result.annotated_text.map(annotation => `
              <div class="correction-item">
                <strong>${annotation.type || '标注'}:</strong> ${annotation.content || ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${result.errors && result.errors.length > 0 ? `
          <div class="section">
            <h2>错别字</h2>
            ${result.errors.map(error => `
              <div class="correction-item error-item">
                <strong>错误:</strong> ${error.original || ''} → <strong>正确:</strong> ${error.corrected || ''}
                <br><small>说明: ${error.explanation || ''}</small>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${result.positives && result.positives.length > 0 ? `
          <div class="section">
            <h2>优点</h2>
            ${result.positives.map(positive => `
              <div class="correction-item positive-item">
                <strong>${positive.type || '优点'}:</strong> ${positive.content || ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${result.optimizations && result.optimizations.length > 0 ? `
          <div class="section">
            <h2>优化建议</h2>
            ${result.optimizations.map(optimization => `
              <div class="correction-item optimization-item">
                <strong>${optimization.type || '建议'}:</strong> ${optimization.content || ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${result.feedback ? `
          <div class="section">
            <h2>总体评价</h2>
            <div class="correction-item">
              <strong>总体评分:</strong> ${result.feedback.score || result.score || 0}分
              <br><strong>评价:</strong> ${result.feedback.content || ''}
            </div>
          </div>
          ` : ''}
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };
  const getScoreColor = score => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">AI正在批改中，请稍候...</div>
        </div>
      </div>;
  }
  if (!result) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-gray-500">获取结果失败</div>
          <Button variant="outline" className="mt-4" onClick={() => $w.utils.navigateBack()}>
            返回
          </Button>
        </div>
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
          {/* 评分卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{result.title || '作文批改'}</CardTitle>
                <Badge className={`text-lg px-4 py-2 ${getScoreColor(result.score || 0)}`}>
                  {result.score || 0}分 ({result.grade || '待评定'})
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* 原文 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                原文内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {originalText}
              </div>
            </CardContent>
          </Card>

          {/* 批改标注 */}
          {result.annotated_text && result.annotated_text.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                批改标注
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.annotated_text.map((annotation, index) => <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <div className="font-semibold text-blue-800">{annotation.type || '标注'}</div>
                    <div className="text-gray-700 mt-1">{annotation.content || ''}</div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 错别字 */}
          {result.errors && result.errors.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                错别字
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.errors.map((error, index) => <div key={index} className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                    <div className="font-semibold text-red-800">
                      <span className="line-through">{error.original || ''}</span> → {error.corrected || ''}
                    </div>
                    {error.explanation && <div className="text-gray-700 mt-1 text-sm">{error.explanation}</div>}
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 优点 */}
          {result.positives && result.positives.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                优点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.positives.map((positive, index) => <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                    <div className="font-semibold text-green-800">{positive.type || '优点'}</div>
                    <div className="text-gray-700 mt-1">{positive.content || ''}</div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 优化建议 */}
          {result.optimizations && result.optimizations.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-yellow-600" />
                优化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.optimizations.map((optimization, index) => <div key={index} className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                    <div className="font-semibold text-yellow-800">{optimization.type || '建议'}</div>
                    <div className="text-gray-700 mt-1">{optimization.content || ''}</div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 总体评价 */}
          {result.feedback && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-purple-600" />
                总体评价
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="font-semibold text-purple-800 mb-2">
                  评分: {result.feedback.score || result.score || 0}分
                </div>
                <div className="text-gray-700">{result.feedback.content || ''}</div>
              </div>
            </CardContent>
          </Card>}

          {/* 操作按钮 */}
          <div className="flex justify-center space-x-4 pt-6">
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
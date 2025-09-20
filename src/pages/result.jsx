// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Download, Share2, Save, CheckCircle, AlertCircle, Info, Check, Star, Clock, RefreshCw } from 'lucide-react';

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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);
  const userId = localStorage.getItem('userId');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const originalText = $w.page.dataset.params?.text;
  const image = $w.page.dataset.params?.image;
  const correctionResult = $w.page.dataset.params?.correctionResult;
  const validateCorrectionResult = data => {
    if (!data || typeof data !== 'object') {
      throw new Error('批改结果数据格式错误');
    }
    if (!data.score && !data.feedback?.score) {
      throw new Error('批改结果缺少评分信息');
    }
    if (!data.title && !originalText) {
      throw new Error('批改结果缺少作文内容');
    }
    if (data.score && typeof data.score !== 'number') {
      throw new Error('评分数据类型错误');
    }
    if (data.feedback && data.feedback.score && typeof data.feedback.score !== 'number') {
      throw new Error('反馈评分数据类型错误');
    }
    return true;
  };
  const formatDate = date => {
    if (!date) return '未知时间';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '无效时间';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  const getScoreColor = score => {
    if (typeof score !== 'number' || score < 0) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  const getGradeColor = grade => {
    switch (grade) {
      case '优秀':
        return 'bg-green-100 text-green-800';
      case '良好':
        return 'bg-blue-100 text-blue-800';
      case '中等':
        return 'bg-yellow-100 text-yellow-800';
      case '及格':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const loadCorrectionResult = async () => {
    try {
      setLoading(true);
      setApiError(null);
      if (correctionResult) {
        validateCorrectionResult(correctionResult);
        setResult(correctionResult);
        return;
      }
      const apiResult = await $w.cloud.callFunction({
        name: 'essayCorrection',
        data: {
          essayText: originalText,
          image: image
        }
      });
      if (apiResult.success && apiResult.correctionResult) {
        validateCorrectionResult(apiResult.correctionResult);
        setResult(apiResult.correctionResult);
      } else {
        throw new Error(apiResult.error || apiResult.message || '作文批改失败');
      }
    } catch (error) {
      console.error('作文批改错误:', error);
      setApiError(error.message || '作文批改失败');
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
    if (!result || !userId) {
      toast({
        title: '保存失败',
        description: '缺少必要信息',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      const saveData = {
        user_id: userId,
        title: result.title || '作文批改',
        original_text: originalText,
        search_text: originalText.substring(0, 100),
        ocr_text: originalText,
        score: result.score || result.feedback?.score || 0,
        grade: result.grade || '待评定',
        is_favorite: false,
        annotated_text: result.annotated_text || [],
        errors: result.errors || [],
        positives: result.positives || [],
        optimizations: result.optimizations || [],
        feedback: result.feedback || {},
        image_url: image || ''
      };
      if (!saveData.score || saveData.score < 0) {
        throw new Error('评分数据无效');
      }
      const saveResult = await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaCreateV2',
        params: {
          data: saveData
        }
      });
      if (saveResult.id) {
        setSaveSuccess(true);
        toast({
          title: '保存成功',
          description: '批改记录已保存到历史记录中'
        });
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        throw new Error('保存失败，未获取到记录ID');
      }
    } catch (error) {
      console.error('保存错误:', error);
      toast({
        title: '保存失败',
        description: error.message || '请检查网络连接后重试',
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
      title: '分享链接已复制',
      description: '链接已复制到剪贴板，可以分享给他人查看'
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
              margin: 0 8px;
            }
            .section { 
              margin-bottom: 30px; 
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .meta { 
              color: #666; 
              margin-bottom: 20px; 
              font-size: 14px;
            }
            .content { 
              line-height: 1.8; 
              padding: 15px;
              background: #f9f9f9;
              border-radius: 5px;
              margin: 10px 0;
              white-space: pre-wrap;
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
            .annotation-item {
              background: #fff3cd;
              border-left-color: #ffc107;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>作文批改结果</h1>
            <div>
              <span class="score-badge">${result.score || result.feedback?.score || 0}分</span>
              <span class="score-badge">${result.grade || '未评定'}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="title">${result.title || '未命名作文'}</div>
            <div class="meta">
              批改时间：${new Date().toLocaleString()}
            </div>
          </div>
          
          <div class="section">
            <h2>原文</h2>
            <div class="content">${originalText || '无原文内容'}</div>
          </div>
          
          ${result.annotated_text && result.annotated_text.length > 0 ? `
          <div class="section">
            <h2>批改标注</h2>
            ${result.annotated_text.map(annotation => `
              <div class="correction-item annotation-item">
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
                ${error.explanation ? `<br><small>说明: ${error.explanation}</small>` : ''}
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
              <strong>评分:</strong> ${result.feedback.score || result.score || 0}分
              ${result.feedback.content ? `<br><strong>评价:</strong> ${result.feedback.content}` : ''}
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
  useEffect(() => {
    loadCorrectionResult();
  }, []);
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">加载批改结果中...</div>
        </div>
      </div>;
  }
  if (apiError) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">加载批改结果失败</div>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
          <div className="space-x-2">
            <Button onClick={() => $w.utils.navigateBack()} variant="outline">
              返回
            </Button>
          </div>
        </div>
      </div>;
  }
  if (!result) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-gray-500">批改结果不存在</div>
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
            <h1 className="text-2xl font-bold">作文批改结果</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </Button>
              <Button onClick={handleSave} disabled={saving || saveSuccess} className="bg-green-600">
                {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>保存中...</> : saveSuccess ? <><Check className="w-4 h-4 mr-2" />已保存</> : <><Save className="w-4 h-4 mr-2" />保存记录</>}
              </Button>
              <Button variant="ghost" onClick={() => $w.utils.navigateBack()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 评分和标题 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{result.title || '作文批改'}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={`text-lg px-4 py-2 ${getScoreColor(result.score || result.feedback?.score || 0)}`}>
                    {result.score || result.feedback?.score || 0}分
                  </Badge>
                  <Badge className={getGradeColor(result.grade)}>
                    {result.grade || '未评定'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <Clock className="w-4 h-4 mr-1" />
                批改时间：{formatDate(new Date())}
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
                {originalText || '无原文内容'}
              </div>
            </CardContent>
          </Card>

          {/* 批改标注 */}
          {result.annotated_text && result.annotated_text.length > 0 && <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
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
          <div className="flex justify-center space-x-4">
            <Button onClick={() => $w.utils.navigateTo({
            pageId: 'camera'
          })} variant="outline">
              继续批改
            </Button>
            <Button onClick={() => $w.utils.navigateTo({
            pageId: 'history'
          })} variant="outline">
              查看历史
            </Button>
          </div>
        </div>
      </div>
    </div>;
}
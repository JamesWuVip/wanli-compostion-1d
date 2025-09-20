// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Download, Heart, Share2, Trash2, CheckCircle, AlertCircle, Info, Star, Clock, RefreshCw } from 'lucide-react';

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
  const [apiError, setApiError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const userId = localStorage.getItem('userId');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  useEffect(() => {
    loadRecord();
  }, []);
  const validateRecordData = data => {
    if (!data || typeof data !== 'object') {
      throw new Error('记录数据格式错误');
    }

    // 验证必要字段
    const requiredFields = ['_id', 'user_id', 'title', 'original_text', 'score', 'grade', 'createdAt'];
    const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === null);
    if (missingFields.length > 0) {
      throw new Error(`记录缺少必要字段: ${missingFields.join(', ')}`);
    }

    // 验证数据类型
    if (typeof data.score !== 'number' || data.score < 0) {
      throw new Error('评分数据无效');
    }

    // 验证数组字段
    const arrayFields = ['annotated_text', 'errors', 'positives', 'optimizations'];
    arrayFields.forEach(field => {
      if (data[field] && !Array.isArray(data[field])) {
        throw new Error(`${field} 字段格式错误`);
      }
    });
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
  const loadRecord = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const recordId = $w.page.dataset.params?.recordId;
      const isShared = $w.page.dataset.params?.shared === 'true';
      if (!recordId) {
        throw new Error('记录ID不能为空');
      }
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: recordId
              },
              ...(isShared ? {} : {
                user_id: {
                  $eq: userId
                }
              })
            }
          },
          select: {
            $master: true
          }
        }
      });

      // 验证返回数据
      if (!result) {
        throw new Error('记录不存在');
      }

      // 验证数据完整性
      validateRecordData(result);
      setRecord(result);
      setIsFavorite(result.is_favorite || false);

      // 重置重试计数
      setRetryCount(0);
    } catch (error) {
      console.error('加载记录错误:', error);
      setApiError(error.message || '加载记录失败');
      toast({
        title: '加载失败',
        description: error.message || '请检查网络连接后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      loadRecord();
    } else {
      toast({
        title: '重试次数已达上限',
        description: '请检查网络连接或稍后重试',
        variant: 'destructive'
      });
    }
  };
  const handleExportPDF = () => {
    if (!record) return;
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>${record.title || '作文批改详情'} - 作文批改结果</title>
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
            <h1>作文批改详情</h1>
            <div>
              <span class="score-badge">${record.score || 0}分</span>
              <span class="score-badge">${record.grade || '未评定'}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="title">${record.title || '未命名作文'}</div>
            <div class="meta">
              批改时间：${formatDate(record.createdAt)}
            </div>
          </div>
          
          <div class="section">
            <h2>原文</h2>
            <div class="content">${record.original_text || '无原文内容'}</div>
          </div>
          
          ${record.ocr_text && record.ocr_text !== record.original_text ? `
          <div class="section">
            <h2>OCR识别文本</h2>
            <div class="content">${record.ocr_text}</div>
          </div>
          ` : ''}
          
          ${record.annotated_text && record.annotated_text.length > 0 ? `
          <div class="section">
            <h2>批改标注</h2>
            ${record.annotated_text.map(annotation => `
              <div class="correction-item annotation-item">
                <strong>${annotation.type || '标注'}:</strong> ${annotation.content || ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${record.errors && record.errors.length > 0 ? `
          <div class="section">
            <h2>错别字</h2>
            ${record.errors.map(error => `
              <div class="correction-item error-item">
                <strong>错误:</strong> ${error.original || ''} → <strong>正确:</strong> ${error.corrected || ''}
                ${error.explanation ? `<br><small>说明: ${error.explanation}</small>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${record.positives && record.positives.length > 0 ? `
          <div class="section">
            <h2>优点</h2>
            ${record.positives.map(positive => `
              <div class="correction-item positive-item">
                <strong>${positive.type || '优点'}:</strong> ${positive.content || ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${record.optimizations && record.optimizations.length > 0 ? `
          <div class="section">
            <h2>优化建议</h2>
            ${record.optimizations.map(optimization => `
              <div class="correction-item optimization-item">
                <strong>${optimization.type || '建议'}:</strong> ${optimization.content || ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${record.feedback ? `
          <div class="section">
            <h2>总体评价</h2>
            <div class="correction-item">
              <strong>评分:</strong> ${record.feedback.score || record.score || 0}分
              ${record.feedback.content ? `<br><strong>评价:</strong> ${record.feedback.content}` : ''}
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
  const handleToggleFavorite = async () => {
    if (!record || !userId) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            is_favorite: !isFavorite
          },
          filter: {
            where: {
              _id: {
                $eq: record._id
              },
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? '已取消收藏' : '已收藏'
      });
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleShare = () => {
    if (!record) return;
    const shareUrl = `${window.location.origin}/history_detail?recordId=${record._id}&shared=true`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: '分享链接已复制',
      description: '链接已复制到剪贴板，可以分享给他人查看'
    });
  };
  const handleDelete = async () => {
    if (!record || !userId) return;
    if (!confirm('确定要删除这条记录吗？此操作不可恢复。')) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: record._id
              },
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
      toast({
        title: '删除成功'
      });
      setTimeout(() => {
        $w.utils.navigateBack();
      }, 1000);
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">加载详情中...</div>
        </div>
      </div>;
  }
  if (apiError) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">加载记录详情失败</div>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
          <div className="space-x-2">
            <Button onClick={handleRetry} disabled={retryCount >= maxRetries} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试 {retryCount < maxRetries && `(${maxRetries - retryCount})`}
            </Button>
            <Button variant="outline" onClick={() => $w.utils.navigateBack()}>
              返回
            </Button>
          </div>
        </div>
      </div>;
  }
  if (!record) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-gray-500">记录不存在</div>
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
            <Button variant="ghost" onClick={() => $w.utils.navigateBack()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 mr-4">
                <img src={userInfo.avatarUrl || 'https://via.placeholder.com/32'} alt="avatar" className="w-8 h-8 rounded-full" />
                <span className="text-sm text-gray-600">{userInfo.nickName || '用户'}</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                导出PDF
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleToggleFavorite} className={isFavorite ? 'text-yellow-500' : ''}>
                <Star className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? '已收藏' : '收藏'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 标题和评分 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{record.title || '未命名作文'}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={`text-lg px-4 py-2 ${getScoreColor(record.score || 0)}`}>
                    {record.score || 0}分
                  </Badge>
                  <Badge className={getGradeColor(record.grade)}>
                    {record.grade || '未评定'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <Clock className="w-4 h-4 mr-1" />
                批改时间：{formatDate(record.createdAt)}
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
                {record.original_text || '无原文内容'}
              </div>
            </CardContent>
          </Card>

          {/* OCR识别文本 */}
          {record.ocr_text && record.ocr_text !== record.original_text && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-green-600" />
                OCR识别文本
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg whitespace-pre-wrap">
                {record.ocr_text}
              </div>
            </CardContent>
          </Card>}

          {/* 批改标注 */}
          {record.annotated_text && record.annotated_text.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                批改标注
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.annotated_text.map((annotation, index) => <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <div className="font-semibold text-blue-800">{annotation.type || '标注'}</div>
                    <div className="text-gray-700 mt-1">{annotation.content || ''}</div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 错别字 */}
          {record.errors && record.errors.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                错别字
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.errors.map((error, index) => <div key={index} className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                    <div className="font-semibold text-red-800">
                      <span className="line-through">{error.original || ''}</span> → {error.corrected || ''}
                    </div>
                    {error.explanation && <div className="text-gray-700 mt-1 text-sm">{error.explanation}</div>}
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 优点 */}
          {record.positives && record.positives.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                优点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.positives.map((positive, index) => <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                    <div className="font-semibold text-green-800">{positive.type || '优点'}</div>
                    <div className="text-gray-700 mt-1">{positive.content || ''}</div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 优化建议 */}
          {record.optimizations && record.optimizations.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-yellow-600" />
                优化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.optimizations.map((optimization, index) => <div key={index} className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                    <div className="font-semibold text-yellow-800">{optimization.type || '建议'}</div>
                    <div className="text-gray-700 mt-1">{optimization.content || ''}</div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

          {/* 总体评价 */}
          {record.feedback && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-purple-600" />
                总体评价
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="font-semibold text-purple-800 mb-2">
                  评分: {record.feedback.score || record.score || 0}分
                </div>
                <div className="text-gray-700">{record.feedback.content || ''}</div>
              </div>
            </CardContent>
          </Card>}

          {/* 原始图片 */}
          {record.image_url && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-gray-600" />
                原始图片
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img src={record.image_url} alt="作文图片" className="max-w-md rounded-lg border shadow-sm" />
            </CardContent>
          </Card>}
        </div>
      </div>
    </div>;
}
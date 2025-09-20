// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Check, Edit3, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export default function OCRConfirm(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [correctionError, setCorrectionError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  useEffect(() => {
    const imageData = $w.page.dataset.params?.image;
    const ocrText = $w.page.dataset.params?.text;
    if (imageData && ocrText) {
      setImage(imageData);
      setText(ocrText);
    } else {
      toast({
        title: '参数错误',
        description: '缺少图片或文字内容，请重新拍照',
        variant: 'destructive'
      });
      $w.utils.navigateTo({
        pageId: 'camera'
      });
    }
  }, []);
  const handleConfirm = async () => {
    if (!text.trim()) {
      toast({
        title: '请输入作文内容',
        description: '作文内容不能为空',
        variant: 'destructive'
      });
      return;
    }
    setCorrecting(true);
    setCorrectionError(null);
    try {
      // 调用作文批改API
      const result = await $w.cloud.callFunction({
        name: 'essayCorrection',
        data: {
          essayText: text,
          image: image
        }
      });
      if (result.success && result.correctionResult) {
        // 重置重试计数
        setRetryCount(0);

        // 跳转到结果页面，传递批改结果
        $w.utils.navigateTo({
          pageId: 'result',
          params: {
            text: text,
            image: image,
            correctionResult: result.correctionResult
          }
        });
      } else {
        throw new Error(result.error || result.message || '作文批改失败');
      }
    } catch (error) {
      console.error('作文批改错误:', error);
      setCorrectionError(error.message || '作文批改失败');
      toast({
        title: '作文批改失败',
        description: error.message || '请检查网络连接后重试',
        variant: 'destructive'
      });
    } finally {
      setCorrecting(false);
    }
  };
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      handleConfirm();
    } else {
      toast({
        title: '重试次数已达上限',
        description: '请检查网络连接或稍后重试',
        variant: 'destructive'
      });
    }
  };
  const handleReset = () => {
    setCorrectionError(null);
    setRetryCount(0);
  };
  return <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">确认作文内容</h1>
            <Button variant="ghost" onClick={() => $w.utils.navigateBack()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>作文图片</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={image} alt="作文图片" className="w-full rounded-lg border" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>识别内容</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} disabled={correcting}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  {editing ? '完成' : '编辑'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editing ? <Textarea value={text} onChange={e => setText(e.target.value)} className="min-h-[200px]" placeholder="请修改或输入作文内容..." disabled={correcting} /> : <div className="bg-gray-50 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap">
                  {text || '暂无识别内容'}
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* 错误提示 */}
        {correctionError && <div className="mt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">批改失败</div>
                  <div>{correctionError}</div>
                  {retryCount < maxRetries && <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm">还可以重试 {maxRetries - retryCount} 次</span>
                    </div>}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={handleRetry} disabled={correcting} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                重试批改
              </Button>
              <Button onClick={handleReset} variant="outline">
                重新编辑
              </Button>
            </div>
          </div>}

        {/* 批改状态提示 */}
        {correcting && <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI正在批改作文，请稍候...</span>
            </div>
            <div className="text-sm text-blue-500 mt-2 space-y-1">
              <p>• 系统正在分析作文内容、语法错误、表达方式等</p>
              <p>• 这可能需要几秒钟时间，请耐心等待</p>
              <p>• 批改完成后将自动跳转到结果页面</p>
            </div>
          </div>}

        <div className="mt-6 flex justify-center">
          <Button onClick={handleConfirm} className="bg-green-600" disabled={correcting || !text.trim()}>
            {correcting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />批改中...</> : <><Check className="w-4 h-4 mr-2" />确认并批改</>}
          </Button>
        </div>
      </div>
    </div>;
}
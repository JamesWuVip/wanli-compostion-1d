// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, useToast } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Check, Edit3, Loader2 } from 'lucide-react';

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
  useEffect(() => {
    const imageData = $w.page.dataset.params?.image;
    const ocrText = $w.page.dataset.params?.text;
    if (imageData && ocrText) {
      setImage(imageData);
      setText(ocrText);
    } else {
      toast({
        title: '参数错误',
        description: '缺少图片或文字内容',
        variant: 'destructive'
      });
      $w.utils.navigateBack();
    }
  }, []);
  const handleConfirm = async () => {
    if (!text.trim()) {
      toast({
        title: '请输入作文内容'
      });
      return;
    }
    setCorrecting(true);
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
        throw new Error(result.error || '作文批改失败');
      }
    } catch (error) {
      console.error('作文批改错误:', error);
      toast({
        title: '作文批改失败',
        description: error.message || '请检查网络连接后重试',
        variant: 'destructive'
      });
    } finally {
      setCorrecting(false);
    }
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

        {/* 批改状态提示 */}
        {correcting && <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI正在批改作文，请稍候...</span>
            </div>
            <p className="text-sm text-blue-500 mt-2">
              系统正在分析作文内容、语法错误、表达方式等，这可能需要几秒钟时间
            </p>
          </div>}

        <div className="mt-6 flex justify-center">
          <Button onClick={handleConfirm} className="bg-green-600" disabled={correcting || !text.trim()}>
            {correcting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />批改中...</> : <><Check className="w-4 h-4 mr-2" />确认并批改</>}
          </Button>
        </div>
      </div>
    </div>;
}
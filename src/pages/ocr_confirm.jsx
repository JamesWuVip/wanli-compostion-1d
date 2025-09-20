// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, Input, useToast } from '@/components/ui';
// @ts-ignore;
import { CheckCircle, Edit3, Loader2, ArrowLeft } from 'lucide-react';

// @ts-ignore;
import { dataService } from '@/lib/dataService';
// @ts-ignore;
import { ErrorHandler } from '@/components/ErrorHandler';
export default function OCRConfirm(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [image, setImage] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const image = props.$w.page.dataset.params.image;
    const tempRecord = props.$w.page.dataset.params.tempRecord;
    if (image) {
      setImage(image);
    }

    // 模拟OCR识别（实际项目中应调用OCR服务）
    setTimeout(() => {
      setOcrText('今天是个晴朗的日子，我和妈妈一起去公园玩。公园里的花开得很美丽，有红色的玫瑰，黄色的菊花，还有紫色的薰衣草。我们在草地上野餐，吃了三明治和水果，还喝了果汁。吃完后，我们在公园里散步，看到了很多小动物，有可爱的小松鼠在树上跳来跳去，还有美丽的蝴蝶在花丛中飞舞。今天真是快乐的一天！');
    }, 1000);
  }, []);
  const handleConfirm = async () => {
    if (!ocrText.trim()) {
      toast({
        title: '提示',
        description: '请输入作文内容',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        $w.utils.navigateTo({
          pageId: 'login'
        });
        return;
      }
      const record = {
        title: title || '我的作文',
        original_text: ocrText,
        ocr_text: ocrText,
        user_id: userId,
        createdAt: new Date(),
        is_favorite: false
      };
      const result = await dataService.essayRecords.createRecord(record, $w);
      toast({
        title: '保存成功',
        description: '正在跳转到批改结果页面...',
        duration: 2000
      });
      setTimeout(() => {
        $w.utils.navigateTo({
          pageId: 'result',
          params: {
            recordId: result.id
          }
        });
      }, 1500);
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
    $w.utils.navigateBack();
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">确认作文内容</CardTitle>
              <Button variant="ghost" onClick={handleBack} className="text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {image && <div>
                <h3 className="text-lg font-semibold mb-2">作文图片</h3>
                <img src={image} alt="作文图片" className="w-full max-w-md mx-auto rounded-lg shadow-md" />
              </div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作文标题
              </label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="请输入作文标题" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  作文内容
                </label>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} className="text-blue-600">
                  <Edit3 className="w-4 h-4 mr-1" />
                  {editing ? '完成编辑' : '编辑'}
                </Button>
              </div>
              <Textarea value={ocrText} onChange={e => setOcrText(e.target.value)} rows={10} className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" disabled={!editing} placeholder="请确认或修改OCR识别的内容..." />
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={handleBack}>
                返回重拍
              </Button>
              <Button onClick={handleConfirm} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                确认并批改
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
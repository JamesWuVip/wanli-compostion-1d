// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, useToast } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Check, Edit3 } from 'lucide-react';

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
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const imageData = $w.page.dataset.params?.image;
    if (imageData) {
      setImage(imageData);
      // 模拟OCR识别
      setTimeout(() => {
        setText('今天天气真好，我和妈妈一起去公园玩。公园里有很多花，有红的、黄的、紫的，真漂亮！我们在草地上野餐，吃了三明治和水果。我还和小朋友一起放风筝，风筝飞得好高好高。今天真是快乐的一天！');
      }, 1000);
    } else {
      $w.utils.navigateBack();
    }
  }, []);
  const handleConfirm = () => {
    if (!text.trim()) {
      toast({
        title: '请输入作文内容'
      });
      return;
    }
    $w.utils.navigateTo({
      pageId: 'result',
      params: {
        text: text,
        image: image
      }
    });
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
                <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  {editing ? '完成' : '编辑'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editing ? <Textarea value={text} onChange={e => setText(e.target.value)} className="min-h-[200px]" placeholder="请修改或输入作文内容..." /> : <div className="bg-gray-50 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap">
                  {text}
                </div>}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={handleConfirm} className="bg-green-600">
            <Check className="w-4 h-4 mr-2" />
            确认并批改
          </Button>
        </div>
      </div>
    </div>;
}
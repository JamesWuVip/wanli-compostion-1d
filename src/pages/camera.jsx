// @ts-ignore;
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { Camera, Upload, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export default function CameraPage(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 检查用户登录状态
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast({
        title: '请先登录',
        description: '登录后可使用拍照批改功能',
        variant: 'destructive'
      });
      $w.utils.navigateTo({
        pageId: 'login'
      });
    }
  }, []);

  // 处理拍照
  const handleTakePhoto = async () => {
    try {
      setCameraError(null);
      // 使用系统相机
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = event => {
            setImage(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } catch (error) {
      console.error('拍照错误:', error);
      setCameraError('无法访问相机，请检查权限设置');
      toast({
        title: '拍照失败',
        description: '无法访问相机，请检查权限设置',
        variant: 'destructive'
      });
    }
  };

  // 处理文件上传
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: '文件格式错误',
          description: '请选择图片文件',
          variant: 'destructive'
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '文件过大',
          description: '请选择小于5MB的图片',
          variant: 'destructive'
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理OCR识别
  const handleOCR = async () => {
    if (!image) {
      toast({
        title: '请先选择图片',
        description: '请拍摄或上传作文图片',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    setCameraError(null);
    try {
      // 调用OCR识别API
      const result = await $w.cloud.callFunction({
        name: 'ocrRecognition',
        data: {
          image: image
        }
      });
      if (result.success && result.text) {
        // 跳转到确认页面
        $w.utils.navigateTo({
          pageId: 'ocr_confirm',
          params: {
            image: image,
            text: result.text
          }
        });
      } else {
        throw new Error(result.error || 'OCR识别失败');
      }
    } catch (error) {
      console.error('OCR识别错误:', error);
      setCameraError(error.message || 'OCR识别失败，请重试');
      toast({
        title: '识别失败',
        description: error.message || 'OCR识别失败，请重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 重试操作
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setCameraError(null);
    } else {
      toast({
        title: '重试次数已达上限',
        description: '请检查网络连接或稍后重试',
        variant: 'destructive'
      });
    }
  };

  // 清除错误
  const handleClearError = () => {
    setCameraError(null);
    setRetryCount(0);
  };

  // 清除图片
  const handleClearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">拍照批改</h1>
            <Button variant="ghost" onClick={() => $w.utils.navigateBack()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 图片预览区域 */}
          <Card>
            <CardHeader>
              <CardTitle>作文图片</CardTitle>
            </CardHeader>
            <CardContent>
              {image ? <div className="space-y-4">
                  <img src={image} alt="作文图片" className="w-full max-w-md mx-auto rounded-lg border" />
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" onClick={handleClearImage}>
                      重新选择
                    </Button>
                    <Button onClick={handleOCR} disabled={loading} className="bg-blue-600">
                      {loading ? '识别中...' : '开始识别'}
                    </Button>
                  </div>
                </div> : <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">请拍摄或上传作文图片</p>
                  <div className="flex justify-center space-x-2">
                    <Button onClick={handleTakePhoto} className="bg-blue-600">
                      <Camera className="w-4 h-4 mr-2" />
                      拍照
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      上传
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>}
            </CardContent>
          </Card>

          {/* 错误提示 */}
          {cameraError && <Card>
              <CardContent className="pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">操作失败</div>
                      <div>{cameraError}</div>
                      {retryCount < maxRetries && <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm">还可以重试 {maxRetries - retryCount} 次</span>
                        </div>}
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center space-x-2 mt-4">
                  <Button onClick={handleRetry} disabled={retryCount >= maxRetries} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                  <Button onClick={handleClearError} variant="outline">
                    清除错误
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* 使用提示 */}
          <Card>
            <CardHeader>
              <CardTitle>使用提示</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 请确保作文图片清晰，文字完整可见</p>
                <p>• 支持 JPG、PNG 格式图片，大小不超过 5MB</p>
                <p>• 建议将作文平铺拍摄，避免阴影和反光</p>
                <p>• 识别完成后可手动编辑识别结果</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}
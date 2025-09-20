// @ts-ignore;
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from '@/components/ui';
// @ts-ignore;
import { Camera, Upload, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';

// @ts-ignore;
import { dataService } from '@/lib/dataService';
// @ts-ignore;
import { ErrorHandler } from '@/components/ErrorHandler';
export default function CameraPage(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    return () => {
      if (cameraActive && videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [cameraActive]);
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      ErrorHandler.handleCloudFunctionError(error, toast);
    }
  };
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setImage(imageData);
      stopCamera();
    }
  };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleNext = async () => {
    if (!image) {
      toast({
        title: '提示',
        description: '请先拍摄或上传作文图片',
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

      // 创建临时记录
      const tempRecord = {
        title: '待识别作文',
        image_url: image,
        user_id: userId,
        createdAt: new Date(),
        is_favorite: false
      };
      $w.utils.navigateTo({
        pageId: 'ocr_confirm',
        params: {
          image: image,
          tempRecord: JSON.stringify(tempRecord)
        }
      });
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    } finally {
      setLoading(false);
    }
  };
  const resetImage = () => {
    setImage(null);
    if (cameraActive) {
      stopCamera();
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">拍照上传作文</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!image ? <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {cameraActive ? <div className="space-y-4">
                      <video ref={videoRef} autoPlay className="w-full max-w-md mx-auto rounded-lg" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex justify-center space-x-4">
                        <Button onClick={captureImage} className="bg-blue-600 hover:bg-blue-700">
                          <Camera className="w-4 h-4 mr-2" />
                          拍照
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          取消
                        </Button>
                      </div>
                    </div> : <div className="space-y-4">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto" />
                      <p className="text-gray-600">选择拍照或上传作文图片</p>
                      <div className="flex justify-center space-x-4">
                        <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                          <Camera className="w-4 h-4 mr-2" />
                          打开相机
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                          <Upload className="w-4 h-4 mr-2" />
                          上传图片
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </div>
                    </div>}
                </div>
              </div> : <div className="space-y-4">
                <img src={image} alt="作文图片" className="w-full max-w-md mx-auto rounded-lg shadow-md" />
                <div className="flex justify-center space-x-4">
                  <Button onClick={handleNext} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    下一步
                  </Button>
                  <Button onClick={resetImage} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重新拍摄
                  </Button>
                </div>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}
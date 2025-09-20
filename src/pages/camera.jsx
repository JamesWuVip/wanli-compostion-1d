// @ts-ignore;
import React, { useState, useRef } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from '@/components/ui';
// @ts-ignore;
import { Camera, Upload, RotateCcw, Check } from 'lucide-react';

export default function CameraPage(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      toast({
        title: '无法启动相机',
        description: '请确保已授予相机权限',
        variant: 'destructive'
      });
    }
  };
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
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
      const imageData = canvas.toDataURL('image/jpeg');
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
  const handleNext = () => {
    if (!image) {
      toast({
        title: '请先拍摄或上传图片'
      });
      return;
    }
    $w.utils.navigateTo({
      pageId: 'ocr_confirm',
      params: {
        image: image
      }
    });
  };
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  return <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">拍照批改</h1>
            <Button variant="ghost" onClick={() => $w.utils.navigateBack()}>
              返回
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>拍摄或上传作文</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!image && <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {isCameraActive ? <div className="space-y-4">
                      <video ref={videoRef} autoPlay playsInline className="w-full max-w-md mx-auto rounded-lg" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex justify-center space-x-4">
                        <Button onClick={captureImage} className="bg-blue-600">
                          <Camera className="w-4 h-4 mr-2" />
                          拍照
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          取消
                        </Button>
                      </div>
                    </div> : <div className="space-y-4">
                      <Camera className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-gray-600">请拍摄或上传作文图片</p>
                      <div className="flex justify-center space-x-4">
                        <Button onClick={startCamera} className="bg-blue-600">
                          <Camera className="w-4 h-4 mr-2" />
                          启动相机
                        </Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          上传图片
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </div>
                    </div>}
                </div>
              </div>}
            
            {image && <div className="space-y-4">
                <img src={image} alt="作文图片" className="w-full max-w-md mx-auto rounded-lg border" />
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={() => {
                setImage(null);
                setIsCameraActive(false);
              }}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重新拍摄
                  </Button>
                  <Button onClick={handleNext} className="bg-green-600">
                    <Check className="w-4 h-4 mr-2" />
                    下一步
                  </Button>
                </div>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}
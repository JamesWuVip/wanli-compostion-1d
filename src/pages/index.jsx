// @ts-ignore;
import React, { useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from '@/components/ui';
// @ts-ignore;
import { Camera, History, User, LogOut, BookOpen } from 'lucide-react';

export default function Index(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  useEffect(() => {
    // 检查登录状态
    const userId = localStorage.getItem('userId');
    if (!userId) {
      $w.utils.navigateTo({
        pageId: 'login'
      });
    }
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userInfo');
    toast({
      title: '已退出登录'
    });
    setTimeout(() => {
      $w.utils.navigateTo({
        pageId: 'login'
      });
    }, 1000);
  };
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">作文批改助手</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-600">{userInfo.nickName || '用户'}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">拍照批改</CardTitle>
                  <CardContent className="p-0 text-sm text-gray-600">拍摄作文照片进行智能批改</CardContent>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => $w.utils.navigateTo({
              pageId: 'camera'
            })}>
                开始拍照
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <History className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">历史记录</CardTitle>
                  <CardContent className="p-0 text-sm text-gray-600">查看和管理批改历史</CardContent>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => $w.utils.navigateTo({
              pageId: 'history'
            })}>
                查看历史
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>欢迎使用作文批改助手，让AI帮您提升写作水平</p>
          </div>
        </div>
      </div>
    </div>;
}
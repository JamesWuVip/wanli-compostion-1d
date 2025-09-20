// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from '@/components/ui';
// @ts-ignore;
import { Camera, History, BookOpen, User, LogOut, Loader2 } from 'lucide-react';

// @ts-ignore;
import { dataService } from '@/lib/dataService';
// @ts-ignore;
import { ErrorHandler } from '@/components/ErrorHandler';
export default function Index(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEssays: 0,
    thisMonth: 0,
    favoriteCount: 0
  });
  useEffect(() => {
    loadUserInfo();
  }, []);
  const loadUserInfo = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        $w.utils.navigateTo({
          pageId: 'login'
        });
        return;
      }
      const userData = JSON.parse(localStorage.getItem('userInfo') || '{}');
      setUserInfo(userData);

      // 获取用户统计信息
      const records = await dataService.essayRecords.getUserRecords(userId, 1, 100, $w);
      if (records.records) {
        setStats({
          totalEssays: records.total || 0,
          thisMonth: records.records.filter(r => {
            const date = new Date(r.createdAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length,
          favoriteCount: records.records.filter(r => r.is_favorite).length
        });
      }
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('loginTime');
    $w.utils.navigateTo({
      pageId: 'login'
    });
    toast({
      title: '已退出登录',
      description: '期待您的下次使用',
      duration: 2000
    });
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">作文智能批改</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img src={userInfo?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.name || 'User')}&background=random`} alt="avatar" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium text-gray-700">{userInfo?.nickName || userInfo?.name || '用户'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700">
              <LogOut className="w-4 h-4 mr-1" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-700">总作文数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalEssays}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-700">本月作文</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.thisMonth}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-700">收藏作文</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.favoriteCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => $w.utils.navigateTo({
          pageId: 'camera'
        })}>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Camera className="w-16 h-16 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">拍照批改</h3>
              <p className="text-gray-600 text-center">拍摄作文照片，智能识别并批改</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => $w.utils.navigateTo({
          pageId: 'history'
        })}>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <History className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">批改历史</h3>
              <p className="text-gray-600 text-center">查看历史批改记录和进步轨迹</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}
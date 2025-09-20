// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { Camera, History, BookOpen, User, AlertCircle, RefreshCw } from 'lucide-react';

export default function Index(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // 验证用户信息数据格式
  const validateUserInfo = data => {
    if (!data || typeof data !== 'object') {
      throw new Error('用户信息格式错误');
    }

    // 验证必要字段
    const requiredFields = ['userId', 'name'];
    const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === null);
    if (missingFields.length > 0) {
      throw new Error(`用户信息缺少必要字段: ${missingFields.join(', ')}`);
    }
    return true;
  };

  // 检查用户登录状态
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const userId = localStorage.getItem('userId');
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userId || !userInfoStr) {
        setIsLoggedIn(false);
        setUserInfo(null);
        return;
      }

      // 解析并验证用户信息
      let parsedUserInfo;
      try {
        parsedUserInfo = JSON.parse(userInfoStr);
        validateUserInfo(parsedUserInfo);
      } catch (parseError) {
        console.warn('用户信息解析失败:', parseError.message);
        // 清除无效的用户信息
        localStorage.removeItem('userId');
        localStorage.removeItem('userInfo');
        setIsLoggedIn(false);
        setUserInfo(null);
        return;
      }

      // 验证用户ID一致性
      if (parsedUserInfo.userId !== userId) {
        console.warn('用户ID不一致，清除登录状态');
        localStorage.removeItem('userId');
        localStorage.removeItem('userInfo');
        setIsLoggedIn(false);
        setUserInfo(null);
        return;
      }
      setIsLoggedIn(true);
      setUserInfo(parsedUserInfo);

      // 重置重试计数
      setRetryCount(0);
    } catch (error) {
      console.error('检查登录状态错误:', error);
      setAuthError(error.message || '检查登录状态失败');
      toast({
        title: '状态检查失败',
        description: error.message || '请检查网络连接后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 重试检查登录状态
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      checkAuthStatus();
    } else {
      toast({
        title: '重试次数已达上限',
        description: '请检查网络连接或稍后重试',
        variant: 'destructive'
      });
    }
  };

  // 清除错误状态
  const handleClearError = () => {
    setAuthError(null);
    setRetryCount(0);
  };
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 处理开始批改
  const handleStartCorrection = () => {
    if (!isLoggedIn) {
      $w.utils.navigateTo({
        pageId: 'login'
      });
    } else {
      $w.utils.navigateTo({
        pageId: 'camera'
      });
    }
  };

  // 处理查看历史
  const handleViewHistory = () => {
    if (!isLoggedIn) {
      $w.utils.navigateTo({
        pageId: 'login'
      });
    } else {
      $w.utils.navigateTo({
        pageId: 'history'
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">检查登录状态中...</div>
        </div>
      </div>;
  }
  if (authError) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">检查登录状态失败</div>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
          <div className="space-x-2">
            <Button onClick={handleRetry} disabled={retryCount >= maxRetries} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试 {retryCount < maxRetries && `(${maxRetries - retryCount})`}
            </Button>
            <Button variant="outline" onClick={handleClearError}>
              清除错误
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">智能作文批改系统</h1>
          <p className="text-xl text-gray-600">AI驱动作文批改，让写作更高效</p>
          
          {/* 用户信息 */}
          {isLoggedIn && userInfo && <div className="mt-6 flex items-center justify-center space-x-2">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  欢迎，{userInfo.nickName || userInfo.name || '用户'}
                </span>
              </div>
            </div>}
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartCorrection}>
            <CardHeader className="text-center">
              <Camera className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-xl">开始批改</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                拍摄或上传作文图片，AI将自动识别并进行智能批改
              </p>
              <div className="mt-4 text-center">
                <span className="text-sm text-blue-600">
                  {isLoggedIn ? '点击开始' : '请先登录'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewHistory}>
            <CardHeader className="text-center">
              <History className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <CardTitle className="text-xl">历史记录</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                查看之前的批改记录，支持收藏、分享和导出
              </p>
              <div className="mt-4 text-center">
                <span className="text-sm text-green-600">
                  {isLoggedIn ? '点击查看' : '请先登录'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能介绍 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
              功能特点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">智能识别</h3>
                <p className="text-sm text-gray-600">
                  先进的OCR技术，准确识别手写和印刷体作文
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">AI批改</h3>
                <p className="text-sm text-gray-600">
                  智能分析作文内容，提供详细的批改建议
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">记录管理</h3>
                <p className="text-sm text-gray-600">
                  完整的历史记录管理，支持多种导出格式
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">登录系统</h4>
                  <p className="text-sm text-gray-600">
                    使用您的账号密码登录系统，开始使用作文批改功能
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">拍摄作文</h4>
                  <p className="text-sm text-gray-600">
                    使用相机拍摄作文图片，或上传已有的作文图片
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">确认内容</h4>
                  <p className="text-sm text-gray-600">
                    确认OCR识别的作文内容，可以进行必要的编辑
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">查看结果</h4>
                  <p className="text-sm text-gray-600">
                    查看AI批改结果，包括评分、评语和改进建议
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
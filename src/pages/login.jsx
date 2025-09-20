// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, User, Lock, AlertCircle, RefreshCw } from 'lucide-react';

// @ts-ignore;
import { useForm } from 'react-hook-form';
// @ts-ignore;

export default function Login(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const form = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  // 验证登录响应数据格式
  const validateLoginResponse = data => {
    if (!data || typeof data !== 'object') {
      throw new Error('登录响应数据格式错误');
    }
    if (!data.success) {
      throw new Error(data.message || '登录失败');
    }
    if (!data.userInfo || typeof data.userInfo !== 'object') {
      throw new Error('用户信息格式错误');
    }

    // 验证用户信息必要字段
    const requiredFields = ['userId', 'name'];
    const missingFields = requiredFields.filter(field => data.userInfo[field] === undefined || data.userInfo[field] === null);
    if (missingFields.length > 0) {
      throw new Error(`用户信息缺少必要字段: ${missingFields.join(', ')}`);
    }
    return true;
  };
  const onSubmit = async data => {
    if (!data.username.trim() || !data.password.trim()) {
      toast({
        title: '请输入用户名和密码',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      // 调用登录API
      const result = await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: data.username.trim(),
          password: data.password.trim()
        }
      });

      // 验证API响应数据
      validateLoginResponse(result);

      // 保存用户信息到本地存储
      localStorage.setItem('userId', result.userInfo.userId);
      localStorage.setItem('userInfo', JSON.stringify(result.userInfo));
      toast({
        title: '登录成功',
        description: `欢迎回来，${result.userInfo.name || result.userInfo.nickName || '用户'}`
      });

      // 重置重试计数
      setRetryCount(0);

      // 跳转到首页
      setTimeout(() => {
        $w.utils.navigateTo({
          pageId: 'index'
        });
      }, 1000);
    } catch (error) {
      console.error('登录错误:', error);
      setApiError(error.message || '登录失败');
      toast({
        title: '登录失败',
        description: error.message || '请检查用户名和密码后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 重试登录
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      form.handleSubmit(onSubmit)();
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
    setApiError(null);
    setRetryCount(0);
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => $w.utils.navigateBack()} className="text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>

        {/* 登录卡片 */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">用户登录</CardTitle>
            <p className="text-gray-600">请输入您的账号和密码</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 用户名输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input {...form.register('username', {
                  required: true
                })} type="text" placeholder="请输入用户名" className="pl-10" disabled={loading} />
                </div>
                {form.formState.errors.username && <p className="text-red-500 text-sm mt-1">用户名不能为空</p>}
              </div>

              {/* 密码输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input {...form.register('password', {
                  required: true
                })} type="password" placeholder="请输入密码" className="pl-10" disabled={loading} />
                </div>
                {form.formState.errors.password && <p className="text-red-500 text-sm mt-1">密码不能为空</p>}
              </div>

              {/* 错误提示 */}
              {apiError && <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">登录失败</div>
                      <div>{apiError}</div>
                      {retryCount < maxRetries && <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm">还可以重试 {maxRetries - retryCount} 次</span>
                        </div>}
                    </div>
                  </AlertDescription>
                </Alert>}

              {/* 登录按钮 */}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    登录中...
                  </> : '登录'}
              </Button>

              {/* 错误状态下的操作按钮 */}
              {apiError && <div className="flex justify-center space-x-2">
                  <Button type="button" onClick={handleRetry} disabled={loading || retryCount >= maxRetries} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试 {retryCount < maxRetries && `(${maxRetries - retryCount})`}
                  </Button>
                  <Button type="button" onClick={handleClearError} variant="outline" size="sm">
                    清除错误
                  </Button>
                </div>}
            </form>

            {/* 其他选项 */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                还没有账号？
                <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 h-auto ml-1" onClick={() => {
                // 这里可以跳转到注册页面
                toast({
                  title: '功能开发中',
                  description: '注册功能正在开发中，敬请期待',
                  variant: 'default'
                });
              }}>
                  立即注册
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 使用提示 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>测试账号：admin / 123456</p>
          <p className="mt-1">或使用您的个人账号登录</p>
        </div>
      </div>
    </div>;
}
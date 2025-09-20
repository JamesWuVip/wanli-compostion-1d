// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, User, Lock, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';

// @ts-ignore;
import { useForm } from 'react-hook-form';
export default function Login(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    reset
  } = useForm();

  // 使用云函数进行用户认证
  const authenticateWithCloudFunction = async (username, password) => {
    try {
      const result = await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: username,
          password: password
        }
      });

      // 处理云函数返回结果
      if (result && result.code === 0 && result.data) {
        return {
          success: true,
          user: {
            userId: result.data._id,
            name: result.data.name || result.data.username,
            nickName: result.data.nickName || result.data.name || result.data.username,
            avatarUrl: result.data.avatarUrl || ''
          }
        };
      } else {
        return {
          success: false,
          error: result?.message || '用户名或密码错误'
        };
      }
    } catch (error) {
      console.error('云函数调用错误:', error);
      return {
        success: false,
        error: error.message || '登录失败，请重试'
      };
    }
  };

  // 处理登录提交
  const onSubmit = async data => {
    setLoading(true);
    setLoginError(null);
    try {
      const result = await authenticateWithCloudFunction(data.username, data.password);
      if (result.success) {
        // 保存登录状态到本地存储
        localStorage.setItem('userId', result.user.userId);
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        toast({
          title: '登录成功',
          description: `欢迎回来，${result.user.nickName || result.user.name}`
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          $w.utils.navigateTo({
            pageId: 'index'
          });
        }, 1500);
      } else {
        setLoginError(result.error);
        toast({
          title: '登录失败',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('登录错误:', error);
      setLoginError(error.message || '登录失败，请重试');
      toast({
        title: '登录失败',
        description: error.message || '请检查网络连接后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理重试
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setLoginError(null);
    } else {
      toast({
        title: '重试次数已达上限',
        description: '请检查网络连接或稍后重试',
        variant: 'destructive'
      });
    }
  };

  // 返回上一页
  const handleBack = () => {
    $w.utils.navigateBack();
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">用户登录</CardTitle>
            <p className="text-sm text-gray-600 mt-2">登录后使用作文批改功能</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input {...register('username', {
                  required: '请输入用户名',
                  minLength: {
                    value: 3,
                    message: '用户名至少3个字符'
                  }
                })} placeholder="请输入用户名" className="pl-10" disabled={loading} />
                </div>
                {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input {...register('password', {
                  required: '请输入密码',
                  minLength: {
                    value: 6,
                    message: '密码至少6个字符'
                  }
                })} type={showPassword ? 'text' : 'password'} placeholder="请输入密码" className="pl-10 pr-10" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {loginError && <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    登录中...
                  </> : '登录'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">测试账号：</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>用户名：admin / 密码：123456</p>
                <p>用户名：student / 密码：123456</p>
                <p>用户名：teacher / 密码：123456</p>
              </div>
            </div>

            {loginError && retryCount < maxRetries && <div className="mt-4 text-center">
                <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试 ({maxRetries - retryCount}次)
                </Button>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}
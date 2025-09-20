// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { User, Lock, Eye, EyeOff, Loader2, RefreshCw, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';

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
  const [isOnline, setIsOnline] = useState(true);
  const maxRetries = 3;
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    reset,
    setValue
  } = useForm();

  // 检查网络状态
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  // 使用云函数进行用户认证
  const authenticateWithCloudFunction = async (username, password) => {
    try {
      if (!isOnline) {
        throw new Error('网络连接不可用，请检查网络');
      }
      console.log('调用云函数 login:', {
        username
      });
      const result = await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: username.trim(),
          password: password.trim()
        }
      });
      console.log('云函数返回:', result);

      // 验证返回格式
      if (!result || typeof result.code === 'undefined') {
        throw new Error('服务器返回格式错误');
      }
      if (result.code === 0 && result.data) {
        const userData = result.data;

        // 验证必需字段
        if (!userData._id) {
          throw new Error('用户数据缺少ID字段');
        }
        return {
          success: true,
          user: {
            userId: userData._id,
            username: userData.username || username,
            name: userData.name || userData.username || username,
            nickName: userData.nickName || userData.name || userData.username || username,
            avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || username)}&background=random&size=128`,
            type: userData.type || 'student'
          }
        };
      } else {
        return {
          success: false,
          error: result.message || '用户名或密码错误'
        };
      }
    } catch (error) {
      console.error('云函数调用错误:', error);
      let errorMessage = '登录失败';
      if (error.message.includes('FUNCTION_NOT_FOUND')) {
        errorMessage = '登录服务未找到，请联系管理员';
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请检查网络';
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接异常';
      } else {
        errorMessage = error.message || '登录失败，请重试';
      }
      return {
        success: false,
        error: errorMessage
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
        // 保存用户信息
        localStorage.setItem('userId', result.user.userId);
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        localStorage.setItem('loginTime', new Date().toISOString());
        toast({
          title: '登录成功',
          description: `欢迎回来，${result.user.nickName}`,
          duration: 2000
        });

        // 跳转到首页
        setTimeout(() => {
          $w.utils.navigateTo({
            pageId: 'index',
            params: {
              from: 'login',
              userId: result.user.userId
            }
          });
        }, 1500);
      } else {
        setLoginError(result.error);
        toast({
          title: '登录失败',
          description: result.error,
          variant: 'destructive',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('登录错误:', error);
      setLoginError(error.message || '登录失败，请重试');
      toast({
        title: '登录失败',
        description: error.message || '请检查网络连接后重试',
        variant: 'destructive',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  // 快速填充测试账号
  const fillTestAccount = (username, password) => {
    setValue('username', username);
    setValue('password', password);
    setLoginError(null);
  };

  // 网络状态提示
  if (!isOnline) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">网络连接不可用</h2>
          <p className="text-gray-600 mb-4">请检查您的网络连接后重试</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            刷新页面
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              用户登录
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">登录后使用作文批改功能</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input {...register('username', {
                  required: '请输入用户名',
                  minLength: {
                    value: 3,
                    message: '用户名至少3个字符'
                  }
                })} placeholder="请输入用户名" className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500" disabled={loading} />
                </div>
                {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input {...register('password', {
                  required: '请输入密码',
                  minLength: {
                    value: 6,
                    message: '密码至少6个字符'
                  }
                })} type={showPassword ? 'text' : 'password'} placeholder="请输入密码" className="pl-10 pr-12 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {loginError && <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>}

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg" disabled={loading}>
                {loading ? <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    登录中...
                  </> : '登录'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">快速测试账号：</p>
                <div className="grid grid-cols-1 gap-2">
                  <button type="button" onClick={() => fillTestAccount('admin', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md" disabled={loading}>
                    管理员: admin / 123456
                  </button>
                  <button type="button" onClick={() => fillTestAccount('student', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md" disabled={loading}>
                    学生: student / 123456
                  </button>
                  <button type="button" onClick={() => fillTestAccount('teacher', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md" disabled={loading}>
                    老师: teacher / 123456
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
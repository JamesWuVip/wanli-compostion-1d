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
  const [cloudFunctionAvailable, setCloudFunctionAvailable] = useState(true);
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

  // 检查网络状态和云函数可用性
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    // 检查云函数可用性
    checkCloudFunctionAvailability();
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  // 检查云函数可用性
  const checkCloudFunctionAvailability = async () => {
    try {
      await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: 'test',
          password: 'test'
        }
      });
      setCloudFunctionAvailable(true);
    } catch (error) {
      if (error.message.includes('FUNCTION_NOT_FOUND')) {
        setCloudFunctionAvailable(false);
      }
    }
  };

  // 使用云函数进行用户认证
  const authenticateWithCloudFunction = async (username, password) => {
    try {
      // 检查网络连接
      if (!isOnline) {
        throw new Error('网络连接不可用，请检查网络');
      }

      // 检查云函数可用性
      if (!cloudFunctionAvailable) {
        throw new Error('登录服务暂不可用，请联系管理员');
      }
      const result = await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: username.trim(),
          password: password.trim()
        }
      });
      console.log('云函数返回结果:', result);

      // 严格验证返回格式
      if (!result) {
        throw new Error('服务器无响应');
      }

      // 处理云函数返回结果
      if (result.code === 0 && result.data) {
        const userData = result.data;

        // 验证必需字段
        if (!userData._id) {
          throw new Error('用户数据格式错误：缺少用户ID');
        }
        return {
          success: true,
          user: {
            userId: userData._id,
            username: userData.username || username,
            name: userData.name || userData.username || username,
            nickName: userData.nickName || userData.name || userData.username || username,
            avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || username)}&background=random&size=128`
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

      // 精确错误处理
      let errorMessage = '登录失败';
      if (error.message.includes('FUNCTION_NOT_FOUND')) {
        errorMessage = '登录服务未部署，请联系管理员';
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接';
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接异常，请检查网络';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = '无法连接到服务器，请稍后重试';
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
        // 保存登录状态到本地存储
        localStorage.setItem('userId', result.user.userId);
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        localStorage.setItem('loginTime', new Date().toISOString());

        // 显示成功提示
        toast({
          title: '登录成功',
          description: `欢迎回来，${result.user.nickName}`,
          duration: 2000,
          className: 'bg-green-50 border-green-200'
        });

        // 确保跳转到首页
        setTimeout(() => {
          $w.utils.navigateTo({
            pageId: 'index',
            params: {
              from: 'login',
              success: true
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

  // 处理重试
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setLoginError(null);
      reset();
    } else {
      toast({
        title: '重试次数已达上限',
        description: '请检查网络连接或联系管理员',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  // 快速填充测试账号
  const fillTestAccount = (username, password) => {
    setValue('username', username);
    setValue('password', password);
    setLoginError(null);
  };

  // 返回上一页
  const handleBack = () => {
    $w.utils.navigateBack();
  };

  // 网络状态提示
  if (!isOnline) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">网络连接不可用</h2>
          <p className="text-gray-600 mb-4">请检查您的网络连接后重试</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        </div>
      </div>;
  }

  // 云函数不可用提示
  if (!cloudFunctionAvailable) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">登录服务暂不可用</h2>
          <p className="text-gray-600 mb-4">请联系系统管理员检查云函数部署状态</p>
          <Button onClick={checkCloudFunctionAvailability} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重新检查
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
                  },
                  maxLength: {
                    value: 20,
                    message: '用户名最多20个字符'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message: '用户名只能包含字母、数字、下划线和横线'
                  }
                })} placeholder="请输入用户名" className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500" disabled={loading} />
                </div>
                {errors.username && <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.username.message}
                  </p>}
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
                  },
                  maxLength: {
                    value: 30,
                    message: '密码最多30个字符'
                  }
                })} type={showPassword ? 'text' : 'password'} placeholder="请输入密码" className="pl-10 pr-12 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.password.message}
                  </p>}
              </div>

              {loginError && <Alert variant="destructive" className="animate-pulse">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>}

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" disabled={loading}>
                {loading ? <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    登录中...
                  </> : <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    登录
                  </>}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">快速测试账号：</p>
                <div className="grid grid-cols-1 gap-2">
                  <button type="button" onClick={() => fillTestAccount('admin', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50" disabled={loading}>
                    管理员: admin / 123456
                  </button>
                  <button type="button" onClick={() => fillTestAccount('student', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50" disabled={loading}>
                    学生: student / 123456
                  </button>
                  <button type="button" onClick={() => fillTestAccount('teacher', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50" disabled={loading}>
                    老师: teacher / 123456
                  </button>
                </div>
              </div>

              {loginError && retryCount < maxRetries && <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading} className="border-blue-500 text-blue-600 hover:bg-blue-50">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试 ({maxRetries - retryCount}次)
                  </Button>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
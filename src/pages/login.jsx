// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { User, Lock, Eye, EyeOff, Loader2, RefreshCw, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';

// @ts-ignore;
import { useForm } from 'react-hook-form';
// @ts-ignore;
import { ErrorHandler } from '@/components/ErrorHandler';
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
  const [isOnline, setIsOnline] = useState(true);
  const [cloudFunctionStatus, setCloudFunctionStatus] = useState('checking');
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    reset,
    setValue
  } = useForm();
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    checkCloudFunction();
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);
  const checkCloudFunction = async () => {
    try {
      await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: 'test',
          password: 'test'
        }
      });
      setCloudFunctionStatus('available');
    } catch (error) {
      console.error('云函数检查失败:', error);
      setCloudFunctionStatus('unavailable');
    }
  };
  const authenticateWithCloudFunction = async (username, password) => {
    try {
      if (!isOnline) {
        throw new Error('网络连接不可用，请检查您的网络设置');
      }
      if (cloudFunctionStatus === 'unavailable') {
        throw new Error('登录服务暂时无法访问，请稍后重试或联系管理员');
      }
      const result = await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: username.trim(),
          password: password.trim()
        }
      });

      // 完全对齐云函数返回格式
      if (!result || typeof result !== 'object') {
        throw new Error('服务器响应异常，请稍后重试');
      }
      switch (result.code) {
        case 0:
          if (!result.data || !result.data._id) {
            throw new Error('用户数据格式错误，请联系管理员');
          }
          return {
            success: true,
            user: result.data,
            message: result.message || '登录成功'
          };
        case 400:
          return {
            success: false,
            error: result.message || '输入信息有误，请检查后重试'
          };
        case 401:
          return {
            success: false,
            error: result.message || '用户名或密码错误，请重新输入'
          };
        case 500:
          return {
            success: false,
            error: '服务器繁忙，请稍后重试'
          };
        default:
          return {
            success: false,
            error: result.message || '登录失败，请稍后重试'
          };
      }
    } catch (error) {
      return {
        success: false,
        error: ErrorHandler.handleCloudFunctionError(error, () => {})
      };
    }
  };
  const onSubmit = async data => {
    setLoading(true);
    setLoginError(null);
    try {
      const result = await authenticateWithCloudFunction(data.username, data.password);
      if (result.success) {
        localStorage.setItem('userId', result.user._id);
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        localStorage.setItem('loginTime', new Date().toISOString());
        toast({
          title: '登录成功',
          description: `欢迎回来，${result.user.nickName || result.user.name || result.user.username}`,
          duration: 2000,
          className: 'bg-green-50 border-green-200'
        });
        setTimeout(() => {
          $w.utils.navigateTo({
            pageId: 'index',
            params: {
              from: 'login',
              userId: result.user._id,
              username: result.user.username,
              userType: result.user.type
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
      const errorMsg = ErrorHandler.handleCloudFunctionError(error, toast);
      setLoginError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  const fillTestAccount = (username, password) => {
    setValue('username', username);
    setValue('password', password);
    setLoginError(null);
  };
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
  if (cloudFunctionStatus === 'checking') {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">正在检查服务状态...</h2>
        </div>
      </div>;
  }
  if (cloudFunctionStatus === 'unavailable') {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">登录服务暂不可用</h2>
          <p className="text-gray-600 mb-4">请联系系统管理员检查云函数部署状态</p>
          <Button onClick={checkCloudFunction} variant="outline">
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
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {loginError && <Alert variant="destructive">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { User, Lock, Eye, EyeOff, Loader2, RefreshCw, CheckCircle, AlertCircle, WifiOff, Server } from 'lucide-react';

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
  const [serviceError, setServiceError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    reset,
    setValue
  } = useForm();

  // 网络状态监听
  useEffect(() => {
    const checkOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        checkCloudFunction();
      } else {
        setCloudFunctionStatus('offline');
      }
    };
    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  // 优化的云函数状态检查
  const checkCloudFunction = async () => {
    try {
      setCloudFunctionStatus('checking');
      setServiceError(null);

      // 使用轻量级健康检查
      const result = await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: 'healthcheck',
          password: 'healthcheck123'
        }
      });

      // 检查返回格式是否正确
      if (result && typeof result === 'object') {
        // 即使是认证失败（401）也说明服务是正常的
        if (result.code === 401 || result.code === 400 || result.code === 0) {
          setCloudFunctionStatus('available');
        } else {
          setCloudFunctionStatus('available');
        }
      } else {
        throw new Error('服务响应格式异常');
      }
    } catch (error) {
      console.error('服务检查失败:', error);

      // 详细错误分类
      let errorType = 'unknown';
      let errorMessage = '服务暂时不可用，请稍后重试';
      if (error.message?.includes('FUNCTION_NOT_FOUND')) {
        errorType = 'not_deployed';
        errorMessage = '登录服务未部署，请联系管理员';
      } else if (error.message?.includes('timeout')) {
        errorType = 'timeout';
        errorMessage = '连接超时，请检查网络连接';
      } else if (error.message?.includes('ECONNREFUSED')) {
        errorType = 'connection_refused';
        errorMessage = '无法连接到服务器，请稍后重试';
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorType = 'permission_denied';
        errorMessage = '权限不足，请联系管理员';
      } else if (error.message?.includes('NETWORK')) {
        errorType = 'network_error';
        errorMessage = '网络连接异常，请检查网络设置';
      } else {
        errorType = 'service_error';
        errorMessage = '服务异常，请稍后重试';
      }
      setServiceError({
        type: errorType,
        message: errorMessage,
        details: error.message
      });
      setCloudFunctionStatus('unavailable');
    }
  };

  // 获取服务状态提示
  const getServiceStatusMessage = () => {
    if (!isOnline) {
      return {
        title: '网络连接不可用',
        message: '请检查您的网络设置后重试',
        icon: <WifiOff className="w-12 h-12 text-red-500" />,
        actions: [{
          label: '刷新页面',
          onClick: () => window.location.reload(),
          variant: 'default'
        }]
      };
    }
    switch (cloudFunctionStatus) {
      case 'checking':
        return {
          title: '正在检查服务状态...',
          message: '请稍候，我们正在验证服务可用性',
          icon: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        };
      case 'available':
        return null;
      case 'unavailable':
        const actions = [{
          label: '重新检查',
          onClick: () => {
            setRetryCount(prev => prev + 1);
            checkCloudFunction();
          },
          variant: 'default'
        }];
        if (serviceError?.type === 'not_deployed') {
          actions.push({
            label: '联系技术支持',
            onClick: () => {
              toast({
                title: '技术支持',
                description: '请联系系统管理员部署登录服务',
                duration: 3000
              });
            },
            variant: 'outline'
          });
        }
        return {
          title: '服务暂时不可用',
          message: serviceError?.message || '请稍后重试',
          icon: <Server className="w-12 h-12 text-orange-500" />,
          actions
        };
      default:
        return null;
    }
  };

  // 使用云函数进行用户认证
  const authenticateWithCloudFunction = async (username, password) => {
    try {
      if (!isOnline) {
        throw new Error('网络连接不可用，请检查您的网络设置');
      }
      if (cloudFunctionStatus !== 'available') {
        throw new Error('登录服务暂时无法访问，请稍后重试');
      }
      const result = await $w.cloud.callFunction({
        name: 'login',
        data: {
          username: username.trim(),
          password: password.trim()
        }
      });

      // 严格验证返回格式
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
          className: 'bg-green-50 border-green-200 text-green-800'
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
  const statusMessage = getServiceStatusMessage();

  // 服务状态提示页面
  if (statusMessage && cloudFunctionStatus !== 'available') {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            {statusMessage.icon}
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mt-4 mb-3">{statusMessage.title}</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{statusMessage.message}</p>
          {retryCount > 0 && <p className="text-xs text-gray-500 mb-4">已尝试 {retryCount} 次</p>}
          {statusMessage.actions && <div className="flex justify-center space-x-3">
              {statusMessage.actions.map((action, index) => <Button key={index} onClick={action.onClick} variant={action.variant || 'default'} className="px-4 py-2 text-sm">
                {action.label}
              </Button>)}
            </div>}
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
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                })} placeholder="请输入用户名" className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg" disabled={loading || cloudFunctionStatus !== 'available'} />
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
                })} type={showPassword ? 'text' : 'password'} placeholder="请输入密码" className="pl-10 pr-12 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg" disabled={loading || cloudFunctionStatus !== 'available'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded" disabled={loading}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {loginError && <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{loginError}</AlertDescription>
                </Alert>}

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md" disabled={loading || cloudFunctionStatus !== 'available'}>
                {loading ? <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    登录中...
                  </> : <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    登录
                  </>}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">快速测试账号</p>
                <div className="grid grid-cols-1 gap-2">
                  <button type="button" onClick={() => fillTestAccount('admin', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50 border border-gray-200" disabled={loading || cloudFunctionStatus !== 'available'}>
                    管理员: admin / 123456
                  </button>
                  <button type="button" onClick={() => fillTestAccount('student', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50 border border-gray-200" disabled={loading || cloudFunctionStatus !== 'available'}>
                    学生: student / 123456
                  </button>
                  <button type="button" onClick={() => fillTestAccount('teacher', '123456')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50 border border-gray-200" disabled={loading || cloudFunctionStatus !== 'available'}>
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
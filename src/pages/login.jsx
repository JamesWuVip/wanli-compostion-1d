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

  // 使用数据模型进行用户认证
  const authenticateUser = async (username, password) => {
    try {
      // 查询用户数据模型（假设存在 users 数据模型）
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'users',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              $and: [{
                username: {
                  $eq: username
                }
              }, {
                password: {
                  $eq: password
                }
              }]
            }
          },
          select: {
            $master: true
          },
          pageSize: 1,
          pageNumber: 1
        }
      });
      if (result.records && result.records.length > 0) {
        const user = result.records[0];
        return {
          success: true,
          user: {
            userId: user._id,
            name: user.name || user.username,
            nickName: user.nickName || user.name || user.username,
            avatarUrl: user.avatarUrl || ''
          }
        };
      } else {
        return {
          success: false,
          error: '用户名或密码错误'
        };
      }
    } catch (error) {
      console.error('认证错误:', error);
      return {
        success: false,
        error: error.message || '认证失败'
      };
    }
  };

  // 模拟登录（当数据模型不存在时）
  const simulateLogin = async (username, password) => {
    // 模拟用户数据
    const mockUsers = [{
      userId: 'user_001',
      username: 'admin',
      password: '123456',
      name: '管理员',
      nickName: '管理员',
      avatarUrl: 'https://via.placeholder.com/100'
    }, {
      userId: 'user_002',
      username: 'student',
      password: '123456',
      name: '学生',
      nickName: '小明',
      avatarUrl: 'https://via.placeholder.com/100'
    }, {
      userId: 'user_003',
      username: 'teacher',
      password: '123456',
      name: '老师',
      nickName: '张老师',
      avatarUrl: 'https://via.placeholder.com/100'
    }];
    const user = mockUsers.find(u => u.username === username && u.password === password);
    if (user) {
      return {
        success: true,
        user: {
          userId: user.userId,
          name: user.name,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl
        }
      };
    } else {
      return {
        success: false,
        error: '用户名或密码错误'
      };
    }
  };

  // 处理登录提交
  const onSubmit = async data => {
    setLoading(true);
    setLoginError(null);
    try {
      let result;

      // 首先尝试使用数据模型认证
      try {
        result = await authenticateUser(data.username, data.password);
      } catch (modelError) {
        console.warn('数据模型认证失败，使用模拟登录:', modelError.message);
        // 如果数据模型不存在，使用模拟登录
        result = await simulateLogin(data.username, data.password);
      }
      if (result.success) {
        // 保存登录状态
        localStorage.setItem('userId', result.user.userId);
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        toast({
          title: '登录成功',
          description: `欢迎回来，${result.user.nickName || result.user.name}`
        });

        // 跳转到首页
        setTimeout(() => {
          $w.utils.navigateTo({
            pageId: 'index'
          });
        }, 1000);
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
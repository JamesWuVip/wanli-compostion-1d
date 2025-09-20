// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, useToast } from '@/components/ui';
// @ts-ignore;
import { MessageCircle, Phone, BookOpen } from 'lucide-react';

export default function Login(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const handleWeChatLogin = async () => {
    setLoading(true);
    try {
      // 模拟微信登录
      const mockUser = {
        userId: 'user_' + Date.now(),
        nickName: '微信用户',
        avatarUrl: 'https://via.placeholder.com/100'
      };
      localStorage.setItem('userId', mockUser.userId);
      localStorage.setItem('userInfo', JSON.stringify(mockUser));
      toast({
        title: '登录成功'
      });
      setTimeout(() => {
        $w.utils.navigateTo({
          pageId: 'index'
        });
      }, 1000);
    } catch (error) {
      toast({
        title: '登录失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePhoneLogin = async () => {
    setLoading(true);
    try {
      // 模拟手机号登录
      const mockUser = {
        userId: 'phone_' + Date.now(),
        nickName: '手机用户',
        avatarUrl: 'https://via.placeholder.com/100'
      };
      localStorage.setItem('userId', mockUser.userId);
      localStorage.setItem('userInfo', JSON.stringify(mockUser));
      toast({
        title: '登录成功'
      });
      setTimeout(() => {
        $w.utils.navigateTo({
          pageId: 'index'
        });
      }, 1000);
    } catch (error) {
      toast({
        title: '登录失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">作文批改助手</CardTitle>
          <CardDescription>选择登录方式开始使用</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={handleWeChatLogin} disabled={loading}>
            <MessageCircle className="w-4 h-4 mr-2" />
            微信一键登录
          </Button>
          
          <Button variant="outline" className="w-full" onClick={handlePhoneLogin} disabled={loading}>
            <Phone className="w-4 h-4 mr-2" />
            手机号登录
          </Button>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            登录即表示同意我们的服务条款
          </div>
        </CardContent>
      </Card>
    </div>;
}
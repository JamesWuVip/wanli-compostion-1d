// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';

export const ErrorHandler = {
  // 统一错误提示文案
  messages: {
    NETWORK_ERROR: '网络连接异常，请检查网络设置',
    SERVER_ERROR: '服务器繁忙，请稍后重试',
    UNAUTHORIZED: '登录已过期，请重新登录',
    NOT_FOUND: '请求的资源不存在',
    VALIDATION_ERROR: '输入信息有误，请检查后重试',
    TIMEOUT: '请求超时，请稍后重试',
    UNKNOWN: '操作失败，请稍后重试'
  },
  // 处理云函数错误
  handleCloudFunctionError: (error, toast) => {
    let message = ErrorHandler.messages.UNKNOWN;
    if (error.message?.includes('FUNCTION_NOT_FOUND')) {
      message = '服务未部署，请联系管理员';
    } else if (error.message?.includes('timeout')) {
      message = ErrorHandler.messages.TIMEOUT;
    } else if (error.message?.includes('网络')) {
      message = ErrorHandler.messages.NETWORK_ERROR;
    } else if (error.code === 400) {
      message = error.message || ErrorHandler.messages.VALIDATION_ERROR;
    } else if (error.code === 401) {
      message = error.message || ErrorHandler.messages.UNAUTHORIZED;
    } else if (error.code === 500) {
      message = ErrorHandler.messages.SERVER_ERROR;
    } else {
      message = error.message || message;
    }
    toast({
      title: '操作失败',
      description: message,
      variant: 'destructive',
      duration: 4000
    });
    return message;
  },
  // 处理数据模型错误
  handleDataSourceError: (error, toast) => {
    let message = ErrorHandler.messages.UNKNOWN;
    if (error.code === 'INVALID_PARAM') {
      message = ErrorHandler.messages.VALIDATION_ERROR;
    } else if (error.code === 'PERMISSION_DENIED') {
      message = ErrorHandler.messages.UNAUTHORIZED;
    } else if (error.code === 'NOT_FOUND') {
      message = ErrorHandler.messages.NOT_FOUND;
    } else {
      message = error.message || message;
    }
    toast({
      title: '操作失败',
      description: message,
      variant: 'destructive',
      duration: 4000
    });
    return message;
  }
};
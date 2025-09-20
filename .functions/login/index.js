
    'use strict';
    
    const cloudbase = require('@cloudbase/node-sdk');
    
    exports.main = async (event, context) => {
      try {
        // 初始化云开发环境
        const app = cloudbase.init({
          env: cloudbase.SYMBOL_CURRENT_ENV
        });
        
        // 获取数据模型
        const models = app.models;
        
        // 解析请求参数
        const { username, password } = event;
        
        // 参数验证
        if (!username || !password) {
          return {
            code: 400,
            message: '用户名和密码不能为空'
          };
        }
        
        // 查询用户记录
        const result = await models.essay_correction_records.list({
          filter: {
            where: {
              username: {
                $eq: username
              },
              password: {
                $eq: password
              }
            }
          },
          select: {
            exclude: ['password'] // 排除密码字段
          }
        });
        
        // 检查查询结果
        if (!result.data || !result.data.records || result.data.records.length === 0) {
          return {
            code: 1,
            message: '用户名或密码错误'
          };
        }
        
        // 获取用户信息（第一条匹配记录）
        const userInfo = result.data.records[0];
        
        // 返回成功响应
        return {
          code: 0,
          message: '登录成功',
          data: userInfo
        };
        
      } catch (error) {
        console.error('登录云函数执行错误:', error);
        
        // 返回服务器错误
        return {
          code: 500,
          message: '服务器内部错误'
        };
      }
    };
  
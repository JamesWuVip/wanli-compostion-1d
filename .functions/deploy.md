
# 云函数部署指南

## 部署步骤

### 1. 登录云开发控制台
访问：https://tcb.cloud.tencent.com/dev

### 2. 创建云函数
1. 进入"云函数"页面
2. 点击"新建云函数"
3. 函数名称：login
4. 运行环境：Node.js 12.16
5. 内存：128MB
6. 超时时间：5秒

### 3. 上传代码
1. 将以下文件上传到云函数：
   - index.js
   - package.json

### 4. 安装依赖
云开发会自动安装 package.json 中的依赖

### 5. 测试函数
使用测试参数：
```json
{
  "username": "admin",
  "password": "123456"
}
```

### 6. 预期返回
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "_id": "admin_001",
    "username": "admin",
    "name": "管理员",
    "nickName": "超级管理员",
    "avatarUrl": "https://ui-avatars.com/api/?name=管理员&background=0ea5e9&color=fff",
    "type": "admin"
  }
}
```

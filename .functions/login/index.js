
// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 数据库实例
const db = cloud.database()
const _ = db.command

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    console.log('登录请求参数:', event)
    
    // 参数验证
    if (!event.username || !event.password) {
      return {
        code: 400,
        message: '用户名和密码不能为空',
        data: null
      }
    }
    
    // 查询用户
    const userResult = await db.collection('users')
      .where({
        username: event.username,
        password: event.password // 注意：生产环境应使用加密密码
      })
      .limit(1)
      .get()
    
    console.log('用户查询结果:', userResult)
    
    if (userResult.data && userResult.data.length > 0) {
      const user = userResult.data[0]
      
      // 更新最后登录时间
      await db.collection('users').doc(user._id).update({
        data: {
          lastLoginTime: new Date(),
          loginCount: _.inc(1)
        }
      })
      
      // 返回用户信息（不包含密码）
      const userInfo = {
        _id: user._id,
        username: user.username,
        name: user.name || user.username,
        nickName: user.nickName || user.name || user.username,
        avatarUrl: user.avatarUrl || '',
        type: user.type || 'student',
        createdAt: user.createdAt,
        lastLoginTime: new Date()
      }
      
      return {
        code: 0,
        message: '登录成功',
        data: userInfo
      }
    } else {
      return {
        code: 401,
        message: '用户名或密码错误',
        data: null
      }
    }
    
  } catch (error) {
    console.error('登录云函数执行错误:', error)
    
    return {
      code: 500,
      message: '服务器内部错误',
      data: null,
      error: error.message
    }
  }
}


// 云函数类型定义
export interface LoginRequest {
  username: string
  password: string
}

export interface UserInfo {
  _id: string
  username: string
  name: string
  nickName: string
  avatarUrl?: string
  type: 'admin' | 'teacher' | 'student'
  createdAt: Date
  lastLoginTime: Date
}

export interface LoginResponse {
  code: number
  message: string
  data: UserInfo | null
  error?: string
}


// 统一数据模型调用封装
export const dataService = {
  // 用户相关
  users: {
    // 获取用户信息
    async getUserById(userId, $w) {
      return await $w.cloud.callDataSource({
        dataSourceName: 'users',
        methodName: 'wedaGetItemV2',
        params: {
          filter: { where: { _id: { $eq: userId } } },
          select: { $master: true }
        }
      });
    },

    // 更新用户信息
    async updateUser(userId, data, $w) {
      return await $w.cloud.callDataSource({
        dataSourceName: 'users',
        methodName: 'wedaUpdateV2',
        params: {
          filter: { where: { _id: { $eq: userId } } },
          data
        }
      });
    }
  },

  // 作文批改记录相关
  essayRecords: {
    // 创建记录
    async createRecord(record, $w) {
      return await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaCreateV2',
        params: { data: record }
      });
    },

    // 获取用户记录列表
    async getUserRecords(userId, page = 1, pageSize = 10, $w) {
      return await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: { where: { user_id: { $eq: userId } } },
          select: { $master: true },
          orderBy: [{ createdAt: 'desc' }],
          pageNumber: page,
          pageSize: pageSize,
          getCount: true
        }
      });
    },

    // 获取单条记录详情
    async getRecordDetail(recordId, $w) {
      return await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaGetItemV2',
        params: {
          filter: { where: { _id: { $eq: recordId } } },
          select: { $master: true }
        }
      });
    },

    // 更新记录
    async updateRecord(recordId, data, $w) {
      return await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaUpdateV2',
        params: {
          filter: { where: { _id: { $eq: recordId } } },
          data
        }
      });
    },

    // 删除记录
    async deleteRecord(recordId, $w) {
      return await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaDeleteV2',
        params: {
          filter: { where: { _id: { $eq: recordId } } }
        }
      });
    }
  }
};

// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Checkbox, useToast, Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, Badge, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { Search, Trash2, Heart, Share2, CheckSquare, Square, Star, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function History(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const pageSize = 10;
  const userId = localStorage.getItem('userId');
  useEffect(() => {
    if (!userId) {
      toast({
        title: '请先登录',
        description: '登录后可查看历史记录',
        variant: 'destructive'
      });
      $w.utils.navigateTo({
        pageId: 'login'
      });
      return;
    }
    loadRecords();
  }, [currentPage, searchTerm, filterFavorite]);
  const validateRecordData = record => {
    if (!record || typeof record !== 'object') {
      return false;
    }
    // 验证必要字段
    const requiredFields = ['_id', 'user_id', 'title', 'original_text', 'score', 'grade', 'createdAt'];
    return requiredFields.every(field => record[field] !== undefined && record[field] !== null);
  };
  const formatDate = date => {
    if (!date) return '未知时间';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '无效时间';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  const getScoreColor = score => {
    if (typeof score !== 'number' || score < 0) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  const getGradeColor = grade => {
    switch (grade) {
      case '优秀':
        return 'bg-green-100 text-green-800';
      case '良好':
        return 'bg-blue-100 text-blue-800';
      case '中等':
        return 'bg-yellow-100 text-yellow-800';
      case '及格':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const loadRecords = async () => {
    try {
      setLoading(true);
      setApiError(null);

      // 构建查询条件
      const filter = {
        where: {
          user_id: {
            $eq: userId
          }
        }
      };

      // 添加收藏筛选
      if (filterFavorite) {
        filter.where.is_favorite = {
          $eq: true
        };
      }

      // 添加搜索条件
      if (searchTerm.trim()) {
        filter.where.$or = [{
          title: {
            $search: searchTerm.trim()
          }
        }, {
          search_text: {
            $search: searchTerm.trim()
          }
        }, {
          original_text: {
            $search: searchTerm.trim()
          }
        }];
      }
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter,
          select: {
            $master: true
          },
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize,
          pageNumber: currentPage,
          getCount: true
        }
      });

      // 验证返回数据
      if (!result || typeof result !== 'object') {
        throw new Error('查询结果格式错误');
      }
      if (!Array.isArray(result.records)) {
        throw new Error('记录列表格式错误');
      }

      // 验证每条记录数据
      const validRecords = result.records.filter(record => {
        const isValid = validateRecordData(record);
        if (!isValid) {
          console.warn('发现无效记录:', record);
        }
        return isValid;
      });
      setRecords(validRecords);
      setTotalPages(Math.ceil((result.total || 0) / pageSize));

      // 重置重试计数
      setRetryCount(0);
    } catch (error) {
      console.error('加载历史记录错误:', error);
      setApiError(error.message || '加载历史记录失败');
      toast({
        title: '加载失败',
        description: error.message || '请检查网络连接后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      loadRecords();
    } else {
      toast({
        title: '重试次数已达上限',
        description: '请检查网络连接或稍后重试',
        variant: 'destructive'
      });
    }
  };
  const handleRecordClick = record => {
    if (batchMode) {
      handleSelectRecord(record._id);
    } else {
      $w.utils.navigateTo({
        pageId: 'history_detail',
        params: {
          recordId: record._id
        }
      });
    }
  };
  const handleSelectRecord = recordId => {
    setSelectedRecords(prev => prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]);
  };
  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(r => r._id));
    }
  };
  const handleBatchDelete = async () => {
    if (selectedRecords.length === 0) {
      toast({
        title: '请选择要删除的记录'
      });
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedRecords.length} 条记录吗？此操作不可恢复。`)) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaBatchDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $in: selectedRecords
              },
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
      toast({
        title: '批量删除成功',
        description: `已删除 ${selectedRecords.length} 条记录`
      });
      setSelectedRecords([]);
      setBatchMode(false);
      loadRecords();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleBatchFavorite = async favorite => {
    if (selectedRecords.length === 0) {
      toast({
        title: '请选择要操作的记录'
      });
      return;
    }
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaBatchUpdateV2',
        params: {
          data: {
            is_favorite: favorite
          },
          filter: {
            where: {
              _id: {
                $in: selectedRecords
              },
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
      toast({
        title: favorite ? '批量收藏成功' : '批量取消收藏成功',
        description: `已${favorite ? '收藏' : '取消收藏'} ${selectedRecords.length} 条记录`
      });
      setSelectedRecords([]);
      loadRecords();
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleToggleFavorite = async (recordId, currentFavorite) => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            is_favorite: !currentFavorite
          },
          filter: {
            where: {
              _id: {
                $eq: recordId
              },
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
      loadRecords();
      toast({
        title: !currentFavorite ? '已收藏' : '已取消收藏'
      });
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleShare = recordId => {
    const shareUrl = `${window.location.origin}/history_detail?recordId=${recordId}&shared=true`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: '分享链接已复制',
      description: '链接已复制到剪贴板，可以分享给他人查看'
    });
  };
  const handleDelete = async recordId => {
    if (!confirm('确定要删除这条记录吗？此操作不可恢复。')) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: recordId
              },
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
      toast({
        title: '删除成功'
      });
      loadRecords();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">加载历史记录中...</div>
        </div>
      </div>;
  }
  if (apiError) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">加载历史记录失败</div>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
          <div className="space-x-2">
            <Button onClick={handleRetry} disabled={retryCount >= maxRetries} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试 {retryCount < maxRetries && `(${maxRetries - retryCount})`}
            </Button>
            <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setFilterFavorite(false);
            setApiError(null);
            loadRecords();
          }}>
              清除筛选
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">历史记录</h1>
            <Button variant={batchMode ? "default" : "outline"} size="sm" onClick={() => {
            setBatchMode(!batchMode);
            setSelectedRecords([]);
          }}>
              {batchMode ? '退出批量' : '批量操作'}
            </Button>
          </div>
          
          <div className="flex space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="搜索标题或内容..." value={searchTerm} onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }} className="pl-10" />
            </div>
            
            <Button variant={filterFavorite ? "default" : "outline"} size="sm" onClick={() => {
            setFilterFavorite(!filterFavorite);
            setCurrentPage(1);
          }} className={filterFavorite ? 'bg-yellow-500 hover:bg-yellow-600' : ''}>
              <Star className={`w-4 h-4 mr-2 ${filterFavorite ? 'fill-current' : ''}`} />
              收藏
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {records.length === 0 ? <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterFavorite ? '没有找到符合条件的记录' : '暂无批改记录'}
              </p>
              <div className="space-x-2">
                {(searchTerm || filterFavorite) && <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setFilterFavorite(false);
            }}>
                    清除筛选
                  </Button>}
                {!searchTerm && !filterFavorite && <Button onClick={() => $w.utils.navigateTo({
              pageId: 'camera'
            })}>
                    开始拍照批改
                  </Button>}
              </div>
            </CardContent>
          </Card> : <>
            <div className="space-y-4">
              {records.map(record => <Card key={record._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRecordClick(record)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {batchMode && <Checkbox checked={selectedRecords.includes(record._id)} onClick={e => e.stopPropagation()} onCheckedChange={() => handleSelectRecord(record._id)} />}
                          <h3 className="font-semibold text-lg">{record.title || '未命名作文'}</h3>
                          {record.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getScoreColor(record.score || 0)}>
                            {record.score || 0}分
                          </Badge>
                          <Badge className={getGradeColor(record.grade)}>
                            {record.grade || '未评定'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {record.search_text || record.original_text?.substring(0, 100) || '无内容预览'}
                          {(record.search_text || record.original_text)?.length > 100 && '...'}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(record.createdAt)}
                        </div>
                      </div>
                      
                      {!batchMode && <div className="flex space-x-1 ml-4">
                          <Button variant="ghost" size="sm" onClick={e => {
                    e.stopPropagation();
                    handleToggleFavorite(record._id, record.is_favorite);
                  }}>
                            <Star className={`w-4 h-4 ${record.is_favorite ? 'text-yellow-500 fill-current' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={e => {
                    e.stopPropagation();
                    handleShare(record._id);
                  }}>
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={e => {
                    e.stopPropagation();
                    handleDelete(record._id);
                  }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>}
                    </div>
                  </CardContent>
                </Card>)}
            </div>

            {totalPages > 1 && <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
                  </PaginationItem>
                  
                  {Array.from({
              length: totalPages
            }, (_, i) => i + 1).map(page => <PaginationItem key={page}>
                      <PaginationLink onClick={() => setCurrentPage(page)} isActive={page === currentPage}>
                        {page}
                      </PaginationLink>
                    </PaginationItem>)}
                  
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>}
          </>}
      </div>

      {batchMode && selectedRecords.length > 0 && <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedRecords.length === records.length ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                全选
              </Button>
              <span className="text-sm text-gray-600">
                已选择 {selectedRecords.length} 条
              </span>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleBatchFavorite(true)}>
                <Star className="w-4 h-4 mr-2" />
                批量收藏
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchFavorite(false)}>
                <Star className="w-4 h-4 mr-2" />
                批量取消
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                批量删除
              </Button>
            </div>
          </div>
        </div>}
    </div>;
}
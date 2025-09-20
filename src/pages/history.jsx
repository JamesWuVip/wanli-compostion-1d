// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Checkbox, useToast, Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui';
// @ts-ignore;
import { Search, Trash2, Heart, Share2, CheckSquare, Square } from 'lucide-react';

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
  const pageSize = 10;
  const userId = localStorage.getItem('userId');
  useEffect(() => {
    if (!userId) {
      $w.utils.navigateTo({
        pageId: 'login'
      });
      return;
    }
    loadRecords();
  }, [currentPage, searchTerm]);
  const formatDate = date => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  const loadRecords = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: userId
              },
              ...(searchTerm ? {
                $or: [{
                  title: {
                    $search: searchTerm
                  }
                }, {
                  search_text: {
                    $search: searchTerm
                  }
                }]
              } : {})
            }
          },
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
      setRecords(result.records || []);
      setTotalPages(Math.ceil((result.total || 0) / pageSize));
    } catch (error) {
      toast({
        title: '加载失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
    if (!confirm(`确定要删除选中的 ${selectedRecords.length} 条记录吗？`)) return;
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
        title: '批量删除成功'
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
        title: favorite ? '批量收藏成功' : '批量取消收藏成功'
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
      title: '分享链接已复制'
    });
  };
  const handleDelete = async recordId => {
    if (!confirm('确定要删除这条记录吗？')) return;
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
        <div className="text-gray-500">加载中...</div>
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
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="搜索标题或内容..." value={searchTerm} onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }} className="pl-10" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {records.length === 0 ? <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">暂无记录</p>
            </CardContent>
          </Card> : <>
            <div className="space-y-4">
              {records.map(record => <Card key={record._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRecordClick(record)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {batchMode && <Checkbox checked={selectedRecords.includes(record._id)} onClick={e => e.stopPropagation()} onCheckedChange={() => handleSelectRecord(record._id)} />}
                          <h3 className="font-semibold">{record.title}</h3>
                          {record.is_favorite && <Heart className="w-4 h-4 text-red-500 fill-current" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {record.search_text?.substring(0, 100)}...
                        </p>
                        <div className="text-xs text-gray-500">
                          {formatDate(record.createdAt)}
                          <span className="ml-2">得分：{record.score}分</span>
                        </div>
                      </div>
                      
                      {!batchMode && <div className="flex space-x-1 ml-4">
                          <Button variant="ghost" size="sm" onClick={e => {
                    e.stopPropagation();
                    handleToggleFavorite(record._id, record.is_favorite);
                  }}>
                            <Heart className={`w-4 h-4 ${record.is_favorite ? 'text-red-500 fill-current' : ''}`} />
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
                <Heart className="w-4 h-4 mr-2" />
                批量收藏
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchFavorite(false)}>
                <Heart className="w-4 h-4 mr-2" />
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
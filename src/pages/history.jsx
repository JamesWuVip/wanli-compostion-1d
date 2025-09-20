// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { Calendar, Clock, Star, Trash2, Eye, Loader2, Filter } from 'lucide-react';

// @ts-ignore;
import { dataService } from '@/lib/dataService';
// @ts-ignore;
import { ErrorHandler } from '@/components/ErrorHandler';
export default function History(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, favorite
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  useEffect(() => {
    loadRecords();
  }, [filter, page]);
  const loadRecords = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        $w.utils.navigateTo({
          pageId: 'login'
        });
        return;
      }
      const result = await dataService.essayRecords.getUserRecords(userId, page, pageSize, $w);
      if (result.records) {
        let filteredRecords = result.records;
        if (filter === 'favorite') {
          filteredRecords = filteredRecords.filter(r => r.is_favorite);
        }
        setRecords(filteredRecords);
        setTotal(result.total || 0);
        setHasMore(filteredRecords.length === pageSize);
      }
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    } finally {
      setLoading(false);
    }
  };
  const handleViewDetail = recordId => {
    $w.utils.navigateTo({
      pageId: 'history_detail',
      params: {
        recordId
      }
    });
  };
  const handleDelete = async recordId => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await dataService.essayRecords.deleteRecord(recordId, $w);
      toast({
        title: '删除成功',
        description: '记录已删除',
        duration: 2000
      });
      loadRecords();
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    }
  };
  const handleToggleFavorite = async record => {
    try {
      const newFavorite = !record.is_favorite;
      await dataService.essayRecords.updateRecord(record._id, {
        is_favorite: newFavorite
      }, $w);
      loadRecords();
      toast({
        title: newFavorite ? '已收藏' : '已取消收藏',
        duration: 2000
      });
    } catch (error) {
      ErrorHandler.handleDataSourceError(error, toast);
    }
  };
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const getScoreColor = score => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  if (loading && records.length === 0) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">批改历史</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => {
            setFilter('all');
            setPage(1);
          }}>
              全部
            </Button>
            <Button variant={filter === 'favorite' ? 'default' : 'outline'} size="sm" onClick={() => {
            setFilter('favorite');
            setPage(1);
          }}>
              <Star className="w-4 h-4 mr-1" />
              收藏
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            共 {total} 条记录
          </div>
        </div>

        {records.length === 0 ? <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">暂无批改记录</p>
            <Button onClick={() => $w.utils.navigateTo({
          pageId: 'camera'
        })}>
              去拍照批改
            </Button>
          </div> : <div className="space-y-4">
            {records.map(record => <Card key={record._id} className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">{record.title || '未命名作文'}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(record.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(record.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2 line-clamp-2">{record.original_text || record.ocr_text}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Badge className={`${getScoreColor(record.score || 0)}`}>
                        {record.score || 0}分
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleFavorite(record)} className={record.is_favorite ? 'text-yellow-500' : 'text-gray-400'}>
                          <Star className={`w-4 h-4 ${record.is_favorite ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(record._id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(record._id)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>}

        {hasMore && records.length > 0 && <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setPage(page + 1)} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              加载更多
            </Button>
          </div>}
      </main>
    </div>;
}
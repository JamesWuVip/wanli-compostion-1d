// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Download, Heart, Share2, Trash2 } from 'lucide-react';

export default function HistoryDetail(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const userId = localStorage.getItem('userId');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  useEffect(() => {
    loadRecord();
  }, []);
  const formatDate = date => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  const loadRecord = async () => {
    try {
      const recordId = $w.page.dataset.params?.recordId;
      const isShared = $w.page.dataset.params?.shared === 'true';
      if (!recordId) {
        toast({
          title: '记录不存在',
          variant: 'destructive'
        });
        return;
      }
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: recordId
              },
              ...(isShared ? {} : {
                user_id: {
                  $eq: userId
                }
              })
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (result) {
        setRecord(result);
        setIsFavorite(result.is_favorite || false);
      } else {
        toast({
          title: '记录不存在或无权限',
          variant: 'destructive'
        });
      }
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
  const handleExportPDF = () => {
    if (!record) return;
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>${record.title} - 作文批改详情</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .section { 
              margin-bottom: 30px; 
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .meta { 
              color: #666; 
              margin-bottom: 20px; 
              font-size: 14px;
            }
            .content { 
              line-height: 1.8; 
              padding: 15px;
              background: #f9f9f9;
              border-radius: 5px;
              margin: 10px 0;
            }
            .annotation { 
              background: #fff3cd; 
              padding: 15px; 
              margin: 10px 0; 
              border-left: 4px solid #ffc107;
              border-radius: 5px;
            }
            .score {
              font-size: 18px;
              font-weight: bold;
              color: #007bff;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>作文批改详情</h1>
          </div>
          
          <div class="section">
            <div class="title">${record.title}</div>
            <div class="meta">
              批改时间：${formatDate(record.createdAt)}
              <br>
              <span class="score">得分：${record.score}分 (${record.grade})</span>
            </div>
          </div>
          
          <div class="section">
            <h2>原文</h2>
            <div class="content">${record.original_text}</div>
          </div>
          
          <div class="section">
            <h2>批改结果</h2>
            <div class="content">${record.annotated_text}</div>
          </div>
          
          <div class="section">
            <h2>评语</h2>
            <div class="annotation">${record.feedback}</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };
  const handleToggleFavorite = async () => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            is_favorite: !isFavorite
          },
          filter: {
            where: {
              _id: {
                $eq: record._id
              },
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? '已取消收藏' : '已收藏'
      });
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/history_detail?recordId=${record._id}&shared=true`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: '分享链接已复制'
    });
  };
  const handleDelete = async () => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'essay_correction_records',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: record._id
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
      setTimeout(() => {
        $w.utils.navigateBack();
      }, 1000);
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
  if (!record) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">记录不存在</div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => $w.utils.navigateBack()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 mr-4">
                <img src={userInfo.avatarUrl || 'https://via.placeholder.com/32'} alt="avatar" className="w-8 h-8 rounded-full" />
                <span className="text-sm text-gray-600">{userInfo.nickName || '用户'}</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                导出PDF
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleToggleFavorite} className={isFavorite ? 'text-red-500' : ''}>
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? '已收藏' : '收藏'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{record.title}</CardTitle>
            <div className="text-sm text-gray-600 mt-2">
              <p>批改时间：{formatDate(record.createdAt)}</p>
              <p>得分：{record.score}分 ({record.grade})</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">原文</h3>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {record.original_text}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">批改结果</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div dangerouslySetInnerHTML={{
                __html: record.annotated_text
              }} />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">评语</h3>
              <div className="bg-yellow-50 p-4 rounded-lg whitespace-pre-wrap">
                {record.feedback}
              </div>
            </div>
            
            {record.image_url && <div>
                <h3 className="text-lg font-semibold mb-2">原始图片</h3>
                <img src={record.image_url} alt="作文图片" className="max-w-md rounded-lg border" />
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}
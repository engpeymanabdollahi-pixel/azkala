import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban, Search, Filter, Loader2, X, Unlock, ChevronLeft, ChevronRight,
  Users, Calendar, AlertTriangle, TrendingUp, Shield, UserX,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface Block {
  id: number;
  user_id: number;
  blocked_user_id: number;
  reason: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  blockedUser?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface BlockStats {
  total: number;
  today: number;
  week: number;
  month: number;
  by_reason: Record<string, number>;
  most_blocked_users: Array<{
    id: number;
    name: string;
    email: string;
    blocked_count: number;
  }>;
  most_blockers: Array<{
    id: number;
    name: string;
    email: string;
    block_count: number;
  }>;
}

// ==================== Main Component ====================

export function AdminBlocksPage() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<BlockStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [reasonFilter, setReasonFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockUserId, setBlockUserId] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // ==================== Loaders ====================
  const loadBlocks = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/blocks', {
        params: {
          reason: reasonFilter !== 'all' ? reasonFilter : undefined,
          search: searchQuery || undefined,
          page: currentPage,
        },
      });
      if (res.data.success) {
        setBlocks(res.data.data.blocks);
        setTotalPages(res.data.data.pagination.last_page);
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری لیست بلاک‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/admin/blocks/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadBlocks();
    loadStats();
  }, [currentPage, reasonFilter]);

  // ==================== Handlers ====================
  const handleSearch = () => {
    setCurrentPage(1);
    loadBlocks();
  };

  const handleUnblock = async (blockId: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این کاربر را آنبلاک کنید؟')) return;

    try {
      const res = await apiClient.delete(`/admin/blocks/${blockId}`);
      if (res.data.success) {
        toast.success('کاربر آنبلاک شد');
        loadBlocks();
        loadStats();
      }
    } catch (error) {
      toast.error('خطا در آنبلاک کردن');
    }
  };

  const handleBlockByAdmin = async () => {
    if (!blockUserId.trim() || !blockReason.trim()) {
      toast.error('لطفاً ID کاربر و دلیل را وارد کنید');
      return;
    }

    setIsBlocking(true);
    try {
      const res = await apiClient.post('/admin/blocks/block', {
        blocked_user_id: parseInt(blockUserId),
        reason: blockReason,
      });
      if (res.data.success) {
        toast.success('کاربر بلاک شد');
        setShowBlockModal(false);
        setBlockUserId('');
        setBlockReason('');
        loadBlocks();
        loadStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در بلاک کردن');
    } finally {
      setIsBlocking(false);
    }
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <Ban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">مدیریت بلاک کاربران</h1>
            <p className="text-sm text-gray-500 mt-1">مشاهده و مدیریت کاربران بلاک شده</p>
          </div>
        </div>
        <Button
          onClick={() => setShowBlockModal(true)}
          className="gap-1.5 bg-red-500 hover:bg-red-600 text-white"
        >
          <UserX className="w-4 h-4" />
          بلاک کاربر جدید
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">کل بلاک‌ها</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-orange-600">{stats.today.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">بلاک امروز</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-600">{stats.week.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">بلاک هفته</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-purple-600">{stats.month.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">بلاک ماه</p>
          </div>
        </div>
      )}

      {/* Top Lists */}
      {stats && (stats.most_blocked_users.length > 0 || stats.most_blockers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Most Blocked Users */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              بیشترین کاربران بلاک‌شده
            </h3>
            <div className="space-y-2">
              {stats.most_blocked_users.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{user.name}</span>
                  </div>
                  <Badge variant="error" size="sm">{user.blocked_count} بار</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Most Blockers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              بیشترین کاربران بلاک‌کننده
            </h3>
            <div className="space-y-2">
              {stats.most_blockers.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{user.name}</span>
                  </div>
                  <Badge variant="primary" size="sm">{user.block_count} بار</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در نام کاربران..."
              className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="all">همه دلایل</option>
            <option value="spam">اسپم</option>
            <option value="harassment">آزار و اذیت</option>
            <option value="inappropriate">محتوای نامناسب</option>
            <option value="scam">کلاهبرداری</option>
            <option value="other">سایر</option>
          </select>
          <Button onClick={handleSearch} className="w-full">
            <Filter className="w-4 h-4" />
            اعمال فیلتر
          </Button>
        </div>
      </div>

      {/* Blocks List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Ban className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-bold">بلاکی یافت نشد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {blocks.map((block) => (
              <div key={block.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="error" size="sm">
                        <Ban className="w-3 h-3" />
                        بلاک شده
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(block.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {block.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">بلاک‌کننده</p>
                          <p className="text-sm font-bold text-gray-900">{block.user?.name || 'ناشناس'}</p>
                        </div>
                      </div>

                      <div className="text-gray-400">→</div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {block.blockedUser?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">بلاک‌شده</p>
                          <p className="text-sm font-bold text-red-600">{block.blockedUser?.name || 'ناشناس'}</p>
                        </div>
                      </div>
                    </div>

                    {block.reason && (
                      <div className="bg-gray-50 rounded-lg p-2 text-xs">
                        <span className="font-bold text-gray-700">دلیل:</span>
                        <span className="text-gray-600 ml-1">{block.reason}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(block.id)}
                    className="gap-1 flex-shrink-0 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Unlock className="w-4 h-4" />
                    آنبلاک
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>
            <span className="text-sm text-gray-600">
              صفحه {currentPage} از {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= totalPages}
              className="gap-1"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-4 border-b bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-6 h-6" />
                <h2 className="font-black text-lg">بلاک کاربر جدید</h2>
              </div>
              <button
                onClick={() => setShowBlockModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ID کاربر</label>
                <input
                  type="number"
                  value={blockUserId}
                  onChange={(e) => setBlockUserId(e.target.value)}
                  placeholder="شناسه عددی کاربر..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">دلیل بلاک</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="دلیل بلاک کردن..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 resize-none"
                  maxLength={500}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBlockModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleBlockByAdmin}
                  disabled={isBlocking}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {isBlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  بلاک کردن
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
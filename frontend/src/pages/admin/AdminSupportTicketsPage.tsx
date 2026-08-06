import React, { useState, useEffect, useRef } from 'react';
import { adminTicketService, type AdminTicket, type TicketMessage, type TicketStats } from '../../services/api/adminTicket.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { faCalendar, faUser, faCheckCircle, faClock, faTimesCircle, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AdminSupportTicketsPage: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // دریافت لیست تیکت‌ها
  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['admin-tickets', statusFilter],
    queryFn: () => adminTicketService.getTickets(statusFilter),
  });

  // ✅ قبلاً اینجا `ticketsData?.data` مستقیم به‌عنوان آرایه استفاده می‌شد،
  // در حالی که بکند {tickets, pagination, stats} برمی‌گرداند — یعنی
  // tickets.map(...) با TypeError کرش می‌کرد و کل تب تیکت‌های پشتیبانی
  // برای هر ادمینی که این صفحه را باز می‌کرد از کار می‌افتاد.
  const tickets: AdminTicket[] = ticketsData?.data?.tickets || [];
  const stats: TicketStats | undefined = ticketsData?.data?.stats;

  // دریافت جزئیات تیکت انتخاب‌شده
  const { data: ticketDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['admin-ticket', selectedTicketId],
    queryFn: () => selectedTicketId ? adminTicketService.getTicketDetails(selectedTicketId) : null,
    enabled: !!selectedTicketId,
  });

  // اسکرول خودکار به پایین پیام‌ها
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketDetails?.data?.messages]);

  // Mutation برای ارسال پیام
  const sendMessageMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      adminTicketService.sendMessage(id, message),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });

  // Mutation برای تغییر وضعیت
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AdminTicket['status'] }) =>
      adminTicketService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    sendMessageMutation.mutate({ id: selectedTicketId, message: replyText });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">باز</span>;
      case 'in_progress': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">در حال بررسی</span>;
      case 'resolved': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">حل شده</span>;
      case 'closed': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">بسته شده</span>;
      default: return null;
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const messages: TicketMessage[] = ticketDetails?.data?.messages || [];

  return (
    <div className="space-y-4">
      {/* ✅ قبلاً stats از پاسخ index() گرفته می‌شد ولی هیچ‌جای صفحه نمایش
          داده نمی‌شد. */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xl font-black text-gray-900 dark:text-gray-100">{stats.total.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">کل تیکت‌ها</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xl font-black text-green-600 dark:text-green-400">{stats.open.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">باز</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xl font-black text-yellow-600 dark:text-yellow-400">{stats.in_progress.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">در حال بررسی</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xl font-black text-error-600 dark:text-error-400">{stats.urgent.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">فوری</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xl font-black text-gray-600 dark:text-gray-300">{stats.unassigned.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">بدون پشتیبان</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xl font-black text-primary-600 dark:text-primary-400">{stats.avg_response_time.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">میانگین پاسخ (دقیقه)</p>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-260px)] min-h-[500px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">

        {/* ستون راست: لیست تیکت‌ها */}
        <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">تیکت‌های پشتیبانی</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('')}
                className={`flex-1 py-1.5 text-sm rounded-md transition ${!statusFilter ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                همه
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`flex-1 py-1.5 text-sm rounded-md transition ${statusFilter === 'open' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                باز
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`flex-1 py-1.5 text-sm rounded-md transition ${statusFilter === 'in_progress' ? 'bg-yellow-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                در حال بررسی
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`flex-1 py-1.5 text-sm rounded-md transition ${statusFilter === 'closed' ? 'bg-gray-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                بسته
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingTickets ? (
              <div className="flex justify-center items-center h-32 text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faSpinner} spin className="ml-2" /> در حال بارگذاری...
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faCheckCircle} className="text-3xl mb-2 text-gray-300 dark:text-gray-600" />
                <p>تیکتی یافت نشد</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/40 ${selectedTicketId === ticket.id ? 'bg-primary-50 dark:bg-primary-900/20 border-r-4 border-r-primary-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate flex-1">{ticket.subject}</h3>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
                    <span className="flex items-center gap-1"><FontAwesomeIcon icon={faUser} /> {ticket.user?.name || 'کاربر'}</span>
                    <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCalendar} /> {format(new Date(ticket.created_at), 'yyyy/MM/dd')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ستون چپ: محیط چت و پاسخ‌دهی */}
        <div className="w-2/3 flex flex-col bg-gray-50 dark:bg-gray-900">
          {selectedTicket ? (
            <>
              {/* هدر تیکت انتخاب شده */}
              <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">کاربر: {selectedTicket.user?.name} | ایمیل: {selectedTicket.user?.email}</p>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'closed' })}
                      className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> بستن تیکت
                    </button>
                  )}
                  {selectedTicket.status === 'closed' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'open' })}
                      className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> بازگشایی
                    </button>
                  )}
                </div>
              </div>

              {/* لیست پیام‌ها */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingDetails ? (
                  <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">در حال بارگذاری پیام‌ها...</div>
                ) : (
                  messages.map((msg) => {
                    const isAdminMessage = msg.user?.role === 'admin';
                    return (
                      <div key={msg.id} className={`flex ${isAdminMessage ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${isAdminMessage ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tr-none text-gray-900 dark:text-gray-100' : 'bg-primary-600 text-white rounded-tl-none'}`}>
                          <div className="flex justify-between items-center gap-4 mb-1">
                            <span className="text-xs font-bold opacity-80">{isAdminMessage ? 'پشتیبانی ازکالا' : msg.user?.name || 'کاربر'}</span>
                            <span className="text-[10px] opacity-70">{format(new Date(msg.created_at), 'HH:mm')}</span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* فرم ارسال پاسخ */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را اینجا بنویسید..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    disabled={sendMessageMutation.isPending || selectedTicket.status === 'closed'}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendMessageMutation.isPending || selectedTicket.status === 'closed'}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold"
                  >
                    {sendMessageMutation.isPending ? 'در حال ارسال...' : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} />
                        ارسال
                      </>
                    )}
                  </button>
                </form>
                {selectedTicket.status === 'closed' && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">این تیکت بسته شده است. برای پاسخ‌دهی ابتدا آن را بازگشایی کنید.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <FontAwesomeIcon icon={faClock} className="text-6xl mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">یک تیکت را از لیست سمت راست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportTicketsPage;

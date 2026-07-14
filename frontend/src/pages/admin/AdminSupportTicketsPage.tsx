import React, { useState, useEffect, useRef } from 'react';
import { adminTicketService, AdminTicket, TicketMessage } from '../../services/api/adminTicket.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { faCalendar, faUser, faCheckCircle, faClock, faTimesCircle, faPaperPlane, faFilter } from '@fortawesome/free-solid-svg-icons';
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

  const tickets: AdminTicket[] = ticketsData?.data || [];

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
    mutationFn: ({ id, status }: { id: number; status: 'open' | 'pending' | 'closed' }) => 
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
      case 'open': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">باز</span>;
      case 'pending': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">در حال بررسی</span>;
      case 'closed': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">بسته شده</span>;
      default: return null;
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const messages: TicketMessage[] = ticketDetails?.data?.messages || [];

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      
      {/* ستون راست: لیست تیکت‌ها */}
      <div className="w-1/3 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-3">تیکت‌های پشتیبانی</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setStatusFilter('')}
              className={`flex-1 py-1.5 text-sm rounded-md transition ${!statusFilter ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              همه
            </button>
            <button 
              onClick={() => setStatusFilter('open')}
              className={`flex-1 py-1.5 text-sm rounded-md transition ${statusFilter === 'open' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              باز
            </button>
            <button 
              onClick={() => setStatusFilter('closed')}
              className={`flex-1 py-1.5 text-sm rounded-md transition ${statusFilter === 'closed' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              بسته
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingTickets ? (
            <div className="flex justify-center items-center h-32 text-gray-500">در حال بارگذاری...</div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <FontAwesomeIcon icon={faCheckCircle} className="text-3xl mb-2 text-gray-300" />
              <p>تیکتی یافت نشد</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${selectedTicketId === ticket.id ? 'bg-primary-50 border-r-4 border-r-primary-600' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm truncate flex-1">{ticket.subject}</h3>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="flex items-center text-xs text-gray-500 gap-3">
                  <span className="flex items-center gap-1"><FontAwesomeIcon icon={faUser} /> {ticket.user?.name || 'کاربر'}</span>
                  <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCalendar} /> {format(new Date(ticket.created_at), 'yyyy/MM/dd')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ستون چپ: محیط چت و پاسخ‌دهی */}
      <div className="w-2/3 flex flex-col bg-gray-50">
        {selectedTicket ? (
          <>
            {/* هدر تیکت انتخاب شده */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500">کاربر: {selectedTicket.user?.name} | ایمیل: {selectedTicket.user?.email}</p>
              </div>
              <div className="flex gap-2">
                {selectedTicket.status !== 'closed' && (
                  <button 
                    onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'closed' })}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTimesCircle} /> بستن تیکت
                  </button>
                )}
                {selectedTicket.status === 'closed' && (
                  <button 
                    onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'open' })}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} /> بازگشایی
                  </button>
                )}
              </div>
            </div>

            {/* لیست پیام‌ها */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingDetails ? (
                <div className="flex justify-center items-center h-full text-gray-500">در حال بارگذاری پیام‌ها...</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${msg.is_admin ? 'bg-white border border-gray-200 rounded-tr-none' : 'bg-primary-600 text-white rounded-tl-none'}`}>
                      <div className="flex justify-between items-center gap-4 mb-1">
                        <span className="text-xs font-bold opacity-80">{msg.is_admin ? 'پشتیبانی ازکالا' : msg.user?.name || 'کاربر'}</span>
                        <span className="text-[10px] opacity-70">{format(new Date(msg.created_at), 'HH:mm')}</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* فرم ارسال پاسخ */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ خود را اینجا بنویسید..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  disabled={sendMessageMutation.isPending || selectedTicket.status === 'closed'}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendMessageMutation.isPending || selectedTicket.status === 'closed'}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold"
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
                <p className="text-center text-sm text-gray-500 mt-2">این تیکت بسته شده است. برای پاسخ‌دهی ابتدا آن را بازگشایی کنید.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <FontAwesomeIcon icon={faClock} className="text-6xl mb-4 text-gray-300" />
            <p className="text-lg font-medium">یک تیکت را از لیست سمت راست انتخاب کنید</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportTicketsPage;
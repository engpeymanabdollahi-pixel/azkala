<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\ChatReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportExportController extends Controller
{
    /**
     * Export گزارش سفارشات به Excel
     */
    public function exportOrdersExcel(Request $request)
    {
        try {
            $query = Order::with(['user:id,name,email', 'items.product:id,name']);

            // فیلتر بر اساس تاریخ
            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // فیلتر بر اساس وضعیت
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $orders = $query->orderByDesc('created_at')->get();

            $data = $orders->map(function ($order) {
                return [
                    'شماره سفارش' => $order->order_number,
                    'مشتری' => $order->user->name ?? 'ناشناس',
                    'ایمیل' => $order->user->email ?? '-',
                    'مبلغ کل' => number_format($order->total),
                    'وضعیت' => $this->getStatusLabel($order->status),
                    'تعداد اقلام' => $order->items->count(),
                    'تاریخ' => $order->created_at->format('Y-m-d H:i'),
                ];
            })->toArray();

            $filename = 'orders_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            
            return Excel::download(new \Maatwebsite\Excel\Sheet($data), $filename);
        } catch (\Exception $e) {
            Log::error('ReportExportController@exportOrdersExcel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Export: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export گزارش سفارشات به PDF
     */
    public function exportOrdersPdf(Request $request)
    {
        try {
            $query = Order::with(['user:id,name,email', 'items.product:id,name']);

            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $orders = $query->orderByDesc('created_at')->limit(100)->get();

            $pdf = Pdf::loadView('exports.orders', [
                'orders' => $orders,
                'title' => 'گزارش سفارشات',
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
            ]);

            $filename = 'orders_' . now()->format('Y-m-d_H-i-s') . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('ReportExportController@exportOrdersPdf: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Export: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export گزارش کاربران به Excel
     */
    public function exportUsersExcel(Request $request)
    {
        try {
            $query = User::query();

            if ($request->filled('role') && $request->role !== 'all') {
                $query->where('role', $request->role);
            }
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('is_active', $request->status === 'active');
            }

            $users = $query->orderByDesc('created_at')->get();

            $data = $users->map(function ($user) {
                return [
                    'شناسه' => $user->id,
                    'نام' => $user->name,
                    'ایمیل' => $user->email,
                    'تلفن' => $user->phone ?? '-',
                    'نقش' => $this->getRoleLabel($user->role),
                    'وضعیت' => $user->is_active ? 'فعال' : 'غیرفعال',
                    'تاریخ عضویت' => $user->created_at->format('Y-m-d'),
                ];
            })->toArray();

            $filename = 'users_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            return Excel::download(new \Maatwebsite\Excel\Sheet($data), $filename);
        } catch (\Exception $e) {
            Log::error('ReportExportController@exportUsersExcel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Export: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export گزارش چت‌ها به Excel
     */
    public function exportChatExcel(Request $request)
    {
        try {
            $query = Conversation::with([
                'buyer:id,name,email',
                'seller:id,name,shop_name',
                'product:id,name',
            ]);

            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            $conversations = $query->orderByDesc('created_at')->get();

            $data = $conversations->map(function ($conv) {
                return [
                    'شناسه' => $conv->id,
                    'خریدار' => $conv->buyer->name ?? 'ناشناس',
                    'فروشنده' => $conv->seller->name ?? 'ناشناس',
                    'محصول' => $conv->product->name ?? '-',
                    'وضعیت' => $conv->is_active ? 'فعال' : 'بسته شده',
                    'تاریخ' => $conv->created_at->format('Y-m-d H:i'),
                ];
            })->toArray();

            $filename = 'chat_conversations_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            return Excel::download(new \Maatwebsite\Excel\Sheet($data), $filename);
        } catch (\Exception $e) {
            Log::error('ReportExportController@exportChatExcel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Export: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export گزارش محصولات به Excel
     */
    public function exportProductsExcel(Request $request)
    {
        try {
            $query = Product::query();

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            $products = $query->orderByDesc('created_at')->get();

            $data = $products->map(function ($product) {
                return [
                    'شناسه' => $product->id,
                    'نام' => $product->name,
                    'قیمت' => number_format($product->price),
                    'تخفیف' => $product->discount_price ? number_format($product->discount_price) : '-',
                    'موجودی' => $product->stock,
                    'تعداد فروش' => $product->sales_count ?? 0,
                    'وضعیت' => $product->is_active ? 'فعال' : 'غیرفعال',
                ];
            })->toArray();

            $filename = 'products_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            return Excel::download(new \Maatwebsite\Excel\Sheet($data), $filename);
        } catch (\Exception $e) {
            Log::error('ReportExportController@exportProductsExcel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Export: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export گزارش گزارش‌های تخلف به Excel
     */
    public function exportReportsExcel(Request $request)
    {
        try {
            $query = ChatReport::with([
                'reporter:id,name',
                'reportedUser:id,name',
            ]);

            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $reports = $query->orderByDesc('created_at')->get();

            $data = $reports->map(function ($report) {
                return [
                    'شناسه' => $report->id,
                    'گزارش‌دهنده' => $report->reporter->name ?? 'ناشناس',
                    'متخلف' => $report->reportedUser->name ?? 'ناشناس',
                    'دلیل' => $report->reason,
                    'توضیحات' => $report->description ?? '-',
                    'وضعیت' => $this->getReportStatusLabel($report->status),
                    'تاریخ' => $report->created_at->format('Y-m-d H:i'),
                ];
            })->toArray();

            $filename = 'chat_reports_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            return Excel::download(new \Maatwebsite\Excel\Sheet($data), $filename);
        } catch (\Exception $e) {
            Log::error('ReportExportController@exportReportsExcel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Export: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export گزارش کامل (Summary) به PDF
     */
    public function exportSummaryPdf(Request $request)
    {
        try {
            $period = (int) $request->get('period', 30);
            $startDate = now()->subDays($period);

            $stats = [
                'total_orders' => Order::where('created_at', '>=', $startDate)->count(),
                'total_revenue' => Order::where('created_at', '>=', $startDate)->sum('total'),
                'total_users' => User::where('created_at', '>=', $startDate)->count(),
                'total_products' => Product::count(),
                'total_conversations' => Conversation::where('created_at', '>=', $startDate)->count(),
                'total_messages' => Message::where('created_at', '>=', $startDate)->count(),
                'total_reports' => ChatReport::where('created_at', '>=', $startDate)->count(),
            ];

            $pdf = Pdf::loadView('exports.summary', [
                'stats' => $stats,
                'period' => $period,
                'title' => 'گزارش خلاصه عملکرد',
            ]);

            $filename = 'summary_report_' . now()->format('Y-m-d_H-i-s') . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('ReportExportController@exportSummaryPdf: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Export: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ==================== Helper Methods ====================

    private function getStatusLabel($status)
    {
        $labels = [
            'pending' => 'در انتظار',
            'processing' => 'در حال پردازش',
            'shipped' => 'ارسال شده',
            'delivered' => 'تحویل شده',
            'cancelled' => 'لغو شده',
        ];
        return $labels[$status] ?? $status;
    }

    private function getRoleLabel($role)
    {
        $labels = [
            'customer' => 'مشتری',
            'seller' => 'فروشنده',
            'admin' => 'مدیر',
        ];
        return $labels[$role] ?? $role;
    }

    private function getReportStatusLabel($status)
    {
        $labels = [
            'pending' => 'در انتظار',
            'reviewed' => 'بررسی شده',
            'resolved' => 'حل شده',
            'dismissed' => 'رد شده',
        ];
        return $labels[$status] ?? $status;
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\BulkProductService;
use App\Exports\BulkProductTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class BulkProductController extends Controller
{
    protected BulkProductService $bulkService;
    
    public function __construct(BulkProductService $bulkService)
    {
        $this->bulkService = $bulkService;
    }
    
    /**
     * Download Excel template
     * GET /seller/products/bulk/template
     */
    public function downloadTemplate()
    {
        return Excel::download(
            new BulkProductTemplate(), 
            'azkala-bulk-template-' . date('Y-m-d') . '.xlsx'
        );
    }
    
    /**
     * Validate uploaded file
     * POST /seller/products/bulk/validate
     */
    public function validateFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB
        ]);
        
        try {
            $sellerId = $request->user()->id;
            $result = $this->bulkService->validateFile($request->file('file'), $sellerId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'valid_count' => count($result['valid']),
                    'error_count' => count($result['errors']),
                    'valid' => $result['valid'],
                    'errors' => $result['errors'],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Bulk validation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در پردازش فایل: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Commit validated products
     * POST /seller/products/bulk/commit
     */
    public function commit(Request $request)
    {
        $validated = $request->validate([
            'valid_rows' => 'required|array',
            'valid_rows.*.row' => 'required|integer',
            'valid_rows.*.data' => 'required|array',
        ]);
        
        try {
            $sellerId = $request->user()->id;
            $result = $this->bulkService->createProducts($validated['valid_rows'], $sellerId);
            
            return response()->json([
                'success' => true,
                'message' => count($result['created']) . ' محصول با موفقیت ایجاد شد',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('Bulk commit failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ایجاد محصولات: ' . $e->getMessage(),
            ], 500);
        }
    }
}
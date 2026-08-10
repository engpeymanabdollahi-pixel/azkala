<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiContentService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAiArticleController extends Controller
{
    private AiContentService $aiService;

    public function __construct(AiContentService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'topic' => 'required|string|min:5|max:500',
            'category' => ['nullable', Rule::in(['news', 'review', 'comparison', 'guide', 'rumor'])],
        ]);

        $result = $this->aiService->generateArticle(
            $validated['topic'],
            $validated['category'] ?? 'news'
        );

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'مقاله با موفقیت تولید شد',
        ]);
    }

    public function rewrite(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|min:50',
        ]);

        $result = $this->aiService->rewriteArticle($validated['content']);

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'محتوا با موفقیت بازنویسی شد',
        ]);
    }

    public function suggestTitle(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|min:20',
        ]);

        $result = $this->aiService->suggestTitle($validated['content']);

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'عنوان‌های پیشنهادی آماده شدند',
        ]);
    }
}
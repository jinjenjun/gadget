<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ProtectionController extends Controller
{
    public function index()
    {
        return Inertia::render('Protection/Index');
    }

    public function pdfProtection(Request $request): JsonResponse
    {
        try {
            // ✅ 驗證
            $request->validate([
                'file' => 'required|file|mimes:pdf',
            ]);

            $file = $request->file('file');
            if (!$file) {
                return response()->json(['message' => '沒有上傳檔案'], 400);
            }

            // ✅ 建立資料夾
            $inputDir = public_path('public-doc/text-file/input');
            $outputDir = public_path('public-doc/text-file/output');

            if (!is_dir($inputDir)) mkdir($inputDir, 0755, true);
            if (!is_dir($outputDir)) mkdir($outputDir, 0755, true);

            // ✅ 安全檔名
            $original = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $safeName = Str::slug($original) . '-' . time() . '-' . Str::random(6);

            $inputPath = $inputDir . '/' . $safeName . '.pdf';
            $outputPath = $outputDir . '/' . $safeName . '.pdf';

            // ✅ 存檔
            $file->move($inputDir, $safeName . '.pdf');

            // ✅ Node（🔥 關鍵：不要寫死路徑）
            $node = 'node';

            // ✅ script
            $script = base_path('resources/js/Libs/pdf_protection.cjs');

            if (!file_exists($script)) {
                return response()->json([
                    'message' => '找不到 pdf_protection.cjs',
                ], 500);
            }

            // 🔥 核心：用字串 command（解決 Windows 空白 + 參數問題）
            $cmd = "\"$node\" \"$script\" \"$inputPath\" \"$outputPath\"";

            $process = proc_open(
                $cmd,
                [
                    1 => ['pipe', 'w'],
                    2 => ['pipe', 'w'],
                ],
                $pipes
            );

            if (!is_resource($process)) {
                Log::error('無法啟動 Node', ['cmd' => $cmd]);
                return response()->json([
                    'message' => '無法啟動 Node 腳本',
                ], 500);
            }

            // ✅ 讀輸出
            $stdout = stream_get_contents($pipes[1]);
            fclose($pipes[1]);

            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[2]);

            $returnVar = proc_close($process);

            // 🔥 Debug（超重要）
            Log::info('PDF Node Debug', [
                'cmd' => $cmd,
                'stdout' => $stdout,
                'stderr' => $stderr,
                'return' => $returnVar,
            ]);

            // ❌ Node 執行錯
            if ($returnVar !== 0) {
                return response()->json([
                    'message' => 'PDF 處理失敗',
                    'stdout'  => $stdout,
                    'stderr'  => $stderr,
                    'return'  => $returnVar,
                ], 500);
            }

            // ❌ 沒輸出檔
            if (!file_exists($outputPath)) {
                return response()->json([
                    'message' => 'PDF 處理完成但找不到輸出檔案',
                    'stdout'  => $stdout,
                    'stderr'  => $stderr,
                ], 500);
            }

            // ✅ 成功
            return response()->json([
                'message' => 'PDF 處理成功',
                'pdf_url' => asset('public-doc/text-file/output/' . basename($outputPath)),
                'stdout'  => $stdout,
                'stderr'  => $stderr,
            ]);

        } catch (\Throwable $e) {
            Log::error("PDF 處理例外", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'PDF 處理發生例外',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function clearPDFTempFiles(): JsonResponse
    {
        $inputDir = public_path('public-doc/text-file/input');
        $outputDir = public_path('public-doc/text-file/output');

        $deleted = ['input' => 0, 'output' => 0];

        try {
            if (is_dir($inputDir)) {
                foreach (\File::files($inputDir) as $file) {
                    if (strtolower($file->getExtension()) === 'pdf') {
                        @\File::delete($file->getRealPath());
                        $deleted['input']++;
                    }
                }
            }

            if (is_dir($outputDir)) {
                foreach (\File::files($outputDir) as $file) {
                    if (strtolower($file->getExtension()) === 'pdf') {
                        @\File::delete($file->getRealPath());
                        $deleted['output']++;
                    }
                }
            }

            return response()->json([
                'message' => '暫存檔已清空',
                'deleted' => $deleted,
            ]);

        } catch (\Throwable $e) {
            Log::error("清除 PDF 暫存錯誤", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => '清除暫存檔案失敗',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}

<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProtectionController extends Controller
{
    public function index()
    {
        return Inertia::render('Protection/Index');
    }

    public function pdfProtection(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf',
        ]);

        $inputDir = public_path('public-doc/text-file/input');
        $outputDir = public_path('public-doc/text-file/output');

        if (!is_dir($inputDir)) {
            mkdir($inputDir, 0755, true);
        }
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $original = pathinfo($request->file('file')->getClientOriginalName(), PATHINFO_FILENAME);

        $safeName = Str::slug($original) . '-' . time() . '-' . Str::random(6);

        $inputPath = $inputDir . '/' . $safeName . '.pdf';
        $outputPath = $outputDir . '/' . $safeName . '.pdf';

        $request->file('file')->move($inputDir, $safeName . '.pdf');


        $node = 'node';

        $script = base_path('resources/js/Libs/pdf_protection.js');

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
            return response()->json([
                'message' => '無法啟動 Node 腳本',
            ], 500);
        }

        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        $returnVar = proc_close($process);

        if ($returnVar !== 0 || !file_exists($outputPath)) {
            return response()->json([
                'message' => 'PDF 處理失敗',
                'stdout'  => $stdout,
                'stderr'  => $stderr,
                'return'  => $returnVar,
            ], 500);
        }

        return response()->json([
            'message' => 'PDF 處理成功',
            'pdf_url' => asset('public-doc/text-file/output/' . basename($outputPath)),
            'stdout'  => $stdout,
            'stderr'  => $stderr,
        ]);
    }

    public function clearPDFTempFiles(): JsonResponse
    {
        $inputDir = public_path('public-doc/text-file/input');
        $outputDir = public_path('public-doc/text-file/output');

        $deleted = [
            'input'  => 0,
            'output' => 0,
        ];

        if (is_dir($inputDir)) {
            foreach (\File::files($inputDir) as $file) {
                if (in_array(strtolower($file->getExtension()), ['pdf'])) {
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
    }
}




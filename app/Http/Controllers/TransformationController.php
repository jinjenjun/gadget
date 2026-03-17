<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class TransformationController extends Controller
{
    public function index()
    {
        return Inertia::render('Transformation/Index');
    }

    public function epubTransformation(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:epub',
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
        $safeName = Str::slug($original) . '-' . time();

        $inputPath = $inputDir . '/' . $safeName . '.epub';
        $outputPath = $outputDir . '/' . $safeName . '.epub';

        $request->file('file')->move($inputDir, $safeName . '.epub');

        $node = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN'
            ? 'C:\\Program Files\\nodejs\\node.exe'
            : '/usr/bin/node';

        $script = base_path('resources/js/Libs/epub_transformation.js');

        $process = proc_open(
            [$node, $script, $inputPath, $outputPath],
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
                'message' => 'EPUB 處理失敗',
                'stdout'  => $stdout,
                'stderr'  => $stderr,
                'return'  => $returnVar,
            ], 500);
        }

        return response()->json([
            'message'  => 'EPUB 處理成功',
            'epub_url' => asset('public-doc/text-file/output/' . basename($outputPath)),
            'stdout'   => $stdout,
            'stderr'   => $stderr,
        ]);
    }

    public function clearEpubTempFiles(): JsonResponse
    {
        $inputDir = public_path('public-doc/text-file/input');
        $outputDir = public_path('public-doc/text-file/output');

        $deleted = [
            'input'  => 0,
            'output' => 0,
        ];

        if (is_dir($inputDir)) {
            foreach (\File::files($inputDir) as $file) {
                if (in_array(strtolower($file->getExtension()), ['doc', 'docx', 'epub'])) {
                    @\File::delete($file->getRealPath());
                    $deleted['input']++;
                }
            }
        }

        if (is_dir($outputDir)) {
            foreach (\File::files($outputDir) as $file) {
                if (strtolower($file->getExtension()) === 'epub') {
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

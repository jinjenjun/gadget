<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TransformationController extends Controller
{
    public function index()
    {
        return Inertia::render('Transformation/Index');
    }

    public function transform(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        $text = $request->input('text');
        $transformed = strtoupper($text);

        // ✅ 回傳 JSON
        return response()->json([
            'original' => $text,
            'transformed' => $transformed,
        ]);
    }
}

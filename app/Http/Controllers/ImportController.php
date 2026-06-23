<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\Parts; // Your Employee model
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Reader\Xls;

use Illuminate\Support\Facades\Auth;

class ImportController extends Controller
{

 public function index()
    {
        return view('students.dimport');
    }

     
    
    /**
     * Import employees from Excel file with streaming progress
     */
    public function importEmployees(Request $request)
{
    set_time_limit(300);
    ini_set('max_execution_time', 300);
    $userId = Auth::id();


    if (ob_get_level()) { ob_end_clean(); }

    header('Content-Type: application/json');
    header('X-Accel-Buffering: no');
    header('Cache-Control: no-cache');

    ini_set('output_buffering', 'off');
    ini_set('zlib.output_compression', 'off');
    if (function_exists('apache_setenv')) {
        apache_setenv('no-gzip', '1');
    }

    // ✅ Shared helper — generates ref, logs real error, returns safe message
    $safeError = function(string $context, \Exception $e, array $extra = []): array {
        $ref = strtoupper(substr(md5(uniqid('', true)), 0, 8));
        Log::error($context . ' [Ref: ' . $ref . ']', array_merge([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], $extra));
        return [
            'ref'     => $ref,
            'message' => 'An unexpected error occurred. (Ref: ' . $ref . ')'
        ];
    };

    try {
        $request->validate([
            'excelFile' => 'required|file|mimes:xlsx,xls|max:10240',
            'customer' => 'required|string|max:255',
            'model' => 'required|string|max:255'
        ]);

        $file     = $request->file('excelFile');
        $customer     = $request->input('customer');
        $model     = $request->input('model');
        $filePath = $file->getRealPath();
        $ext      = strtolower($file->getClientOriginalExtension());

        $reader      = ($ext === 'xls') ? new Xls() : new Xlsx();
        $spreadsheet = $reader->load($filePath);
        $sheet       = $spreadsheet->getActiveSheet();
        $rows        = $sheet->toArray();

        if (count($rows) <= 1) {
            echo json_encode([
                "status"  => "error",
                "message" => "Excel file appears empty or missing data rows."
            ]);
            return;
        }

        $header       = array_shift($rows);
        $total        = count($rows);
        $current      = 0;
        $successCount = 0;
        $errorCount   = 0;
        $errors       = [];

       

        DB::beginTransaction();

        foreach ($rows as $rowIndex => $row) {
            $current++;

            

            try {
                $partno   = $this->getCellValue($row, 0);
                $pdesc    = $this->getCellValue($row, 1);
                $quantity    = $this->getCellValue($row, 2);
                

                if (!$partno) { continue; }

               

                Parts::updateOrCreate(
                    ['partnum' => $partno],
                    [
                        'FirstName'  => $pdesc,
                        'partdesc'   => $pdesc,
                        'customer'     => $customer,
                        'model' => $model,
                        'quantity' => $quantity
                    ]
                );

                

                $successCount++;

            } catch (\Exception $e) {
                $errorCount++;

                // ✅ Line 220 fix — ref logged server-side, generic message to client
                $ref = strtoupper(substr(md5(uniqid('', true)), 0, 8));
                Log::error("Import row error [Ref: $ref]", [
                    'row'   => $rowIndex + 2,
                    'error' => $e->getMessage()  // ✅ server log only
                ]);

                // ✅ Client only sees row number and ref — no exception internals
                $errors[] = "Row " . ($rowIndex + 2) . ": Processing failed. (Ref: $ref)";
            }

            if ($current % 50 === 0 || $current === $total) {
                echo json_encode([
                    "status"   => "progress",
                    "progress" => round(($current / $total) * 100),
                    "message"  => "Processed $current of $total rows",
                    "success"  => $successCount,
                    "errors"   => $errorCount
                ]) . "\n";

                if (ob_get_level() > 0) { ob_flush(); }
                flush();
            }
        }

        DB::commit();

Log::info('Parts import completed', [
    'total_rows' => $total,
    'success'    => $successCount,
    'errors'     => $errorCount
]);

$finalMessage = [
    "status"               => "success",
    "message"              => "Import complete. " . (!empty($duplicateRows)
                                ? count($duplicateRows) . " duplicate rows skipped."
                                : ""),
    "total"                => $total,
    "success"              => $successCount,
    "errors"               => $errorCount,
    "has_duplicate_report" => !empty($duplicateRows),
];

if (!empty($errors) && count($errors) <= 10) {
    $finalMessage['error_details'] = $errors;
}

return response()->json($finalMessage);

} catch (\Illuminate\Validation\ValidationException $e) {
    DB::rollBack();

    return response()->json([
        "status"  => "error",
        "message" => "Invalid file upload.",
        "details" => $e->errors()
    ], 422);

} catch (\Exception $e) {
    DB::rollBack();

    $safe = $safeError('Import failed', $e, ['user_id' => $userId]);

    return response()->json([
        "status"    => "error",
        "message"   => "Import failed. Please try again. (Ref: " . $safe['ref'] . ")",
        "reference" => $safe['ref']
    ], 500);
}
}


    /**
     * Get cell value helper
     */
    private function getCellValue($row, $index)
    {
        return isset($row[$index]) && trim($row[$index]) !== '' ? trim($row[$index]) : null;
    }

    /**
     * Clear import-related cache
     */
    private function clearImportCache()
    {
        try {
            // Clear Laravel cache
            Cache::tags(['periods', 'pname', 'statutory', 'staff'])->flush();
            
            // Clear file-based cache if exists
            $cacheDir = sys_get_temp_dir();
            $cacheFiles = glob($cacheDir . '/{periods,pname,statutory,staff}_*.json', GLOB_BRACE);
            foreach ($cacheFiles as $file) {
                @unlink($file);
            }
        } catch (\Exception $e) {
            Log::warning('Cache clear warning', ['error' => $e->getMessage()]);
        }
    }

   

    /**
     * Download sample Excel template
     */
    public function downloadTemplate()
{
    $headers = [
        'Agent ID',
        'Full Name', 
        'Swift Code',
        'Bank Name',
        'Bank Code',
        'Account Number',
        'KRA PIN',
        'Email'
    ];

    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    
    // Alternative approach: Set headers using fromArray() method
    $sheet->fromArray($headers, null, 'A1');

    // Add sample data
    $sampleData = [
        ['EMP001', 'John Doe', 'BANKXXX', 'Example Bank', '68', '1234567890', 'A123456789X', 'example@mail.com'],
        ['EMP002', 'Jane Smith', 'BANKYYY', 'Sample Bank', '01', '0987654321', 'B987654321Y', 'example@mail.com']
    ];
    
    // Add sample data starting from row 2
    $sheet->fromArray($sampleData, null, 'A2');

    // Auto-size columns for all columns (A to H since you have 8 columns)
    foreach (range('A', 'H') as $column) {
        $sheet->getColumnDimension($column)->setAutoSize(true);
    }

    // Create writer
    $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
    
    // Generate filename and save to temp file
    $fileName = 'agent_import_template_' . date('Y-m-d') . '.xlsx';
    $tempFile = tempnam(sys_get_temp_dir(), 'excel') . '.xlsx';
    
    $writer->save($tempFile);

    return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
}
}
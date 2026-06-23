<?php

namespace App\Http\Controllers;

use App\Services\RolesReportPDFService;
use Illuminate\Http\Request;

class RolesReportController extends Controller
{
    protected $pdfService;

    public function __construct(RolesReportPDFService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function generateReport()
    {
        try {
            $pdf = $this->pdfService->generateReport();
            return $this->pdfService->outputPDF($pdf);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to generate report: ' . $e->getMessage());
        }
    }

    // Optional: Download instead of display
    public function downloadReport()
    {
        try {
            $pdf = $this->pdfService->generateReport();
            $pdf->Output('D', 'Roles_Report_' . date('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to download report: ' . $e->getMessage());
        }
    }
}
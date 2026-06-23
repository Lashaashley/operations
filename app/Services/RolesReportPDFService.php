<?php

namespace App\Services;

use App\Models\Roles;
use App\Models\Rmodules;
use App\Models\ModuleAsd;
use App\Models\User;
use App\Models\Button;
use Illuminate\Support\Facades\DB;

class RolesReportPDFService
{
    private $schoolDetails;
    private $logoPath;

    public function __construct()
    {
        $this->schoolDetails = DB::table('cstructure')->first();
        $this->logoPath = public_path('logo.png'); // Adjust path as needed
        
        if (!class_exists('FPDF')) {
            require_once base_path('fpdf/fpdf.php');
        }
    }

    public function generateReport()
    {
        $rolesData = $this->getRolesData();

        // Create PDF instance
        $pdf = new RolesReportPDF('L', 'mm', 'A4', $this->schoolDetails, $this->logoPath);
        $pdf->setHeading('Roles and Users Report');
        $pdf->AddPage();
        $pdf->SetFont('Arial', '', 10);

        // Generate report content
        foreach ($rolesData as $roleData) {
            $this->addRoleSection($pdf, $roleData);
        }

        // Add summary page
        $this->addSummaryPage($pdf, $rolesData);

        return $pdf;
    }

    private function addRoleSection($pdf, $roleData)
    {
        // Role Header
        $pdf->SetFillColor(200, 220, 255);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 8, 'Role: ' . $roleData['rolename'], 1, 1, 'L', true);
        
        // Role Description
        if (!empty($roleData['rdesc'])) {
            $pdf->SetFont('Arial', 'I', 9);
            $pdf->MultiCell(0, 6, 'Description: ' . $roleData['rdesc'], 1);
        }
        
        $pdf->Ln(2);

        // Modules Section
        $this->addModulesSection($pdf, $roleData['modules']);
        
        $pdf->Ln(2);

        // Users Section
        $this->addUsersSection($pdf, $roleData['users']);
        
        $pdf->Ln(5);
    }

    private function addModulesSection($pdf, $modules)
    {
        $pdf->SetFont('Arial', 'B', 10);
        $pdf->SetFillColor(230, 230, 230);
        $pdf->Cell(0, 7, 'Associated Modules (' . count($modules) . ')', 1, 1, 'L', true);
        
        if (!empty($modules)) {
            $pdf->SetFont('Arial', '', 9);
            foreach ($modules as $module) {
                $pdf->Cell(10, 6, '', 'LR', 0);
                $pdf->Cell(0, 6, '- ' . $module, 'R', 1);
            }
            $pdf->Cell(0, 0, '', 'T');
        } else {
            $pdf->SetFont('Arial', 'I', 9);
            $pdf->Cell(0, 6, 'No modules assigned to this role', 1, 1);
        }
    }

    private function addUsersSection($pdf, $users)
    {
        $pdf->SetFont('Arial', 'B', 10);
        $pdf->SetFillColor(230, 230, 230);
        $pdf->Cell(0, 7, 'Users in this Role (' . count($users) . ')', 1, 1, 'L', true);
        
        if (!empty($users)) {
            $pdf->SetFont('Arial', '', 9);
            
            // Table header
            $pdf->SetFillColor(200, 200, 200);
            $pdf->Cell(15, 6, 'No.', 1, 0, 'C', true);
            $pdf->Cell(60, 6, 'User Name', 1, 0, 'L', true);
            $pdf->Cell(50, 6, 'User ID', 1, 1, 'L', true);
            
            // Table rows
            $count = 1;
            foreach ($users as $user) {
                $pdf->Cell(15, 6, $count++, 1, 0, 'C');
                $pdf->Cell(60, 6, $user['name'], 1, 0, 'L');
                $pdf->Cell(50, 6, $user['id'], 1, 1, 'L');
            }
        } else {
            $pdf->SetFont('Arial', 'I', 9);
            $pdf->Cell(0, 6, 'No users assigned to this role', 1, 1);
        }
    }

    private function addSummaryPage($pdf, $rolesData)
    {
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 10, 'Summary', 0, 1, 'C');
        $pdf->Ln(2);
        
        $totalRoles = count($rolesData);
        $totalUsers = 0;
        foreach ($rolesData as $roleData) {
            $totalUsers += count($roleData['users']);
        }
        
        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(80, 8, 'Total Roles:', 1, 0, 'L');
        $pdf->Cell(40, 8, $totalRoles, 1, 1, 'C');
        
        $pdf->Cell(80, 8, 'Total Users with Roles:', 1, 0, 'L');
        $pdf->Cell(40, 8, $totalUsers, 1, 1, 'C');
    }

    private function getRolesData()
    {
        $roles = Roles::orderBy('rolename')->get();
        $rolesData = [];

        foreach ($roles as $role) {
            // Get button IDs for this role
            $buttonIds = Rmodules::where('roleid', $role->ID)
                                ->pluck('rbuttonid')
                                ->toArray();

            // Get module names
            $modules = [];
            if (!empty($buttonIds)) {
                $modules = Button::whereIn('ID', $buttonIds)
                                ->pluck('Bname')
                                ->toArray();
            }

            // Get users who have these button IDs assigned
            $users = [];
            if (!empty($buttonIds)) {
                $userIds = ModuleAsd::whereIn('buttonid', $buttonIds)
                                    ->distinct()
                                    ->pluck('WorkNo')
                                    ->toArray();

                if (!empty($userIds)) {
                    // Verify users have ALL button IDs for this role
                    foreach ($userIds as $userId) {
                        $userButtonIds = ModuleAsd::where('WorkNo', $userId)
                                                  ->pluck('buttonid')
                                                  ->toArray();
                        
                        // Check if user has all role button IDs
                        if (empty(array_diff($buttonIds, $userButtonIds))) {
                            $user = User::find($userId);
                            if ($user) {
                                $users[] = [
                                    'id' => $user->id,
                                    'name' => $user->name
                                ];
                            }
                        }
                    }
                }
            }

            $rolesData[] = [
                'rolename' => $role->rolename,
                'rdesc' => $role->rdesc ?? '',
                'modules' => $modules,
                'users' => $users
            ];
        }

        return $rolesData;
    }

    public function outputPDF($pdf, $filename = null)
    {
        if (!$filename) {
            $filename = 'Roles_Report_' . date('Y-m-d') . '.pdf';
        }
        
        return $pdf->Output('I', $filename);
    }
}

class RolesReportPDF extends \FPDF
{
    private $schoolDetails;
    private $logoPath;
    private $heading;

    public function __construct($orientation, $unit, $size, $schoolDetails, $logoPath)
    {
        parent::__construct($orientation, $unit, $size);
        $this->schoolDetails = $schoolDetails;
        $this->logoPath = $logoPath;
    }

    public function setHeading($heading)
    {
        $this->heading = $heading;
    }

    function Header() 
    {
        $this->SetFillColor(240, 240, 240);
        $this->Rect(0, 0, $this->GetPageWidth(), 30, 'F');
        $pageWidth = $this->GetPageWidth();
        
        $logoWidth = 25;
        if (file_exists($this->logoPath)) {
            $this->Image($this->logoPath, 8, 4, $logoWidth);
        }
        
        $this->SetFont('Arial', 'B', 16);
        $this->SetTextColor(0, 51, 102);
        $this->SetXY($logoWidth + 20, 10);
        
        $this->Cell(0, 8, $this->schoolDetails->name ?? 'School Name Not Found', 0, 1);
        
        $this->SetFont('Arial', 'I', 10);
        $this->SetTextColor(100, 100, 100);
        $this->SetX($logoWidth + 20);
        $this->Cell(0, 5, $this->schoolDetails->motto ?? 'Motto Not Found', 0, 1);
        
        $this->SetFont('Arial', '', 8);
        $this->SetX($logoWidth + 20);
        $this->Cell(0, 5, "P.O. Box: " . ($this->schoolDetails->pobox ?? 'N/A') . " | Email: " . ($this->schoolDetails->email ?? 'N/A') . " | " . ($this->schoolDetails->physaddres ?? 'N/A'), 0, 1);
        
        $this->Ln(2);
        $this->Line(10, $this->GetY(), $pageWidth - 10, $this->GetY());
        $this->Ln(1);

        if ($this->heading) {
            $this->SetTextColor(0);
            $this->SetFont('Arial', 'B', 14);
            $this->Cell(0, 10, $this->heading, 0, 1, 'C');
            $this->Ln(1);
        }
    }

    function Footer() 
    {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->SetTextColor(128);
        $this->Cell(0, 10, 'Page ' . $this->PageNo(), 0, 0, 'C');
    }
}
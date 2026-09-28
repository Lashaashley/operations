<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Maatwebsite\Excel\Facades\Excel;

class LotsExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithColumnWidths,
    WithStyles,
    WithEvents
{
    protected Collection $rows;

    public function __construct($rows)
    {
        $this->rows = collect($rows);
    }

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return ['Lot Number', 'Units', 'Customer', 'Model', 'Status', 'Age (days)'];
    }

    /**
     * Map each row to ONLY the visible columns, in the exact order of headings().
     * StatusColor is intentionally excluded here — it's used later in AfterSheet
     * to paint the Status cell background, not shown as its own column.
     */
    public function map($row): array
    {
        return [
            $row['LotNumber'],
            $row['Units'],
            $row['Customer'] ?? '—',
            $row['Model'] ?? '—',
            $row['Status'],
            $row['Age'] !== null ? $row['Age'] : '—',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 20, // Lot Number
            'B' => 10, // Units
            'C' => 18, // Customer
            'D' => 22, // Model
            'E' => 16, // Status
            'F' => 12, // Age (days)
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Bold header row + light background + vertical centering
        $sheet->getStyle('A1:F1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '374151'],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_LEFT,
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(22);

        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $this->rows->count() + 1; // +1 for header row

                // Freeze header row
                $sheet->freezePane('A2');

                foreach ($this->rows as $index => $row) {
                    $excelRow = $index + 2; // data starts at row 2

                    $color = ltrim($row['StatusColor'] ?? '6B7280', '#');

                    $sheet->getStyle("E{$excelRow}")->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => $color],
                        ],
                        'font' => [
                            'color' => ['rgb' => 'FFFFFF'],
                            'bold' => true,
                        ],
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);
                }

                // Thin borders around the whole table
                $sheet->getStyle("A1:F{$lastRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'E5E7EB'],
                        ],
                    ],
                ]);

                // Right-align Age column
                $sheet->getStyle("F2:F{$lastRow}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            },
        ];
    }
}
<?php

namespace App\Services;

use App\Models\Button;
use App\Models\Moduleasd;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MenuService
{
    /**
     * Get menu structure for authenticated user
     */
    public function getUserMenu(): array
    {
        // Get user ID from session
        $userId = session('user_id') ?? Auth::id();
        
        if (!$userId) {
            Log::warning('MenuService: No user ID found in session or auth');
            return [];
        }

        // Fetch button IDs assigned to the user
        $assignedButtonIds = Moduleasd::where('WorkNo', $userId)
            ->pluck('buttonid')
            ->toArray();

        if (empty($assignedButtonIds)) {
            Log::info('MenuService: No buttons assigned to user', ['user_id' => $userId]);
            return [];
        }

        // Fetch buttons assigned to user with their relationships
        $buttons = Button::whereIn('ID', $assignedButtonIds)
            ->orderByRaw("CASE WHEN isparent = 'YES' THEN 0 ELSE 1 END")
            ->orderBy('ID')
            ->get();

        // Build menu structure
        return $this->buildMenuStructure($buttons, $assignedButtonIds);
    }

    /**
     * Build hierarchical menu structure
     */
    protected function buildMenuStructure($buttons, $assignedButtonIds): array
    {
        $menuStructure = [];

        foreach ($buttons as $button) {
            if ($button->isParent()) {
                // Get children for this parent
                $children = $buttons->filter(function ($btn) use ($button, $assignedButtonIds) {
                    return $btn->parentid == $button->ID && in_array($btn->ID, $assignedButtonIds);
                })->map(function ($child) {
                    return [
                        'id' => $child->ID,
                        'name' => $child->Bname,
                        'href' => $child->href,
                        'icon' => $child->icon
                    ];
                })->values()->toArray();

                $menuStructure[] = [
                    'id' => $button->ID,
                    'name' => $button->Bname,
                    'href' => $button->href,
                    'icon' => $button->icon,
                    'isParent' => true,
                    'children' => $children
                ];
            } elseif (!$button->parentid || !in_array($button->parentid, $assignedButtonIds)) {
                // Standalone button (not a child of any assigned parent)
                $menuStructure[] = [
                    'id' => $button->ID,
                    'name' => $button->Bname,
                    'href' => $button->href,
                    'icon' => $button->icon,
                    'isParent' => false,
                    'children' => []
                ];
            }
        }

        return $menuStructure;
    }

    /**
     * Generate menu HTML (Alternative approach)
     */
    public function generateMenuHtml(array $menuItems): string
    {
        if (empty($menuItems)) {
            return '<li><span class="mtext text-muted">No menu items available</span></li>';
        }

        $html = '';
        
        foreach ($menuItems as $item) {
            $hasChildren = !empty($item['children']);
            $dropdownClass = $hasChildren ? 'dropdown' : '';
            $noArrowClass = $hasChildren ? '' : 'no-arrow';
            
            $html .= '<li class="' . $dropdownClass . '">';
            $html .= '<a href="' . htmlspecialchars($item['href']) . '" class="dropdown-toggle ' . $noArrowClass . '">';
            
            // Icon handling
            if (!empty($item['icon'])) {
                if (strpos($item['icon'], '.png') !== false || strpos($item['icon'], '.jpg') !== false) {
                    // Image icon
                    $html .= '<img src="' . asset($item['icon']) . '" alt="' . htmlspecialchars($item['name']) . '" class="micon" style="width: 25px; height: 25px;">';
                } else {
                    // Font icon (e.g., Font Awesome or dw icons)
                    $html .= '<span class="micon ' . htmlspecialchars($item['icon']) . '"></span>';
                }
            } else {
                $html .= '<span class="micon dw dw-library"></span>';
            }
            
            $html .= '<span class="mtext">' . htmlspecialchars($item['name']) . '</span>';
            $html .= '</a>';
            
            // Add submenu if has children
            if ($hasChildren) {
                $html .= '<ul class="submenu">';
                foreach ($item['children'] as $child) {
                    $html .= '<li><a href="' . htmlspecialchars($child['href']) . '">' . htmlspecialchars($child['name']) . '</a></li>';
                }
                $html .= '</ul>';
            }
            
            $html .= '</li>';
        }
        
        return $html;
    }
}
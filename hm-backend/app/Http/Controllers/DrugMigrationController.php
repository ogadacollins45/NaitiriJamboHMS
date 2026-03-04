<?php

namespace App\Http\Controllers;

use App\Models\PharmacyDrug;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DrugMigrationController extends Controller
{
    /**
     * GET /api/admin/drug-migration/status
     * Get migration status overview
     */
    public function getMigrationStatus()
    {
        $totalDrugs = PharmacyDrug::count();
        $linkedDrugs = PharmacyDrug::has('inventoryItem')->count();
        $unlinkedDrugs = $totalDrugs - $linkedDrugs;
        
        $unlinkedList = PharmacyDrug::doesntHave('inventoryItem')
            ->where('is_active', true)
            ->get(['id', 'drug_code', 'generic_name', 'dosage_form', 'strength', 'current_stock']);

        return response()->json([
            'total_drugs' => $totalDrugs,
            'migrated' => $linkedDrugs,
            'pending' => $unlinkedDrugs,
            'pending_list' => $unlinkedList,
        ]);
    }

    /**
     * POST /api/admin/drug-migration/migrate/{id}
     * Migrate single drug to Main Store
     */
    public function migrateSingleDrug($id)
    {
        $drug = PharmacyDrug::with('inventoryItem')->findOrFail($id);

        // Check if already migrated
        if ($drug->inventoryItem) {
            return response()->json([
                'message' => 'Drug already linked to Main Store',
                'inventory_item' => $drug->inventoryItem,
            ], 422);
        }

        return DB::transaction(function () use ($drug) {
            // 1. Calculate a NEW shared safe ID (vacant in both, including soft-deleted)
            $nextInventoryId = (int)InventoryItem::withTrashed()->max('id') + 1;
            $nextPharmacyId = (int)PharmacyDrug::withTrashed()->max('id') + 1;
            $sharedId = max($nextInventoryId, $nextPharmacyId);

            // 2. Create a FRESH PharmacyDrug (B) using data from (A)
            $drugData = [
                'id'              => $sharedId,
                'generic_name'    => $drug->generic_name,
                'brand_names'     => $drug->brand_names,
                'dosage_form'     => $drug->dosage_form,
                'strength'        => $drug->strength,
                'route_of_administration' => $drug->route_of_administration,
                'drug_category'   => $drug->drug_category,
                'therapeutic_class' => $drug->therapeutic_class,
                'manufacturer'    => $drug->manufacturer,
                'active_ingredient' => $drug->active_ingredient,
                'storage_conditions' => $drug->storage_conditions,
                'indications'     => $drug->indications,
                'contraindications' => $drug->contraindications,
                'side_effects'    => $drug->side_effects,
                'unit_of_measure' => $drug->unit_of_measure,
                'default_unit_price' => $drug->default_unit_price,
                'reorder_level'   => $drug->reorder_level,
                'current_stock'   => $drug->current_stock, // Inherit existing stock balance
                'is_active'       => true,
            ];

            // Generate a fresh drug code for the new ID (avoids collision with soft-deleted A)
            $newPharmacyDrug = new PharmacyDrug($drugData);
            $newPharmacyDrug->drug_code = $newPharmacyDrug->generateDrugCode();
            $newPharmacyDrug->save();

            // 3. Create fresh InventoryItem (B) linked to new PharmacyDrug (B)
            $itemCode = 'MED-' . strtoupper(str_pad((string)$sharedId, 5, '0', STR_PAD_LEFT));

            $inventoryItem = InventoryItem::create([
                'id' => $sharedId,
                'item_code' => $itemCode,
                'name' => $drug->generic_name,
                'category' => 'Medicine',
                'subcategory' => $drug->dosage_form,
                'quantity' => 0, // Fresh start in main store
                'unit' => $drug->unit_of_measure ?? 'unit',
                'reorder_level' => $drug->reorder_level ?? 0,
                'unit_price' => $drug->default_unit_price,
                'pharmacy_drug_id' => $sharedId,
                'location' => 'Main Store',
            ]);

            // 4. Create transaction record for new item
            InventoryTransaction::create([
                'item_id' => $inventoryItem->id,
                'type' => 'in',
                'quantity' => 0,
                'balance_after' => 0,
                'reason' => 'Drug imported from legacy inventory (Fresh Sync with Stock)',
                'performed_by' => 'system',
            ]);

            // 5. SILENCE the old record (A) by soft-deleting
            $drug->delete(); 

            return response()->json([
                'message' => 'Drug successfully imported with existing stock of ' . $drug->current_stock . '. Identical record created with new synchronized ID: ' . $sharedId,
                'inventory_item' => $inventoryItem->load('pharmacyDrug'),
            ], 201);
        });
    }


    public function migrateAllDrugs()
    {
        $unmigratedDrugs = PharmacyDrug::doesntHave('inventoryItem')
            ->where('is_active', true)
            ->get();

        if ($unmigratedDrugs->isEmpty()) {
            return response()->json([
                'message' => 'No drugs to import',
                'import_count' => 0,
            ]);
        }

        $migrated = [];
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($unmigratedDrugs as $drug) {
                try {
                    // 1. Calculate a NEW shared safe ID
                    $nextInventoryId = (int)InventoryItem::withTrashed()->max('id') + 1;
                    $nextPharmacyId = (int)PharmacyDrug::withTrashed()->max('id') + 1;
                    $sharedId = max($nextInventoryId, $nextPharmacyId);

                    // 2. Create a FRESH PharmacyDrug (B)
                    $drugData = [
                        'id'              => $sharedId,
                        'generic_name'    => $drug->generic_name,
                        'brand_names'     => $drug->brand_names,
                        'dosage_form'     => $drug->dosage_form,
                        'strength'        => $drug->strength,
                        'route_of_administration' => $drug->route_of_administration,
                        'drug_category'   => $drug->drug_category,
                        'therapeutic_class' => $drug->therapeutic_class,
                        'manufacturer'    => $drug->manufacturer,
                        'active_ingredient' => $drug->active_ingredient,
                        'storage_conditions' => $drug->storage_conditions,
                        'indications'     => $drug->indications,
                        'contraindications' => $drug->contraindications,
                        'side_effects'    => $drug->side_effects,
                        'unit_of_measure' => $drug->unit_of_measure,
                        'default_unit_price' => $drug->default_unit_price,
                        'reorder_level'   => $drug->reorder_level,
                        'current_stock'   => $drug->current_stock,
                        'is_active'       => true,
                    ];

                    // 3. Silence old record (Soft Delete)
                    $drug->delete();

                    $newPharmacyDrug = new PharmacyDrug($drugData);
                    $newPharmacyDrug->drug_code = $newPharmacyDrug->generateDrugCode();
                    $newPharmacyDrug->save();

                    // 4. Create fresh InventoryItem (B)
                    $itemCode = 'MED-' . strtoupper(str_pad((string)$sharedId, 5, '0', STR_PAD_LEFT));

                    $inventoryItem = InventoryItem::create([
                        'id' => $sharedId,
                        'item_code' => $itemCode,
                        'name' => $drug->generic_name,
                        'category' => 'Medicine',
                        'subcategory' => $drug->dosage_form,
                        'quantity' => 0,
                        'unit' => $drug->unit_of_measure ?? 'unit',
                        'reorder_level' => $drug->reorder_level ?? 0,
                        'unit_price' => $drug->default_unit_price,
                        'pharmacy_drug_id' => $sharedId,
                        'location' => 'Main Store',
                    ]);

                    InventoryTransaction::create([
                        'item_id' => $inventoryItem->id,
                        'type' => 'in',
                        'quantity' => 0,
                        'balance_after' => 0,
                        'reason' => 'Bulk fresh import from legacy inventory (Fresh Sync with Stock)',
                        'performed_by' => 'system',
                    ]);

                    $migrated[] = $drug->generic_name;

                    $migrated[] = $drug->generic_name;
                } catch (\Exception $e) {
                    $errors[] = [
                        'drug' => $drug->generic_name,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Bulk fresh import completed',
                'imported_count' => count($migrated),
                'imported_drugs' => $migrated,
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Import failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

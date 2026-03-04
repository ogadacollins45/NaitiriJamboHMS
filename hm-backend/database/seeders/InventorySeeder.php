<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $sup = Supplier::create([
            'name' => 'MediCare Ltd', 'contact_person' => 'Alice',
            'phone' => '0700-111-222', 'email' => 'sales@medicare.test',
            'address' => 'Nairobi', 'category' => 'pharmaceutical',
        ]);

        $items = [
            ['MED','Paracetamol','Medicine',120,'tablet',10,2.50,$sup->id,'2026-01-01','BATCH-A','Pharmacy A'],
            ['EQP','Syringe 5ml','Equipment',300,'piece',50,0.80,$sup->id,null,null,'Store Room'],
            ['CON','Bandage Roll','Consumable',75,'roll',20,1.20,$sup->id,null,null,'Store Room'],
        ];

        foreach ($items as $i => $row) {
            [$pref,$name,$cat,$qty,$unit,$reorder,$price,$sid,$exp,$batch,$loc] = $row;
            $item = InventoryItem::create([
                'item_code'     => $pref.'-'.str_pad($i+1, 5, '0', STR_PAD_LEFT),
                'name'          => $name,
                'category'      => $cat,
                'quantity'      => $qty,
                'unit'          => $unit,
                'reorder_level' => $reorder,
                'unit_price'    => $price,
                'supplier_id'   => $sid,
                'expiry_date'   => $exp,
                'batch_no'      => $batch,
                'location'      => $loc,
            ]);
            InventoryTransaction::create([
                'item_id' => $item->id,
                'type' => 'in',
                'quantity' => $qty,
                'balance_after' => $qty,
                'reason' => 'Seed stock',
                'performed_by' => 'seeder',
            ]);
        }
    }
}

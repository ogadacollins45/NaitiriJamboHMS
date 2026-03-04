<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    // GET /api/inventory
    // ?category=Medicine|Equipment|Consumable|All
    // ?search=term
    // ?page=1&per_page=10
    public function index(Request $request)
    {
        $perPage  = (int)($request->get('per_page', 10));
        $category = $request->get('category');
        $search   = $request->get('search');

        $query = InventoryItem::with('supplier')
            ->when($category && $category !== 'All', fn($q) => $q->where('category', $category))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                          ->orWhere('category', 'like', "%{$search}%")
                          ->orWhere('item_code', 'like', "%{$search}%")
                          ->orWhere('subcategory', 'like', "%{$search}%");
                });
            })
            ->orderBy('name');

        return $query->paginate($perPage);
    }

    // POST /api/inventory
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => ['required','string','max:255'],
            'category'      => ['required', Rule::in(['Medicine','Equipment','Consumable'])],
            'subcategory'   => ['nullable','string','max:255'],
            'quantity'      => ['required','integer','min:0'],
            'unit'          => ['nullable','string','max:50'],
            'reorder_level' => ['nullable','integer','min:0'],
            'unit_price'    => ['required','numeric','min:0'],
            'supplier_id'   => ['nullable','exists:suppliers,id'],
            'expiry_date'   => ['nullable','date'],
            'batch_no'      => ['nullable','string','max:255'],
            'location'      => ['nullable','string','max:255'],
        ]);

        // generate item_code by category prefix
        $prefix = match ($data['category']) {
            'Medicine'   => 'MED',
            'Equipment'  => 'EQP',
            'Consumable' => 'CON',
            default      => 'ITM',
        };

        $data['item_code'] = $prefix.'-'.strtoupper(Str::padLeft((string)(InventoryItem::max('id') + 1), 5, '0'));

        $item = InventoryItem::create($data);

        // Seed initial transaction (adjustment/in)
        InventoryTransaction::create([
            'item_id'       => $item->id,
            'type'          => 'in',
            'quantity'      => (int) $item->quantity,
            'balance_after' => (int) $item->quantity,
            'reason'        => 'Initial stock',
            'performed_by'  => 'system',
        ]);

        return response()->json($item->load('supplier'), 201);
    }

    // GET /api/inventory/{id}
    public function show($id)
    {
        $item = InventoryItem::with(['supplier','transactions' => fn($q) => $q->latest()])->findOrFail($id);
        return response()->json($item);
    }

    // PUT /api/inventory/{id}
    public function update(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);

        $data = $request->validate([
            'name'          => ['sometimes','string','max:255'],
            'category'      => ['sometimes', Rule::in(['Medicine','Equipment','Consumable'])],
            'subcategory'   => ['nullable','string','max:255'],
            'quantity'      => ['sometimes','integer','min:0'],
            'unit'          => ['nullable','string','max:50'],
            'reorder_level' => ['nullable','integer','min:0'],
            'unit_price'    => ['sometimes','numeric','min:0'],
            'supplier_id'   => ['nullable','exists:suppliers,id'],
            'expiry_date'   => ['nullable','date'],
            'batch_no'      => ['nullable','string','max:255'],
            'location'      => ['nullable','string','max:255'],
        ]);

        $oldQty = $item->quantity;
        $item->update($data);

        // If quantity changed, log a transaction (adjustment)
        if (array_key_exists('quantity', $data) && (int)$data['quantity'] !== (int)$oldQty) {
            $diff = (int)$data['quantity'] - (int)$oldQty;
            InventoryTransaction::create([
                'item_id'       => $item->id,
                'type'          => $diff > 0 ? 'in' : 'out',
                'quantity'      => $diff,
                'balance_after' => (int)$item->quantity,
                'reason'        => 'Manual update',
                'performed_by'  => 'system',
            ]);
        }

        return response()->json($item->load('supplier'));
    }

    // DELETE /api/inventory/{id}
    public function destroy($id)
    {
        $item = InventoryItem::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Item deleted']);
    }

    // POST /api/inventory/{id}/restock  { quantity: 20, reason?: string }
    public function restock(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);
        $data = $request->validate([
            'quantity' => ['required','integer','min:1'],
            'reason'   => ['nullable','string','max:255'],
        ]);

        $item->quantity += (int)$data['quantity'];
        $item->save();

        InventoryTransaction::create([
            'item_id'       => $item->id,
            'type'          => 'in',
            'quantity'      => (int)$data['quantity'],
            'balance_after' => (int)$item->quantity,
            'reason'        => $data['reason'] ?? 'Restock',
            'performed_by'  => 'system',
        ]);

        return response()->json($item);
    }
}

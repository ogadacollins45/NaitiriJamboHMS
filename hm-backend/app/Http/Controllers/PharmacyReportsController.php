<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PharmacyDrug;
use App\Models\PharmacyInventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyReportsController extends Controller
{
    /**
     * Get dispensed drugs report with pagination
     */
    public function dispensedDrugs(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $drugId = $request->input('drug_id');
        $patientId = $request->input('patient_id');

        $query = Prescription::with(['patient', 'doctor', 'items.mappedDrug'])
            ->where('pharmacy_status', 'dispensed');

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        if ($patientId) {
            $query->where('patient_id', $patientId);
        }

        if ($drugId) {
            $query->whereHas('items', function ($q) use ($drugId) {
                $q->where('mapped_drug_id', $drugId);
            });
        }

        $dispensations = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($dispensations);
    }

    /**
     * Get stock levels for all drugs
     */
    public function stockLevels(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $search = $request->input('search');
        $lowStockOnly = $request->input('low_stock_only', false);

        $query = PharmacyDrug::select([
            'id',
            'drug_code',
            'generic_name',
            'brand_names',
            'dosage_form',
            'strength',
            'current_stock',
            'reorder_level',
            'default_unit_price',
            'is_active'
        ])->where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('generic_name', 'LIKE', "%{$search}%")
                  ->orWhere('drug_code', 'LIKE', "%{$search}%");
            });
        }

        if ($lowStockOnly) {
            $query->whereRaw('current_stock <= reorder_level');
        }

        $stocks = $query->orderBy('generic_name')->paginate($perPage);

        // Add stock status to each drug
        $stocks->getCollection()->transform(function ($drug) {
            $drug->stock_status = $drug->current_stock <= $drug->reorder_level ? 'low' : 'normal';
            $drug->stock_value = $drug->current_stock * $drug->default_unit_price;
            return $drug;
        });

        return response()->json($stocks);
    }

    /**
     * Get recent inventory transactions
     */
    public function recentTransactions(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $type = $request->input('type');
        $drugId = $request->input('drug_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = PharmacyInventoryTransaction::with(['drug', 'performedByStaff', 'batch'])
            ->orderBy('transaction_date', 'desc');

        if ($type) {
            $query->where('transaction_type', $type);
        }

        if ($drugId) {
            $query->where('drug_id', $drugId);
        }

        if ($startDate) {
            $query->whereDate('transaction_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('transaction_date', '<=', $endDate);
        }

        $transactions = $query->paginate($perPage);

        return response()->json($transactions);
    }

    /**
     * Get summary statistics
     */
    public function summaryStats(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Base query for total dispensations
        $dispensationsQuery = Prescription::where('pharmacy_status', 'dispensed');
        if ($startDate && $endDate) {
            $dispensationsQuery->whereBetween('created_at', [$startDate, $endDate]);
        }

        // Base query for total drugs dispensed
        $drugsQuery = DB::table('prescription_items')
            ->join('prescriptions', 'prescription_items.prescription_id', '=', 'prescriptions.id')
            ->where('prescriptions.pharmacy_status', 'dispensed');
        
        if ($startDate && $endDate) {
            $drugsQuery->whereBetween('prescriptions.created_at', [$startDate, $endDate]);
        }

        $stats = [
            'total_dispensations' => $dispensationsQuery->count(),

            'total_drugs_dispensed' => $drugsQuery
                ->selectRaw('COALESCE(SUM(prescription_items.mapped_quantity), 0) as total')
                ->value('total'),

            'low_stock_count' => PharmacyDrug::whereRaw('current_stock <= reorder_level')
                ->where('is_active', true)
                ->count(),

            'total_active_drugs' => PharmacyDrug::where('is_active', true)->count(),

            'pending_prescriptions' => Prescription::where('pharmacy_status', 'sent_to_pharmacy')->count(),

            'total_stock_value' => PharmacyDrug::where('is_active', true)
                ->get()
                ->sum(function ($drug) {
                    return $drug->current_stock * $drug->default_unit_price;
                }),
        ];

        return response()->json($stats);
    }

    /**
     * Get top dispensed drugs
     */
    public function topDispensedDrugs(Request $request)
    {
        $limit = $request->input('limit', 10);
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now());

        $topDrugs = DB::table('prescription_items')
            ->join('prescriptions', 'prescription_items.prescription_id', '=', 'prescriptions.id')
            ->join('pharmacy_drugs', 'prescription_items.mapped_drug_id', '=', 'pharmacy_drugs.id')
            ->where('prescriptions.pharmacy_status', 'dispensed')
            ->whereBetween('prescriptions.created_at', [$startDate, $endDate])
            ->select(
                'pharmacy_drugs.id',
                'pharmacy_drugs.generic_name',
                'pharmacy_drugs.drug_code',
                'pharmacy_drugs.dosage_form',
                DB::raw('SUM(prescription_items.mapped_quantity) as total_dispensed'),
                DB::raw('COUNT(DISTINCT prescription_items.prescription_id) as prescription_count')
            )
            ->groupBy('pharmacy_drugs.id', 'pharmacy_drugs.generic_name', 'pharmacy_drugs.drug_code', 'pharmacy_drugs.dosage_form')
            ->orderByDesc('total_dispensed')
            ->limit($limit)
            ->get();

        return response()->json($topDrugs);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Patient;
use App\Models\Treatment;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Payment;
use App\Models\InventoryItem; // you said you use this
use App\Models\Doctor;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Filters
        $from = $request->query('from', Carbon::now()->subDays(30)->toDateString());
        $to   = $request->query('to', Carbon::now()->toDateString());
        $doctorId = $request->query('doctor_id'); // optional
        $service  = $request->query('service');   // optional: consultation/prescription/lab/service/custom

        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate   = Carbon::parse($to)->endOfDay();

        // ---------- KPIs ----------
        $totalPatients   = Patient::count();
        $totalTreatments = Treatment::count();
        $pendingBills    = Bill::where('status', '!=', 'paid')->count();

        $revenueSelected = Payment::whereBetween('paid_at', [$fromDate, $toDate])->sum('amount_paid');

        // Low stock (simple rule: quantity < 5)
        $lowStockCount = InventoryItem::where('quantity', '<', 5)->count();

        // ---------- Revenue Series (collected) ----------
        $revenueSeries = Payment::select(
                DB::raw('DATE(paid_at) as date'),
                DB::raw('SUM(amount_paid) as amount')
            )
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->orderBy('date')
            ->get();

        // ---------- Billing Funnel-ish ----------
        // Unbilled: treatments not yet linked to any bill OR status 'active'
        $unbilledTreatments = Treatment::with(['patient','doctor'])
            ->whereIn('status', ['active', 'awaiting_billing'])
            ->when($doctorId, fn($q) => $q->where('doctor_id', $doctorId))
            ->orderByDesc('visit_date')
            ->get();

        // Partial bills
        $partialBillsCount = Bill::where('status', 'partial')->count();
        $paidBillsCount    = Bill::where('status', 'paid')->count();

        // ---------- A/R Aging (by bill total minus paid) ----------
        // Only consider unpaid or partial
        $arBuckets = [
            '0-30'  => [0, 30],
            '31-60' => [31, 60],
            '61-90' => [61, 90],
            '90+'   => [91, 10000],
        ];

        $arAging = [];
        foreach ($arBuckets as $label => [$min, $max]) {
            $sum = Bill::whereIn('status', ['unpaid','partial'])
                ->whereBetween(DB::raw('DATEDIFF(CURDATE(), created_at)'), [$min, $max])
                ->get()
                ->sum(function ($b) {
                    $paid = $b->payments()->sum('amount_paid');
                    return max(0, ($b->total_amount ?? 0) - $paid);
                });

            $arAging[] = ['bucket' => $label, 'amount' => round($sum, 2)];
        }

        // ---------- Revenue by Doctor (collected) ----------
        // Sum of payments attributed to the bill's doctor
        $revenueByDoctor = Payment::select('b.doctor_id', DB::raw('SUM(payments.amount_paid) as amount'))
            ->join('bills as b', 'payments.bill_id', '=', 'b.id')
            ->when($doctorId, fn($q) => $q->where('b.doctor_id', $doctorId))
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->groupBy('b.doctor_id')
            ->orderByDesc('amount')
            ->get()
            ->map(function ($row) {
                $doc = Doctor::find($row->doctor_id);
                return [
                    'doctor' => $doc ? "Dr. {$doc->first_name} {$doc->last_name}" : 'N/A',
                    'amount' => (float)$row->amount,
                ];
            })
            ->values();

        // ---------- Revenue by Category (from BillItems) ----------
        $revenueByCategory = BillItem::select('category', DB::raw('SUM(subtotal) as amount'))
            ->whereHas('bill', function ($q) use ($fromDate, $toDate, $doctorId) {
                $q->whereBetween('created_at', [$fromDate, $toDate])
                  ->when($doctorId, fn($qq) => $qq->where('doctor_id', $doctorId));
            })
            ->when($service, fn($q) => $q->where('category', $service))
            ->groupBy('category')
            ->orderByDesc('amount')
            ->get()
            ->map(fn($r) => ['category' => $r->category, 'amount' => (float)$r->amount])
            ->values();

        // ---------- Today’s appointments ----------
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd   = Carbon::today()->endOfDay();
        $todayAppointments = Appointment::with(['doctor','patient'])
            ->whereBetween('appointment_time', [$todayStart, $todayEnd])
            ->when($doctorId, fn($q) => $q->where('doctor_id', $doctorId))
            ->orderBy('appointment_time')
            ->get(['id','doctor_id','patient_id','appointment_time','status']);

        // ---------- Low stock list ----------
        $lowStockList = InventoryItem::where('quantity', '<', 5)
            ->orderBy('quantity')
            ->limit(10)
            ->get(['id','name','category','quantity','unit_price']);

        // ---------- Recent patients ----------
        $recentPatients = Patient::latest()
            ->limit(8)
            ->get(['id','first_name','last_name','phone','created_at']);

        // ---------- Recent payments ----------
        $recentPayments = Payment::with('bill.patient')
            ->latest()
            ->limit(8)
            ->get()
            ->map(function ($p) {
                return [
                    'id'            => $p->id,
                    'amount_paid'   => (float)$p->amount_paid,
                    'payment_method'=> $p->payment_method,
                    'created_at'    => $p->created_at,
                    'patient_name'  => optional(optional($p->bill)->patient)->first_name
                                        ? optional($p->bill->patient)->first_name . ' ' . optional($p->bill->patient)->last_name
                                        : '—',
                ];
            })
            ->values();

        return response()->json([
            'kpis' => [
                'total_patients'    => $totalPatients,
                'total_treatments'  => $totalTreatments,
                'pending_bills'     => $pendingBills,
                'revenue_selected'  => (float)$revenueSelected,
                'low_stock'         => $lowStockCount,
                'paid_bills_count'  => $paidBillsCount,
            ],
            'charts' => [
                'revenue_series'      => $revenueSeries->map(fn($r) => ['date' => $r->date, 'amount' => (float)$r->amount])->values(),
                'ar_aging'            => $arAging,
                'revenue_by_doctor'   => $revenueByDoctor,
                'revenue_by_category' => $revenueByCategory,
            ],
            'lists' => [
                'today_appointments' => $todayAppointments,
                'low_stock'          => $lowStockList,
                'recent_patients'    => $recentPatients,
                'recent_payments'    => $recentPayments,
            ],
            'exceptions' => [
                'unbilled_treatments' => $unbilledTreatments,
                'partial_bills'       => Bill::with(['patient','doctor'])
                                            ->where('status', 'partial')
                                            ->latest()
                                            ->limit(10)
                                            ->get(),
            ],
        ]);
    }
}

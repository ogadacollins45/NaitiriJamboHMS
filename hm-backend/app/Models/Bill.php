<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'treatment_id',
        'doctor_id',
        'subtotal',
        'discount',
        'tax',
        'total_amount',
        'status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'subtotal'     => 'float',
        'discount'     => 'float',
        'tax'          => 'float',
        'total_amount' => 'float',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function treatment()
    {
        return $this->belongsTo(Treatment::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    // Newest items first so UI shows latest prescriptions on top
    public function items()
    {
        return $this->hasMany(BillItem::class)->orderByDesc('created_at');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Get all treatments linked to this bill (for same-day visits, multiple treatments share one bill)
    public function treatments()
    {
        return $this->hasMany(Treatment::class, 'bill_id');
    }

    // Link to inpatient admission (if this is an inpatient bill)
    public function admission()
    {
        return $this->belongsTo(Admission::class);
    }

    // Recompute totals from items
    public function refreshTotals(): void
    {
        $subtotal = (float) $this->items()->sum('subtotal');
        $this->subtotal = $subtotal;
        $this->total_amount = max(0, $subtotal - (float) $this->discount + (float) $this->tax);
        $this->save();
    }

    // Update status from payments
    public function refreshStatus(): void
    {
        $paid = (float) $this->payments()->sum('amount_paid');

        if ($paid <= 0) {
            $this->status = 'unpaid';
        } elseif ($paid < (float) $this->total_amount) {
            $this->status = 'partial';
        } else {
            $this->status = 'paid';
        }

        $this->save();
        $this->syncTreatmentStatus();
    }

    public function syncTreatmentStatus(): void
    {
        if (!$this->treatment) {
            return;
        }

        if ($this->status === 'paid') {
            $this->treatment->update(['status' => 'billed']);
        } else {
            $this->treatment->update(['status' => 'awaiting_billing']);
        }
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            // Visit Type - NULLABLE (can add later)
            $table->enum('visit_type', ['new', 'revisit'])->nullable()->after('patient_id');
            
            // Encounter Classification - ALL NULLABLE
            $table->enum('encounter_type', [
                'OPD',
                'Emergency', 
                'Inpatient',
                'MCH',
                'Immunisation',
                'Lab Only',
                'Pharmacy Only',
                'Follow-up'
            ])->nullable()->after('visit_type');
            
            $table->string('department')->nullable()->after('encounter_type');
            
            // Service Categories - NULLABLE
            $table->string('service_category')->nullable()->after('department');
            $table->string('service_subcategory')->nullable()->after('service_category');
            
            // Treatment Categories - NULLABLE
            $table->string('treatment_category')->nullable()->after('diagnosis_subcategory');
            $table->string('treatment_subcategory')->nullable()->after('treatment_category');
            
            // Visit metadata - ALL NULLABLE
            $table->enum('referral_status', [
                'self',
                'referred_in',
                'return_visit',
                'follow_up'
            ])->nullable()->after('visit_date');
            
            $table->string('referred_from')->nullable()->after('referral_status');
            
            $table->enum('payment_type', [
                'cash',
                'insurance',
                'nhif',
                'waived',
                'other'
            ])->nullable()->after('referred_from');
            
            // Disposition - NULLABLE
            $table->enum('disposition', [
                'treated_sent_home',
                'admitted',
                'referred_out',
                'transferred',
                'died',
                'absconded',
                'pending'
            ])->nullable()->after('status');
            
            $table->string('referred_to_facility')->nullable()->after('disposition');
            $table->text('referral_reason')->nullable()->after('referred_to_facility');
            
            // Death Documentation - ALL NULLABLE
            $table->datetime('death_datetime')->nullable()->after('referral_reason');
            $table->text('cause_of_death')->nullable()->after('death_datetime');
            $table->boolean('maternal_death')->default(false)->after('cause_of_death');
            $table->boolean('neonatal_death')->default(false)->after('maternal_death');
            
            // Audit Trail - NULLABLE
            $table->foreignId('created_by')->nullable()->after('neonatal_death')
                  ->constrained('staff')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->after('created_by')
                  ->constrained('staff')->onDelete('set null');
            
            // Indexes for performance
            $table->index('visit_type');
            $table->index('encounter_type');
            $table->index('disposition');
            $table->index('visit_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->dropColumn([
                'visit_type',
                'encounter_type',
                'department',
                'service_category',
                'service_subcategory',
                'treatment_category',
                'treatment_subcategory',
                'referral_status',
                'referred_from',
                'payment_type',
                'disposition',
                'referred_to_facility',
                'referral_reason',
                'death_datetime',
                'cause_of_death',
                'maternal_death',
                'neonatal_death',
                'created_by',
                'updated_by'
            ]);
        });
    }
};

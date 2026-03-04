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
        Schema::table('patients', function (Blueprint $table) {
            // Geographic Data - ALL NULLABLE (can add/edit later)
            $table->string('county')->nullable()->after('address');
            $table->string('sub_county')->nullable()->after('county');
            $table->string('ward')->nullable()->after('sub_county');
            $table->string('village')->nullable()->after('ward');
            
            // Next of Kin - NULLABLE
            $table->string('next_of_kin')->nullable()->after('village');
            $table->string('next_of_kin_phone')->nullable()->after('next_of_kin');
            
            // Pregnancy status - NULLABLE with default 'na'
            $table->enum('pregnancy_status', ['yes', 'no', 'unknown', 'na'])
                  ->default('na')->after('next_of_kin_phone');
            
            // Disability - NULLABLE
            $table->boolean('has_disability')->default(false)->after('pregnancy_status');
            $table->string('disability_type')->nullable()->after('has_disability');
            
            // Audit Trail - NULLABLE
            $table->foreignId('created_by')->nullable()->after('disability_type')
                  ->constrained('staff')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->after('created_by')
                  ->constrained('staff')->onDelete('set null');
            
            // Indexes (for reporting performance)
            $table->index('county');
            $table->index(['county', 'sub_county']);
            $table->index('ward');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'county',
                'sub_county',
                'ward',
                'village',
                'next_of_kin',
                'next_of_kin_phone',
                'pregnancy_status',
                'has_disability',
                'disability_type',
                'created_by',
                'updated_by'
            ]);
        });
    }
};

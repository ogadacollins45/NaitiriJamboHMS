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
        // 1. Facility Profile
        Schema::create('facility_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('facility_name');
            $table->string('moh_code')->unique();
            $table->string('keph_level'); // 2, 3, 4, 5, 6
            $table->string('county');
            $table->string('sub_county');
            $table->string('ward')->nullable();
            $table->string('physical_address')->nullable();
            $table->enum('ownership', ['public', 'faith_based', 'private', 'ngo']);
            $table->json('services_offered'); // ['OPD', 'MCH', 'Delivery', etc.]
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('facility_incharge')->nullable();
            $table->string('incharge_phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. IDSR Surveillance Cases
        Schema::create('surveillance_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treatment_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            
            $table->string('disease_name');
            $table->string('disease_code')->nullable(); // ICD-10
            
            $table->boolean('is_priority_disease')->default(false);
            $table->boolean('is_immediately_notifiable')->default(false);
            $table->boolean('suspected_outbreak')->default(false);
            
            $table->date('onset_date')->nullable();
            $table->text('travel_exposure_notes')->nullable();
            
            $table->enum('case_status', ['suspected', 'probable', 'confirmed'])->default('suspected');
            $table->enum('outcome', ['alive', 'dead', 'referred', 'unknown'])->default('alive');
            
            $table->boolean('lab_confirmed')->default(false);
            $table->date('lab_confirmation_date')->nullable();
            
            $table->boolean('notified_to_moh')->default(false);
            $table->datetime('notification_datetime')->nullable();
            
            $table->foreignId('created_by')->constrained('staff')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('staff')->onDelete('set null');
            
            $table->timestamps();
            
            $table->index('disease_name');
            $table->index('onset_date');
            $table->index('is_immediately_notifiable');
        });

        // 3. Kenya Locations (Reference Data)
        Schema::create('kenya_locations', function (Blueprint $table) {
            $table->id();
            $table->string('county');
            $table->string('sub_county');
            $table->string('ward')->nullable();
            $table->timestamps();
            
            $table->index('county');
            $table->index(['county', 'sub_county']);
        });

        // 4. IDSR Diseases (Reference Data)
        Schema::create('idsr_diseases', function (Blueprint $table) {
            $table->id();
            $table->string('disease_name')->unique();
            $table->string('disease_code')->nullable(); // ICD-10
            $table->boolean('is_priority')->default(false);
            $table->boolean('is_immediately_notifiable')->default(false);
            $table->text('case_definition')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('idsr_diseases');
        Schema::dropIfExists('kenya_locations');
        Schema::dropIfExists('surveillance_cases');
        Schema::dropIfExists('facility_profiles');
    }
};

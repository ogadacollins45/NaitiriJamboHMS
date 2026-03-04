<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds indexes to frequently queried columns for better performance with large datasets.
     * Safely checks if index exists before creating to prevent duplicate errors.
     */
    public function up(): void
    {
        // Patients table indexes
        Schema::table('patients', function (Blueprint $table) {
            if (!$this->indexExists('patients', 'idx_patients_upid')) {
                $table->index('upid', 'idx_patients_upid');
            }
            if (!$this->indexExists('patients', 'idx_patients_phone')) {
                $table->index('phone', 'idx_patients_phone');
            }
            if (!$this->indexExists('patients', 'idx_patients_email')) {
                $table->index('email', 'idx_patients_email');
            }
            if (!$this->indexExists('patients', 'idx_patients_national_id')) {
                $table->index('national_id', 'idx_patients_national_id');
            }
            if (!$this->indexExists('patients', 'idx_patients_created_at')) {
                $table->index('created_at', 'idx_patients_created_at');
            }
        });

        // Treatments table indexes
        Schema::table('treatments', function (Blueprint $table) {
            if (!$this->indexExists('treatments', 'idx_treatments_patient_id')) {
                $table->index('patient_id', 'idx_treatments_patient_id');
            }
            if (!$this->indexExists('treatments', 'idx_treatments_doctor_id')) {
                $table->index('doctor_id', 'idx_treatments_doctor_id');
            }
            if (!$this->indexExists('treatments', 'idx_treatments_visit_date')) {
                $table->index('visit_date', 'idx_treatments_visit_date');
            }
            if (!$this->indexExists('treatments', 'idx_treatments_status')) {
                $table->index('status', 'idx_treatments_status');
            }
            if (!$this->indexExists('treatments', 'idx_treatments_created_at')) {
                $table->index('created_at', 'idx_treatments_created_at');
            }
        });

        // Prescriptions table indexes
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!$this->indexExists('prescriptions', 'idx_prescriptions_patient_id')) {
                $table->index('patient_id', 'idx_prescriptions_patient_id');
            }
            if (!$this->indexExists('prescriptions', 'idx_prescriptions_treatment_id')) {
                $table->index('treatment_id', 'idx_prescriptions_treatment_id');
            }
            if (!$this->indexExists('prescriptions', 'idx_prescriptions_pharmacy_status')) {
                $table->index('pharmacy_status', 'idx_prescriptions_pharmacy_status');
            }
            if (!$this->indexExists('prescriptions', 'idx_prescriptions_created_at')) {
                $table->index('created_at', 'idx_prescriptions_created_at');
            }
        });

        // Appointments table indexes
        Schema::table('appointments', function (Blueprint $table) {
            if (!$this->indexExists('appointments', 'idx_appointments_patient_id')) {
                $table->index('patient_id', 'idx_appointments_patient_id');
            }
            if (!$this->indexExists('appointments', 'idx_appointments_doctor_id')) {
                $table->index('doctor_id', 'idx_appointments_doctor_id');
            }
            if (!$this->indexExists('appointments', 'idx_appointments_status')) {
                $table->index('status', 'idx_appointments_status');
            }
            if (!$this->indexExists('appointments', 'idx_appointments_time')) {
                $table->index('appointment_time', 'idx_appointments_time');
            }
        });

        // Bills table indexes
        Schema::table('bills', function (Blueprint $table) {
            if (!$this->indexExists('bills', 'idx_bills_patient_id')) {
                $table->index('patient_id', 'idx_bills_patient_id');
            }
            if (!$this->indexExists('bills', 'idx_bills_treatment_id')) {
                $table->index('treatment_id', 'idx_bills_treatment_id');
            }
            if (!$this->indexExists('bills', 'idx_bills_status')) {
                $table->index('status', 'idx_bills_status');
            }
            if (!$this->indexExists('bills', 'idx_bills_created_at')) {
                $table->index('created_at', 'idx_bills_created_at');
            }
        });

        // Lab requests table indexes (skip if already exists)
        if (Schema::hasTable('lab_requests')) {
            Schema::table('lab_requests', function (Blueprint $table) {
                if (!$this->indexExists('lab_requests', 'idx_lab_requests_patient_id')) {
                    $table->index('patient_id', 'idx_lab_requests_patient_id');
                }
                if (!$this->indexExists('lab_requests', 'idx_lab_requests_treatment_id')) {
                    $table->index('treatment_id', 'idx_lab_requests_treatment_id');
                }
                if (!$this->indexExists('lab_requests', 'idx_lab_requests_status')) {
                    $table->index('status', 'idx_lab_requests_status');
                }
                if (!$this->indexExists('lab_requests', 'idx_lab_requests_created_at')) {
                    $table->index('created_at', 'idx_lab_requests_created_at');
                }
            });
        }

        // Queue table indexes
        if (Schema::hasTable('queue')) {
            Schema::table('queue', function (Blueprint $table) {
                if (!$this->indexExists('queue', 'idx_queue_patient_id')) {
                    $table->index('patient_id', 'idx_queue_patient_id');
                }
                if (!$this->indexExists('queue', 'idx_queue_status')) {
                    $table->index('status', 'idx_queue_status');
                }
                if (!$this->indexExists('queue', 'idx_queue_created_at')) {
                    $table->index('created_at', 'idx_queue_created_at');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Patients table
        Schema::table('patients', function (Blueprint $table) {
            if ($this->indexExists('patients', 'idx_patients_upid')) {
                $table->dropIndex('idx_patients_upid');
            }
            if ($this->indexExists('patients', 'idx_patients_phone')) {
                $table->dropIndex('idx_patients_phone');
            }
            if ($this->indexExists('patients', 'idx_patients_email')) {
                $table->dropIndex('idx_patients_email');
            }
            if ($this->indexExists('patients', 'idx_patients_national_id')) {
                $table->dropIndex('idx_patients_national_id');
            }
            if ($this->indexExists('patients', 'idx_patients_created_at')) {
                $table->dropIndex('idx_patients_created_at');
            }
        });

        // Treatments table
        Schema::table('treatments', function (Blueprint $table) {
            if ($this->indexExists('treatments', 'idx_treatments_patient_id')) {
                $table->dropIndex('idx_treatments_patient_id');
            }
            if ($this->indexExists('treatments', 'idx_treatments_doctor_id')) {
                $table->dropIndex('idx_treatments_doctor_id');
            }
            if ($this->indexExists('treatments', 'idx_treatments_visit_date')) {
                $table->dropIndex('idx_treatments_visit_date');
            }
            if ($this->indexExists('treatments', 'idx_treatments_status')) {
                $table->dropIndex('idx_treatments_status');
            }
            if ($this->indexExists('treatments', 'idx_treatments_created_at')) {
                $table->dropIndex('idx_treatments_created_at');
            }
        });

        // Prescriptions table
        Schema::table('prescriptions', function (Blueprint $table) {
            if ($this->indexExists('prescriptions', 'idx_prescriptions_patient_id')) {
                $table->dropIndex('idx_prescriptions_patient_id');
            }
            if ($this->indexExists('prescriptions', 'idx_prescriptions_treatment_id')) {
                $table->dropIndex('idx_prescriptions_treatment_id');
            }
            if ($this->indexExists('prescriptions', 'idx_prescriptions_pharmacy_status')) {
                $table->dropIndex('idx_prescriptions_pharmacy_status');
            }
            if ($this->indexExists('prescriptions', 'idx_prescriptions_created_at')) {
                $table->dropIndex('idx_prescriptions_created_at');
            }
        });

        // Appointments table
        Schema::table('appointments', function (Blueprint $table) {
            if ($this->indexExists('appointments', 'idx_appointments_patient_id')) {
                $table->dropIndex('idx_appointments_patient_id');
            }
            if ($this->indexExists('appointments', 'idx_appointments_doctor_id')) {
                $table->dropIndex('idx_appointments_doctor_id');
            }
            if ($this->indexExists('appointments', 'idx_appointments_status')) {
                $table->dropIndex('idx_appointments_status');
            }
            if ($this->indexExists('appointments', 'idx_appointments_time')) {
                $table->dropIndex('idx_appointments_time');
            }
        });

        // Bills table
        Schema::table('bills', function (Blueprint $table) {
            if ($this->indexExists('bills', 'idx_bills_patient_id')) {
                $table->dropIndex('idx_bills_patient_id');
            }
            if ($this->indexExists('bills', 'idx_bills_treatment_id')) {
                $table->dropIndex('idx_bills_treatment_id');
            }
            if ($this->indexExists('bills', 'idx_bills_status')) {
                $table->dropIndex('idx_bills_status');
            }
            if ($this->indexExists('bills', 'idx_bills_created_at')) {
                $table->dropIndex('idx_bills_created_at');
            }
        });

        // Lab requests table
        if (Schema::hasTable('lab_requests')) {
            Schema::table('lab_requests', function (Blueprint $table) {
                if ($this->indexExists('lab_requests', 'idx_lab_requests_patient_id')) {
                    $table->dropIndex('idx_lab_requests_patient_id');
                }
                if ($this->indexExists('lab_requests', 'idx_lab_requests_treatment_id')) {
                    $table->dropIndex('idx_lab_requests_treatment_id');
                }
                if ($this->indexExists('lab_requests', 'idx_lab_requests_status')) {
                    $table->dropIndex('idx_lab_requests_status');
                }
                if ($this->indexExists('lab_requests', 'idx_lab_requests_created_at')) {
                    $table->dropIndex('idx_lab_requests_created_at');
                }
            });
        }

        // Queue table
        if (Schema::hasTable('queue')) {
            Schema::table('queue', function (Blueprint $table) {
                if ($this->indexExists('queue', 'idx_queue_patient_id')) {
                    $table->dropIndex('idx_queue_patient_id');
                }
                if ($this->indexExists('queue', 'idx_queue_status')) {
                    $table->dropIndex('idx_queue_status');
                }
                if ($this->indexExists('queue', 'idx_queue_created_at')) {
                    $table->dropIndex('idx_queue_created_at');
                }
            });
        }
    }

    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $index): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index]);
        return count($indexes) > 0;
    }
};

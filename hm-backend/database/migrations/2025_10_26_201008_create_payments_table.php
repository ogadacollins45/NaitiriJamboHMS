<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('bill_id')->constrained('bills')->onDelete('cascade');

            $table->decimal('amount_paid', 10, 2);
            $table->string('payment_method', 50)->default('cash'); // cash | mpesa | insurance | card | bank | other
            $table->string('transaction_ref')->nullable();         // e.g. M-PESA code
            $table->timestamp('paid_at')->useCurrent();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['bill_id', 'payment_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * create_support_tickets_table only ever created id/user_id/subject/
 * description/status/priority/timestamps, but SupportTicket::$fillable and
 * both ticket controllers (Api\UserTicketController and
 * Admin\SupportTicketController) read and write nine further columns. Every
 * ticket creation therefore failed with "table support_tickets has no column
 * named ticket_number" - the support-ticket feature could not work at all.
 * This adds the missing columns so the existing code matches the schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            if (! Schema::hasColumn('support_tickets', 'ticket_number')) {
                $table->string('ticket_number')->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('support_tickets', 'conversation_id')) {
                $table->foreignId('conversation_id')->nullable()->after('user_id')
                    ->constrained('conversations')->nullOnDelete();
            }
            if (! Schema::hasColumn('support_tickets', 'assigned_to')) {
                $table->foreignId('assigned_to')->nullable()->after('conversation_id')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('support_tickets', 'category')) {
                $table->string('category')->default('general')->after('priority');
            }
            if (! Schema::hasColumn('support_tickets', 'resolution_notes')) {
                $table->text('resolution_notes')->nullable()->after('category');
            }
            if (! Schema::hasColumn('support_tickets', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('resolution_notes');
            }
            if (! Schema::hasColumn('support_tickets', 'closed_at')) {
                $table->timestamp('closed_at')->nullable()->after('resolved_at');
            }
            if (! Schema::hasColumn('support_tickets', 'response_time_minutes')) {
                $table->unsignedInteger('response_time_minutes')->nullable()->after('closed_at');
            }
            if (! Schema::hasColumn('support_tickets', 'is_escalated')) {
                $table->boolean('is_escalated')->default(false)->after('response_time_minutes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            if (Schema::hasColumn('support_tickets', 'conversation_id')) {
                $table->dropConstrainedForeignId('conversation_id');
            }
            if (Schema::hasColumn('support_tickets', 'assigned_to')) {
                $table->dropConstrainedForeignId('assigned_to');
            }
        });

        Schema::table('support_tickets', function (Blueprint $table) {
            foreach ([
                'ticket_number',
                'category',
                'resolution_notes',
                'resolved_at',
                'closed_at',
                'response_time_minutes',
                'is_escalated',
            ] as $column) {
                if (Schema::hasColumn('support_tickets', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

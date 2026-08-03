<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use Illuminate\Pagination\LengthAwarePaginator;

class UserTicketService
{
    public function getUserTickets(int $userId, ?string $status): array
    {
        $query = SupportTicket::where('user_id', $userId)
            ->withCount('messages')
            ->with('assignedUser:id,name');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $tickets = $query->orderByDesc('created_at')->paginate(10);

        $stats = [
            'total' => SupportTicket::where('user_id', $userId)->count(),
            'open' => SupportTicket::where('user_id', $userId)->where('status', 'open')->count(),
            'in_progress' => SupportTicket::where('user_id', $userId)->where('status', 'in_progress')->count(),
            'resolved' => SupportTicket::where('user_id', $userId)->where('status', 'resolved')->count(),
        ];

        return ['tickets' => $tickets, 'stats' => $stats];
    }

    public function getUserTicketDetail(int $ticketId, int $userId): SupportTicket
    {
        return SupportTicket::where('user_id', $userId)
            ->with([
                'assignedUser:id,name,avatar',
                'messages' => function ($q) {
                    $q->with('user:id,name,avatar')->orderBy('created_at');
                },
            ])
            ->findOrFail($ticketId);
    }

    public function createTicket(int $userId, array $data): SupportTicket
    {
        return SupportTicket::create([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'user_id' => $userId,
            'conversation_id' => $data['conversation_id'] ?? null,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'priority' => $data['priority'],
            'category' => $data['category'],
            'status' => 'open',
        ]);
    }

    public function findConversationForTicket(int $conversationId): Conversation
    {
        return Conversation::with([
            'buyer:id,name,email',
            'seller:id,name,email',
            'messages' => function ($q) {
                $q->orderBy('created_at')->limit(10);
            },
        ])->findOrFail($conversationId);
    }

    public function convertConversationToTicket(Conversation $conversation, int $userId, array $data): SupportTicket
    {
        $summary = "مکالمه بین {$conversation->buyer->name} و {$conversation->seller->name}\n\n";
        $summary .= "آخرین پیام‌ها:\n";
        foreach ($conversation->messages as $msg) {
            $senderName = $msg->sender->name ?? 'ناشناس';
            $summary .= "- {$senderName}: {$msg->content}\n";
        }

        return SupportTicket::create([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'conversation_id' => $conversation->id,
            'user_id' => $userId,
            'subject' => $data['subject'],
            'description' => $summary,
            'priority' => $data['priority'],
            'category' => $data['category'],
            'status' => 'open',
        ]);
    }

    public function sendMessage(int $ticketId, int $userId, string $message): TicketMessage
    {
        SupportTicket::where('user_id', $userId)->findOrFail($ticketId);

        $ticketMessage = TicketMessage::create([
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'message' => $message,
            'is_internal' => false,
        ]);

        return $ticketMessage->load('user:id,name,avatar');
    }
}

<?php

namespace App\Policies;

use App\Models\ProductAlert;
use App\Models\User;

class ProductAlertPolicy
{
    /**
     * Determine whether the user can view any alerts.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the alert.
     * Only the alert owner or admin can view it.
     */
    public function view(User $user, ProductAlert $alert): bool
    {
        return $user->id === $alert->user_id || $user->role === 'admin';
    }

    /**
     * Determine whether the user can create alerts.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the alert.
     * Only the alert owner or admin can update it.
     */
    public function update(User $user, ProductAlert $alert): bool
    {
        return $user->id === $alert->user_id || $user->role === 'admin';
    }

    /**
     * Determine whether the user can delete the alert.
     * Only the alert owner or admin can delete it.
     */
    public function delete(User $user, ProductAlert $alert): bool
    {
        return $user->id === $alert->user_id || $user->role === 'admin';
    }

    /**
     * Determine whether the user can restore the alert (if soft deleted).
     */
    public function restore(User $user, ProductAlert $alert): bool
    {
        return $user->id === $alert->user_id || $user->role === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the alert.
     */
    public function forceDelete(User $user, ProductAlert $alert): bool
    {
        return $user->role === 'admin';
    }
}

<?php

namespace App\Exceptions;

use Exception;

class OutOfStockException extends Exception
{
    public function __construct($message = "موجودی محصول کافی نیست.")
    {
        parent::__construct($message, 400);
    }
}
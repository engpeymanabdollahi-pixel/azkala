<?php

namespace App\Exceptions;

use Exception;

class IncompatibleProductException extends Exception
{
    public function __construct($message = "این محصول با دستگاه انتخابی شما سازگار نیست.")
    {
        parent::__construct($message, 400);
    }
}
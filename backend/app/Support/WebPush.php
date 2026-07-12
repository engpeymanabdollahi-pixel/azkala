<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

class WebPush
{
    protected string $publicKey;
    protected string $privateKey;
    protected string $subject;

    public function __construct()
    {
        $this->publicKey = config('webpush.vapid.public_key');
        $this->privateKey = config('webpush.vapid.private_key');
        $this->subject = config('webpush.vapid.subject', 'mailto:admin@azkala.ir');
    }

    /**
     * ارسال نوتیفیکیشن
     */
    public function send(array $subscription, array $payload): array
    {
        try {
            $endpoint = $subscription['endpoint'];
            $publicKey = $subscription['publicKey'];
            $authToken = $subscription['authToken'];
            $contentEncoding = $subscription['contentEncoding'] ?? 'aesgcm';

            // Generate JWT
            $audience = parse_url($endpoint, PHP_URL_SCHEME) . '://' . parse_url($endpoint, PHP_URL_HOST);
            $jwt = VAPID::generateJWT($audience, $this->subject, $this->publicKey, $this->privateKey);

            // Prepare payload
            $payloadJson = json_encode($payload);

            // Encrypt payload (simplified - for production use proper encryption)
            $encryptedPayload = $this->encryptPayload($payloadJson, $publicKey, $authToken, $contentEncoding);

            // Send request
            $ch = curl_init();
            
            curl_setopt_array($ch, [
                CURLOPT_URL => $endpoint,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $encryptedPayload['payload'],
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/octet-stream',
                    'Content-Encoding: ' . $contentEncoding,
                    'Encryption: salt=' . $encryptedPayload['salt'],
                    'Crypto-Key: dh=' . $encryptedPayload['publicKey'] . ';p256ecdsa=' . $this->publicKey,
                    'Authorization: vapid t=' . $jwt . ', k=' . $this->publicKey,
                    'TTL: 86400',
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            
            curl_close($ch);

            if ($httpCode === 201 || $httpCode === 200) {
                return [
                    'success' => true,
                    'status' => $httpCode,
                    'response' => $response,
                ];
            } else {
                Log::error("WebPush failed", [
                    'httpCode' => $httpCode,
                    'error' => $error,
                    'response' => $response,
                ]);

                return [
                    'success' => false,
                    'status' => $httpCode,
                    'error' => $error,
                    'response' => $response,
                ];
            }

        } catch (\Exception $e) {
            Log::error("WebPush exception: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * رمزنگاری payload
     */
    private function encryptPayload(string $payload, string $publicKey, string $authToken, string $contentEncoding): array
    {
        // Generate salt
        $salt = random_bytes(16);
        
        // Generate local key pair
        $localKey = openssl_pkey_new([
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ]);
        
        $localDetails = openssl_pkey_get_details($localKey);
        $localPublicKeyRaw = substr($localDetails['ec']['x'] . $localDetails['ec']['y'], 0, 64);
        
        // Derive shared secret (simplified)
        $sharedSecret = hash('sha256', $salt . $publicKey . $authToken, true);
        
        // Derive content encryption key
        $cek = hash('sha256', $sharedSecret . 'Content-Encoding: aesgcm' . "\x00", true);
        
        // Encrypt payload
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt(
            $payload,
            'aes-128-gcm',
            substr($cek, 0, 16),
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16
        );

        // Combine: padding + encrypted + tag
        $padding = "\x00\x00"; // 2 bytes padding
        $finalPayload = $padding . $encrypted . $tag;

        return [
            'payload' => $finalPayload,
            'salt' => VAPID::base64UrlEncode($salt),
            'publicKey' => VAPID::base64UrlEncode($localPublicKeyRaw),
        ];
    }
}
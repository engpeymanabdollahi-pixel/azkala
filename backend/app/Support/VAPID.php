<?php

namespace App\Support;

class VAPID
{
    /**
     * تولید کلیدهای VAPID
     */
    public static function createVapidKeys(): array
    {
        // تولید کلید خصوصی تصادفی (32 بایت)
        $privateKey = random_bytes(32);
        
        // تولید کلید عمومی از کلید خصوصی
        // استفاده از منحنی P-256 (prime256v1)
        $publicKey = self::generatePublicKey($privateKey);
        
        return [
            'publicKey' => self::base64UrlEncode($publicKey),
            'privateKey' => self::base64UrlEncode($privateKey),
        ];
    }

    /**
     * تولید کلید عمومی از کلید خصوصی
     */
    private static function generatePublicKey(string $privateKey): string
    {
        // ساخت PEM برای کلید خصوصی
        $privateKeyPem = self::buildEcPrivateKeyPem($privateKey);
        
        // استخراج کلید عمومی
        $key = openssl_pkey_get_private($privateKeyPem);
        
        if (!$key) {
            throw new \Exception('Failed to create private key: ' . openssl_error_string());
        }
        
        $details = openssl_pkey_get_details($key);
        
        if (!$details || !isset($details['ec']['x']) || !isset($details['ec']['y'])) {
            throw new \Exception('Failed to get public key details');
        }
        
        // ترکیب x و y برای ساخت کلید عمومی (64 بایت)
        return $details['ec']['x'] . $details['ec']['y'];
    }

    /**
     * ساخت PEM برای کلید خصوصی EC
     */
    private static function buildEcPrivateKeyPem(string $privateKeyRaw): string
    {
        // ساخت DER structure برای EC private key
        // OID for prime256v1: 1.2.840.10045.3.1.7
        $oid = "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07";
        
        // EC private key structure (RFC 5915)
        $version = "\x02\x01\x01"; // INTEGER 1
        $privateKeyOctet = "\x04\x20" . $privateKeyRaw; // OCTET STRING, 32 bytes
        
        // ساخت inner sequence
        $inner = $version . $privateKeyOctet;
        
        // ساخت outer sequence
        $der = "\x30" . chr(strlen($inner) + strlen($oid) + 2) . 
               "\x02\x01\x01" . 
               $privateKeyOctet . 
               "\xa0" . chr(strlen($oid) + 2) . "\x06" . chr(strlen($oid) - 2) . substr($oid, 2);
        
        // Base64 encode و اضافه کردن header/footer
        $base64 = base64_encode($der);
        $pem = "-----BEGIN EC PRIVATE KEY-----\n" . 
               chunk_split($base64, 64, "\n") . 
               "-----END EC PRIVATE KEY-----\n";
        
        return $pem;
    }

    /**
     * Base64 URL-safe encoding
     */
    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decoding
     */
    public static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * تولید JWT برای VAPID
     */
    public static function generateJWT(string $audience, string $subject, string $publicKey, string $privateKey): string
    {
        $header = [
            'typ' => 'JWT',
            'alg' => 'ES256',
        ];

        $payload = [
            'aud' => $audience,
            'exp' => time() + (12 * 3600), // 12 hours
            'sub' => $subject,
        ];

        // Encode header and payload
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $message = $headerEncoded . '.' . $payloadEncoded;

        // Decode private key
        $privateKeyRaw = self::base64UrlDecode($privateKey);
        
        // ساخت PEM برای امضا
        $privateKeyPem = self::buildEcPrivateKeyPem($privateKeyRaw);
        $key = openssl_pkey_get_private($privateKeyPem);
        
        if (!$key) {
            throw new \Exception('Failed to load private key for signing');
        }
        
        // Sign with ECDSA
        $signature = '';
        if (!openssl_sign($message, $signature, $key, 'SHA256')) {
            throw new \Exception('Failed to sign JWT: ' . openssl_error_string());
        }
        
        // Convert DER signature to raw format (64 bytes)
        $signatureRaw = self::derToRaw($signature);
        
        $signatureEncoded = self::base64UrlEncode($signatureRaw);
        
        return $message . '.' . $signatureEncoded;
    }

    /**
     * تبدیل DER signature به raw format
     */
    private static function derToRaw(string $der): string
    {
        // DER format: 0x30 [length] 0x02 [r-length] [r] 0x02 [s-length] [s]
        $pos = 0;
        
        // Skip SEQUENCE tag and length
        if (ord($der[$pos]) !== 0x30) {
            throw new \Exception('Invalid DER signature');
        }
        $pos++;
        
        // Skip length
        if (ord($der[$pos]) & 0x80) {
            $pos += (ord($der[$pos]) & 0x7f) + 1;
        } else {
            $pos++;
        }
        
        // Extract R
        if (ord($der[$pos]) !== 0x02) {
            throw new \Exception('Invalid DER signature');
        }
        $pos++;
        
        $rLen = ord($der[$pos]);
        $pos++;
        
        $r = substr($der, $pos, $rLen);
        $pos += $rLen;
        
        // Extract S
        if (ord($der[$pos]) !== 0x02) {
            throw new \Exception('Invalid DER signature');
        }
        $pos++;
        
        $sLen = ord($der[$pos]);
        $pos++;
        
        $s = substr($der, $pos, $sLen);
        
        // Pad or trim to 32 bytes
        $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);
        
        return $r . $s;
    }
}
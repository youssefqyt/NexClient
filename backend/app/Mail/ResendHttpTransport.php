<?php

namespace App\Mail;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;

class ResendHttpTransport extends AbstractTransport
{
    public function __construct(protected ?string $apiKey = null)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        // Determine "From" address safely
        $from = null;
        $fromAddresses = $email->getFrom();
        if (!empty($fromAddresses)) {
            $fromObj = $fromAddresses[0];
            $name = $fromObj->getName();
            $addr = $fromObj->getAddress();
            $from = !empty($name) ? "{$name} <{$addr}>" : $addr;
        } else {
            $configFromAddr = config('mail.from.address', 'onboarding@resend.dev');
            $configFromName = config('mail.from.name', 'NexClient');
            $from = !empty($configFromName) ? "{$configFromName} <{$configFromAddr}>" : $configFromAddr;
        }

        // Determine "To" recipients
        $to = [];
        foreach ($email->getTo() as $address) {
            $to[] = $address->getAddress();
        }

        if (empty($to)) {
            throw new \RuntimeException('No recipient email address specified.');
        }

        // Extract Subject
        $subject = $email->getSubject() ?? 'Password Reset';

        // Extract HTML body (handling stream resources if any)
        $htmlBody = $email->getHtmlBody();
        if (is_resource($htmlBody)) {
            $htmlBody = stream_get_contents($htmlBody);
        }

        // Extract Text body (handling stream resources if any)
        $textBody = $email->getTextBody();
        if (is_resource($textBody)) {
            $textBody = stream_get_contents($textBody);
        }

        $payload = [
            'from' => $from,
            'to' => $to,
            'subject' => $subject,
        ];

        if (!empty($htmlBody)) {
            $payload['html'] = $htmlBody;
        }
        if (!empty($textBody)) {
            $payload['text'] = $textBody;
        }

        // Reply-To
        $replyTo = [];
        foreach ($email->getReplyTo() as $address) {
            $replyTo[] = $address->getAddress();
        }
        if (!empty($replyTo)) {
            $payload['reply_to'] = $replyTo;
        }

        // Resolve API key
        $key = trim($this->apiKey ?? '', " \t\n\r\0\x0B\"'");
        if (empty($key)) {
            $key = trim(config('mail.mailers.resend.key', '') ?? '', " \t\n\r\0\x0B\"'");
        }
        if (empty($key)) {
            $key = trim(env('RESEND_KEY', env('MAIL_PASSWORD', '')) ?? '', " \t\n\r\0\x0B\"'");
        }

        if (empty($key)) {
            throw new \RuntimeException('Resend API key is missing. Set MAIL_PASSWORD or RESEND_KEY in your environment.');
        }

        $response = Http::withToken($key)
            ->acceptJson()
            ->timeout(15)
            ->post('https://api.resend.com/emails', $payload);

        if ($response->failed()) {
            $data = $response->json();
            $errorMsg = $data['message'] ?? $response->body();
            Log::error('Resend API request failed', [
                'status' => $response->status(),
                'response' => $errorMsg,
                'payload' => array_merge($payload, ['html' => '[HTML content redacted]']),
            ]);

            throw new \RuntimeException("Resend error ({$response->status()}): {$errorMsg}");
        }
    }

    public function __toString(): string
    {
        return 'resend-http';
    }
}

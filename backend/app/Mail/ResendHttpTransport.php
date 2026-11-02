<?php

namespace App\Mail;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;

class ResendHttpTransport extends AbstractTransport
{
    public function __construct(protected string $apiKey)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $payload = [
            'from' => $email->getFrom()[0]->toString(),
            'to' => array_map(fn($addr) => $addr->getAddress(), $email->getTo()),
            'subject' => $email->getSubject(),
            'html' => $email->getHtmlBody(),
            'text' => $email->getTextBody(),
        ];

        if (!empty($email->getReplyTo())) {
            $payload['reply_to'] = array_map(fn($addr) => $addr->getAddress(), $email->getReplyTo());
        }

        if (!empty($email->getCc())) {
            $payload['cc'] = array_map(fn($addr) => $addr->getAddress(), $email->getCc());
        }

        if (!empty($email->getBcc())) {
            $payload['bcc'] = array_map(fn($addr) => $addr->getAddress(), $email->getBcc());
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(10)
            ->post('https://api.resend.com/emails', array_filter($payload));

        if ($response->failed()) {
            throw new \RuntimeException('Resend API error: ' . $response->body());
        }
    }

    public function __toString(): string
    {
        return 'resend-http';
    }
}


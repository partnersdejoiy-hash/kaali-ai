<?php
/**
 * KAALI secure backend endpoint (PHP version).
 * Deploy this behind HTTPS (Apache/Nginx + PHP 8.1+).
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$clientToken = $_SERVER['HTTP_X_KAALI_CLIENT_TOKEN'] ?? '';
$csrfToken = $_SERVER['HTTP_X_KAALI_CSRF'] ?? '';
$expectedToken = getenv('KAALI_CLIENT_TOKEN');
$publicToken = getenv('KAALI_PUBLIC_CLIENT_TOKEN');
$allowedTokens = array_values(array_filter([$expectedToken, $publicToken, 'public-chat-client-v1']));

$tokenValid = in_array($clientToken, $allowedTokens, true);

if (!$tokenValid || !hash_equals($clientToken, $csrfToken)) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$messages = isset($payload['messages']) && is_array($payload['messages']) ? $payload['messages'] : [];
$role = $payload['role'] ?? 'guest';
$allowedRoles = ['guest', 'vendor', 'admin'];
if (!in_array($role, $allowedRoles, true)) {
    $role = 'guest';
}

$latest = '';
if (!empty($messages)) {
    $last = end($messages);
    $latest = strtolower(trim((string) ($last['content'] ?? '')));
}

$escalationTerms = ['refund dispute', 'legal complaint', 'angry', 'human', 'speak to human'];
foreach ($escalationTerms as $term) {
    if (strpos($latest, $term) !== false) {
        echo json_encode([
            'reply' => 'I am escalating this to SalesIQ Support for immediate human assistance.',
            'escalate' => true,
            'department' => 'Support'
        ]);
        exit;
    }
}

$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'OPENAI_API_KEY is missing']);
    exit;
}

$rolePrompt = [
    'guest' => 'Customer permissions: track order, policy help, and general queries.',
    'vendor' => 'Vendor permissions: commissions, performance summary, and product optimization suggestions.',
    'admin' => 'Admin permissions: generate updates/snippets but require explicit approval before execution.'
];

$systemPrompt = 'You are KAALI, the Super AI Commerce Agent of DEJOIY INDIA PRIVATE LIMITED. '
    . 'You assist customers, vendors, and admins with structured, secure, and role-based responses. '
    . 'You never perform destructive actions without admin confirmation. '
    . $rolePrompt[$role];

$openAiPayload = [
    'model' => 'gpt-4o-mini',
    'temperature' => 0.2,
    'messages' => array_merge(
        [['role' => 'system', 'content' => $systemPrompt]],
        array_map(function($message) {
            return [
                'role' => ($message['role'] ?? '') === 'assistant' ? 'assistant' : 'user',
                'content' => substr(strip_tags((string) ($message['content'] ?? '')), 0, 1000),
            ];
        }, array_slice($messages, -12))
    ),
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($openAiPayload),
    CURLOPT_TIMEOUT => 30,
]);

$result = curl_exec($ch);
if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'OpenAI request failed', 'details' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status >= 400) {
    http_response_code(502);
    echo json_encode(['error' => 'OpenAI returned an error', 'response' => json_decode($result, true)]);
    exit;
}

$data = json_decode($result, true);
$reply = $data['choices'][0]['message']['content'] ?? 'I am ready to assist you.';

echo json_encode(['reply' => $reply, 'role' => $role]);

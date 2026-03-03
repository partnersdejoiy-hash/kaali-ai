<?php
/**
 * Plugin Name: KAALI Control Console
 * Description: Production-ready AI Commerce Assistant control plane for WordPress + WooCommerce + WCFM.
 * Version: 1.0.0
 * Author: DEJOIY INDIA PRIVATE LIMITED
 */

if (!defined('ABSPATH')) {
    exit;
}

class Kaali_Control_Plugin {
    private string $logs_table;
    private string $suggestions_table;

    public function __construct() {
        global $wpdb;
        $this->logs_table = $wpdb->prefix . 'kaali_logs';
        $this->suggestions_table = $wpdb->prefix . 'kaali_suggestions';

        register_activation_hook(__FILE__, [$this, 'activate']);

        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'register_admin_console']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    /**
     * Create required DB tables at plugin activation.
     */
    public function activate(): void {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset = $wpdb->get_charset_collate();

        $sql_logs = "CREATE TABLE {$this->logs_table} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_role VARCHAR(30) NOT NULL,
            prompt LONGTEXT NOT NULL,
            action_type VARCHAR(80) NOT NULL,
            status VARCHAR(30) NOT NULL,
            timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY action_type (action_type),
            KEY user_role (user_role)
        ) $charset;";

        $sql_suggestions = "CREATE TABLE {$this->suggestions_table} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            question_hash VARCHAR(64) NOT NULL,
            question_text TEXT NOT NULL,
            frequency INT UNSIGNED NOT NULL DEFAULT 1,
            suggestion TEXT NULL,
            last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY question_hash (question_hash)
        ) $charset;";

        dbDelta($sql_logs);
        dbDelta($sql_suggestions);
    }

    /**
     * Register KAALI REST routes.
     */
    public function register_routes(): void {
        register_rest_route('kaali/v1', '/preview', [
            'methods' => 'POST',
            'callback' => [$this, 'preview_action'],
            'permission_callback' => [$this, 'require_admin_permissions'],
        ]);

        register_rest_route('kaali/v1', '/action', [
            'methods' => 'POST',
            'callback' => [$this, 'apply_action'],
            'permission_callback' => [$this, 'require_admin_permissions'],
        ]);
    }

    /**
     * Validate admin via JWT + WP capability + nonce.
     */
    public function require_admin_permissions(WP_REST_Request $request): bool {
        if (!current_user_can('manage_options')) {
            return false;
        }

        $nonce = $request->get_header('x_wp_nonce');
        if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
            return false;
        }

        $auth = $request->get_header('authorization');
        if (!$auth || stripos($auth, 'Bearer ') !== 0) {
            return false;
        }

        $jwt = trim(substr($auth, 7));
        return $this->validate_admin_jwt($jwt);
    }

    /**
     * Basic HS256 JWT validation for admin sessions.
     */
    private function validate_admin_jwt(string $jwt): bool {
        $secret = getenv('KAALI_ADMIN_JWT_SECRET');
        if (!$secret) {
            return false;
        }

        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }

        [$head, $payload, $signature] = $parts;
        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', "$head.$payload", $secret, true)), '+/', '-_'), '=');

        if (!hash_equals($expected, $signature)) {
            return false;
        }

        $decoded_payload = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        if (!$decoded_payload || empty($decoded_payload['role']) || $decoded_payload['role'] !== 'admin') {
            return false;
        }

        if (!empty($decoded_payload['exp']) && time() > (int) $decoded_payload['exp']) {
            return false;
        }

        return true;
    }

    /**
     * Generate structured JSON preview from admin natural language prompt.
     */
    public function preview_action(WP_REST_Request $request): WP_REST_Response {
        $prompt = sanitize_textarea_field((string) $request->get_param('prompt'));
        if (empty($prompt)) {
            return new WP_REST_Response(['error' => 'Prompt is required'], 400);
        }

        $this->log_action('admin', $prompt, 'preview', 'requested');

        $preview = $this->generate_ai_preview($prompt);
        $this->log_action('admin', wp_json_encode($preview), 'preview', 'generated');

        $this->capture_faq_suggestion($prompt);

        return new WP_REST_Response(['preview' => $preview], 200);
    }

    /**
     * Apply approved action after explicit confirmation.
     */
    public function apply_action(WP_REST_Request $request): WP_REST_Response {
        $payload = $request->get_json_params();

        $approved = !empty($payload['approved']);
        $action = isset($payload['action']) && is_array($payload['action']) ? $payload['action'] : [];

        if (!$approved) {
            $this->log_action('admin', wp_json_encode($action), 'action', 'rejected');
            return new WP_REST_Response(['status' => 'rejected'], 200);
        }

        if (empty($action['action'])) {
            return new WP_REST_Response(['error' => 'Invalid action payload'], 400);
        }

        $result = $this->execute_action($action);
        $this->log_action('admin', wp_json_encode($action), 'action', $result['status']);

        return new WP_REST_Response($result, $result['status'] === 'success' ? 200 : 400);
    }

    /**
     * Core executor with explicit allowlist.
     */
    private function execute_action(array $action): array {
        $type = sanitize_text_field((string) ($action['action'] ?? ''));

        if ($type === 'update_page') {
            $page_id = absint($action['page_id'] ?? 0);
            $new_content = wp_kses_post((string) ($action['new_content'] ?? ''));

            if (!$page_id || empty($new_content)) {
                return ['status' => 'failed', 'message' => 'Missing page_id or new_content'];
            }

            $updated = wp_update_post([
                'ID' => $page_id,
                'post_content' => $new_content,
            ], true);

            if (is_wp_error($updated)) {
                return ['status' => 'failed', 'message' => $updated->get_error_message()];
            }

            return ['status' => 'success', 'message' => 'Page updated', 'page_id' => $page_id];
        }

        if ($type === 'theme_suggestion') {
            return ['status' => 'success', 'message' => 'Theme suggestion stored as preview only. No direct filesystem changes made.'];
        }

        if ($type === 'code_snippet') {
            return ['status' => 'success', 'message' => 'Code snippet generated. Manual review required before deployment.'];
        }

        return ['status' => 'failed', 'message' => 'Unsupported action'];
    }

    /**
     * Fetch order summary by order ID.
     */
    private function get_order_summary(int $order_id): array {
        if (!function_exists('wc_get_order')) {
            return ['error' => 'WooCommerce not active'];
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            return ['error' => 'Order not found'];
        }

        return [
            'id' => $order->get_id(),
            'status' => $order->get_status(),
            'currency' => $order->get_currency(),
            'total' => $order->get_total(),
            'created' => $order->get_date_created() ? $order->get_date_created()->date('c') : null,
            'items' => array_map(function ($item) {
                return [
                    'name' => $item->get_name(),
                    'qty' => $item->get_quantity(),
                    'subtotal' => $item->get_subtotal(),
                ];
            }, $order->get_items()),
        ];
    }

    /**
     * Build secure OpenAI request and normalize structured response.
     */
    private function generate_ai_preview(string $prompt): array {
        $api_key = getenv('OPENAI_API_KEY');
        if (!$api_key) {
            return [
                'action' => 'none',
                'requires_approval' => true,
                'message' => 'OPENAI_API_KEY not configured.',
            ];
        }

        $endpoint = 'https://api.openai.com/v1/chat/completions';

        $system_prompt = 'You are KAALI, the Super AI Commerce Agent of DEJOIY INDIA PRIVATE LIMITED. '
            . 'Classify the admin instruction and return STRICT JSON only with: '
            . '{"action":"update_page|theme_suggestion|code_snippet|order_lookup|none","page_id":0,"new_content":"","requires_approval":true,"notes":""}. '
            . 'Never execute destructive actions.';

        $body = [
            'model' => 'gpt-4o-mini',
            'temperature' => 0.1,
            'messages' => [
                ['role' => 'system', 'content' => $system_prompt],
                ['role' => 'user', 'content' => $prompt],
            ],
        ];

        $response = wp_remote_post($endpoint, [
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key,
            ],
            'body' => wp_json_encode($body),
        ]);

        if (is_wp_error($response)) {
            return [
                'action' => 'none',
                'requires_approval' => true,
                'message' => 'OpenAI request failed: ' . $response->get_error_message(),
            ];
        }

        $raw = json_decode((string) wp_remote_retrieve_body($response), true);
        $content = $raw['choices'][0]['message']['content'] ?? '{}';
        $json = json_decode($content, true);

        if (!is_array($json)) {
            return [
                'action' => 'none',
                'requires_approval' => true,
                'message' => 'Unable to parse model response.',
                'raw' => $content,
            ];
        }

        if (($json['action'] ?? '') === 'order_lookup' && !empty($json['page_id'])) {
            $json['order'] = $this->get_order_summary((int) $json['page_id']);
        }

        $json['requires_approval'] = true;
        return $json;
    }

    /**
     * Log every AI-triggered event.
     */
    private function log_action(string $role, string $prompt, string $action_type, string $status): void {
        global $wpdb;
        $wpdb->insert($this->logs_table, [
            'user_role' => sanitize_text_field($role),
            'prompt' => wp_kses_post($prompt),
            'action_type' => sanitize_text_field($action_type),
            'status' => sanitize_text_field($status),
            'timestamp' => current_time('mysql'),
        ], ['%s', '%s', '%s', '%s', '%s']);
    }

    /**
     * Store frequent questions for FAQ suggestion workflow.
     */
    private function capture_faq_suggestion(string $question): void {
        global $wpdb;
        $normalized = strtolower(trim($question));
        if (strlen($normalized) < 15) {
            return;
        }

        $hash = hash('sha256', $normalized);
        $existing = $wpdb->get_row($wpdb->prepare("SELECT id, frequency FROM {$this->suggestions_table} WHERE question_hash = %s", $hash), ARRAY_A);

        if ($existing) {
            $wpdb->update(
                $this->suggestions_table,
                ['frequency' => ((int) $existing['frequency']) + 1, 'last_seen' => current_time('mysql')],
                ['id' => (int) $existing['id']],
                ['%d', '%s'],
                ['%d']
            );
            return;
        }

        $wpdb->insert($this->suggestions_table, [
            'question_hash' => $hash,
            'question_text' => sanitize_textarea_field($question),
            'frequency' => 1,
            'suggestion' => 'Consider adding this question to FAQ knowledge base.',
            'last_seen' => current_time('mysql'),
        ], ['%s', '%s', '%d', '%s', '%s']);
    }

    /**
     * Admin console menu.
     */
    public function register_admin_console(): void {
        add_menu_page(
            'Kaali Command Console',
            'Kaali Command Console',
            'manage_options',
            'kaali-command-console',
            [$this, 'render_admin_console'],
            'dashicons-format-chat',
            56
        );
    }

    public function enqueue_assets(string $hook): void {
        if ($hook !== 'toplevel_page_kaali-command-console') {
            return;
        }
        wp_enqueue_script('wp-api');
    }

    /**
     * Admin command console UI.
     */
    public function render_admin_console(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        $rest_nonce = wp_create_nonce('wp_rest');
        ?>
        <div class="wrap">
            <h1>Kaali Command Console</h1>
            <p>Enter natural-language admin commands. KAALI will return a safe preview JSON.</p>
            <textarea id="kaali_prompt" rows="8" style="width:100%;max-width:900px;"></textarea>
            <p>
                <button class="button button-primary" id="kaali_preview_btn">Generate Preview</button>
                <button class="button" id="kaali_approve_btn" disabled>Approve & Apply</button>
                <button class="button" id="kaali_reject_btn" disabled>Reject</button>
            </p>
            <pre id="kaali_preview_output" style="background:#111;color:#f1f1f1;padding:16px;max-width:900px;overflow:auto;"></pre>
        </div>

        <script>
        (function() {
            const previewBtn = document.getElementById('kaali_preview_btn');
            const approveBtn = document.getElementById('kaali_approve_btn');
            const rejectBtn = document.getElementById('kaali_reject_btn');
            const promptEl = document.getElementById('kaali_prompt');
            const output = document.getElementById('kaali_preview_output');

            let latestPreview = null;
            const jwt = window.localStorage.getItem('kaali_admin_jwt') || '';

            async function callApi(path, payload) {
                const resp = await fetch('<?php echo esc_url_raw(rest_url('kaali/v1/')); ?>' + path, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': '<?php echo esc_js($rest_nonce); ?>',
                        'Authorization': 'Bearer ' + jwt,
                    },
                    body: JSON.stringify(payload),
                });
                return resp.json();
            }

            previewBtn.addEventListener('click', async () => {
                const prompt = promptEl.value.trim();
                if (!prompt) {
                    output.textContent = 'Please add a prompt first.';
                    return;
                }
                const result = await callApi('preview', { prompt });
                latestPreview = result.preview || null;
                output.textContent = JSON.stringify(result, null, 2);
                approveBtn.disabled = !latestPreview;
                rejectBtn.disabled = !latestPreview;
            });

            approveBtn.addEventListener('click', async () => {
                if (!latestPreview) return;
                const result = await callApi('action', { approved: true, action: latestPreview });
                output.textContent = JSON.stringify(result, null, 2);
            });

            rejectBtn.addEventListener('click', async () => {
                const result = await callApi('action', { approved: false, action: latestPreview || {} });
                output.textContent = JSON.stringify(result, null, 2);
                latestPreview = null;
                approveBtn.disabled = true;
                rejectBtn.disabled = true;
            });
        })();
        </script>
        <?php
    }
}

new Kaali_Control_Plugin();

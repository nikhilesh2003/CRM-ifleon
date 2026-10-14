<?php
// iFleon CRM API Engine - High Performance Native PHP 8.2
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = __DIR__ . '/../data/crm-store.json';

function get_db() {
    global $dbPath;
    if (!file_exists($dbPath)) {
        return ['users' => [], 'leads' => [], 'tasks' => [], 'documents' => [], 'projects' => [], 'meetings' => []];
    }
    $raw = file_get_contents($dbPath);
    return json_decode($raw, true) ?: [];
}

function save_db($db) {
    global $dbPath;
    $dir = dirname($dbPath);
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    file_put_contents($dbPath, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

function get_input() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?: [];
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Parse URL parts: /api/leads, /api/leads/lead-1, /api/auth, /api/quotations, etc.
$parts = array_values(array_filter(explode('/', trim($uri, '/'))));
$apiIdx = array_search('api', $parts);
if ($apiIdx === false) {
    $route = $parts;
} else {
    $route = array_slice($parts, $apiIdx + 1);
}

$resource = $route[0] ?? '';
$param1 = $route[1] ?? '';
$param2 = $route[2] ?? '';

$db = get_db();

// 1. /api/auth
if ($resource === 'auth') {
    // Sanitized users list (without passwords)
    $sanitizedUsers = array_map(function($u) {
        unset($u['password']);
        return $u;
    }, $db['users'] ?? []);

    if ($method === 'GET') {
        session_start();
        $uid = $_GET['userId'] ?? ($_SESSION['crm_user_id'] ?? null);
        $user = null;
        if ($uid) {
            foreach ($db['users'] as $u) {
                if ($u['id'] === $uid) { $user = $u; break; }
            }
        }
        if (!$user && !empty($db['users'])) $user = $db['users'][0];
        if ($user) unset($user['password']);
        echo json_encode(['user' => $user, 'allUsers' => $sanitizedUsers]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $action = $input['action'] ?? (!empty($input['userId']) ? 'switch' : 'login');

        // Action: LOGIN
        if ($action === 'login') {
            $email = strtolower(trim($input['email'] ?? ''));
            $pass = trim($input['password'] ?? '');
            $rememberMe = !empty($input['rememberMe']);

            if (empty($email) || empty($pass)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password are required.']);
                exit;
            }

            $foundUser = null;
            foreach ($db['users'] as $u) {
                if (strtolower($u['email'] ?? '') === $email) {
                    $foundUser = $u;
                    break;
                }
            }

            if (!$foundUser) {
                http_response_code(401);
                echo json_encode(['error' => 'No account found with this email address.']);
                exit;
            }

            if (!empty($foundUser['disabled'])) {
                http_response_code(403);
                echo json_encode(['error' => 'This account has been disabled. Please contact your CRM Administrator.']);
                exit;
            }

            if (!empty($foundUser['password']) && $foundUser['password'] !== $pass) {
                http_response_code(401);
                echo json_encode(['error' => 'Incorrect password. Please try again.']);
                exit;
            }

            session_start();
            $_SESSION['crm_user_id'] = $foundUser['id'];

            $now = round(microtime(true) * 1000);
            $durationMs = $rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
            $session = [
                'userId' => $foundUser['id'],
                'email' => $foundUser['email'],
                'name' => $foundUser['name'],
                'role' => $foundUser['role'],
                'rememberMe' => $rememberMe,
                'loginTime' => $now,
                'expiresAt' => $now + $durationMs,
            ];

            unset($foundUser['password']);
            echo json_encode(['success' => true, 'user' => $foundUser, 'session' => $session]);
            exit;
        }

        // Action: GOOGLE SSO
        if ($action === 'google') {
            $email = strtolower(trim($input['email'] ?? 'rajesh.kumar@ifleon.com'));
            $name = trim($input['name'] ?? 'Enterprise Google User');
            $rememberMe = !empty($input['rememberMe']);

            $foundUser = null;
            foreach ($db['users'] as $u) {
                if (strtolower($u['email'] ?? '') === $email) {
                    $foundUser = $u;
                    break;
                }
            }

            if (!$foundUser) {
                $newId = 'user-g-' . uniqid();
                $foundUser = [
                    'id' => $newId,
                    'name' => $name,
                    'email' => $email,
                    'role' => 'consultant',
                    'phone' => '+91 94900 00000',
                    'department' => 'Corporate Outreach',
                    'disabled' => false,
                    'googleLinked' => true,
                    'tutorialCompleted' => false,
                    'createdAt' => date('c'),
                ];
                $db['users'][] = $foundUser;
                save_db($db);
            }

            session_start();
            $_SESSION['crm_user_id'] = $foundUser['id'];

            $now = round(microtime(true) * 1000);
            $durationMs = $rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
            $session = [
                'userId' => $foundUser['id'],
                'email' => $foundUser['email'],
                'name' => $foundUser['name'],
                'role' => $foundUser['role'],
                'rememberMe' => $rememberMe,
                'loginTime' => $now,
                'expiresAt' => $now + $durationMs,
            ];

            unset($foundUser['password']);
            echo json_encode(['success' => true, 'user' => $foundUser, 'session' => $session]);
            exit;
        }

        // Action: REGISTER
        if ($action === 'register') {
            $name = trim($input['name'] ?? '');
            $email = strtolower(trim($input['email'] ?? ''));
            $phone = trim($input['phone'] ?? '+91 98480 00000');
            $role = $input['role'] ?? 'consultant';
            $department = trim($input['department'] ?? 'Dealership Sales');
            $pass = trim($input['password'] ?? '');
            $rememberMe = !empty($input['rememberMe']);

            if (empty($name) || empty($email) || empty($pass)) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, and password are required.']);
                exit;
            }

            foreach ($db['users'] as $u) {
                if (strtolower($u['email'] ?? '') === $email) {
                    http_response_code(409);
                    echo json_encode(['error' => 'An account with this email address already exists.']);
                    exit;
                }
            }

            $newUser = [
                'id' => 'user-' . uniqid(),
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'role' => in_array($role, ['admin', 'manager', 'consultant']) ? $role : 'consultant',
                'department' => $department,
                'password' => $pass,
                'disabled' => false,
                'tutorialCompleted' => false,
                'createdAt' => date('c'),
            ];

            $db['users'][] = $newUser;
            save_db($db);

            session_start();
            $_SESSION['crm_user_id'] = $newUser['id'];

            $now = round(microtime(true) * 1000);
            $durationMs = $rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
            $session = [
                'userId' => $newUser['id'],
                'email' => $newUser['email'],
                'name' => $newUser['name'],
                'role' => $newUser['role'],
                'rememberMe' => $rememberMe,
                'loginTime' => $now,
                'expiresAt' => $now + $durationMs,
            ];

            unset($newUser['password']);
            echo json_encode(['success' => true, 'user' => $newUser, 'session' => $session]);
            exit;
        }

        // Action: TUTORIAL COMPLETE
        if ($action === 'tutorial_complete') {
            $userId = $input['userId'] ?? '';
            $found = null;
            foreach ($db['users'] as &$u) {
                if ($u['id'] === $userId) {
                    $u['tutorialCompleted'] = true;
                    $found = $u;
                    break;
                }
            }
            if ($found) {
                save_db($db);
                unset($found['password']);
                echo json_encode(['success' => true, 'user' => $found]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
            }
            exit;
        }

        // Action: LOGOUT
        if ($action === 'logout') {
            session_start();
            unset($_SESSION['crm_user_id']);
            echo json_encode(['success' => true]);
            exit;
        }

        // Action: SWITCH (Dev/Demo fallback)
        $uid = $input['userId'] ?? 'user-admin';
        session_start();
        $_SESSION['crm_user_id'] = $uid;
        $user = null;
        foreach ($db['users'] as $u) {
            if ($u['id'] === $uid) { $user = $u; break; }
        }
        if ($user) unset($user['password']);
        echo json_encode(['user' => $user, 'allUsers' => $sanitizedUsers]);
        exit;
    }
}

// 2. /api/leads
if ($resource === 'leads') {
    // Single lead: /api/leads/{id}
    if (!empty($param1)) {
        $leadId = $param1;
        if ($method === 'GET') {
            foreach ($db['leads'] as $l) {
                if ($l['id'] === $leadId) {
                    $meetings = array_values(array_filter($db['meetings'] ?? [], fn($m) => ($m['leadId'] ?? '') === $leadId));
                    $tasks = array_values(array_filter($db['tasks'] ?? [], fn($t) => ($t['leadId'] ?? '') === $leadId));
                    $l['meetings'] = $meetings;
                    $l['tasks'] = $tasks;
                    echo json_encode(['lead' => $l]);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Lead not found']);
            exit;
        } elseif ($method === 'PUT') {
            $input = get_input();
            $updated = null;
            foreach ($db['leads'] as &$l) {
                if ($l['id'] === $leadId) {
                    $l = array_merge($l, $input, ['updatedAt' => date('c')]);
                    $updated = $l;
                    break;
                }
            }
            if ($updated) {
                save_db($db);
                echo json_encode(['lead' => $updated]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Lead not found']);
            }
            exit;
        }
    }

    // List leads: GET /api/leads
    if ($method === 'GET') {
        $search = strtolower(trim($_GET['search'] ?? ''));
        $status = $_GET['status'] ?? '';
        $consultantId = $_GET['consultantId'] ?? '';
        $reviewStatus = $_GET['reviewStatus'] ?? '';

        $leads = array_map(function($l) use ($db) {
            $lid = $l['id'];
            $l['meetings'] = array_values(array_filter($db['meetings'] ?? [], fn($m) => ($m['leadId'] ?? '') === $lid));
            $l['tasks'] = array_values(array_filter($db['tasks'] ?? [], fn($t) => ($t['leadId'] ?? '') === $lid));
            return $l;
        }, $db['leads'] ?? []);

        if (!empty($search)) {
            $leads = array_values(array_filter($leads, function($l) use ($search) {
                return str_contains(strtolower($l['businessName'] ?? ''), $search) ||
                       str_contains(strtolower($l['contactPerson'] ?? ''), $search) ||
                       str_contains(strtolower($l['phone'] ?? ''), $search) ||
                       str_contains(strtolower($l['location'] ?? ''), $search);
            }));
        }
        if (!empty($status)) {
            $leads = array_values(array_filter($leads, fn($l) => ($l['status'] ?? '') === $status));
        }
        if (!empty($consultantId)) {
            $leads = array_values(array_filter($leads, fn($l) => ($l['consultantId'] ?? '') === $consultantId));
        }
        if (!empty($reviewStatus)) {
            $leads = array_values(array_filter($leads, fn($l) => ($l['managerReview'] ?? '') === $reviewStatus));
        }

        echo json_encode(['leads' => array_values($leads)]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $newLead = array_merge([
            'id' => 'lead-' . time(),
            'createdAt' => date('c'),
            'updatedAt' => date('c'),
            'status' => 'New / Contacted',
            'managerReview' => 'Approved',
            'meetings' => [],
            'tasks' => [],
            'attachments' => [],
            'tags' => ['Inbound'],
        ], $input);
        array_unshift($db['leads'], $newLead);
        save_db($db);
        echo json_encode(['lead' => $newLead]);
        exit;
    }
}

// 3. /api/tasks
if ($resource === 'tasks') {
    if ($method === 'GET') {
        echo json_encode(['tasks' => $db['tasks'] ?? []]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $newTask = array_merge([
            'id' => 'task-' . time(),
            'completed' => false,
            'createdAt' => date('c'),
        ], $input);
        array_unshift($db['tasks'], $newTask);
        save_db($db);
        echo json_encode(['task' => $newTask]);
        exit;
    } elseif ($method === 'PUT') {
        $input = get_input();
        $taskId = $input['id'] ?? '';
        foreach ($db['tasks'] as &$t) {
            if ($t['id'] === $taskId) {
                $t = array_merge($t, $input);
                break;
            }
        }
        save_db($db);
        echo json_encode(['tasks' => $db['tasks']]);
        exit;
    }
}

// 4. /api/quotations
if ($resource === 'quotations') {
    if ($method === 'GET') {
        echo json_encode(['documents' => $db['documents'] ?? []]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $newDoc = array_merge([
            'id' => 'doc-' . time(),
            'quotationNumber' => 'IFL-Q-2026-' . sprintf('%04d', count($db['documents'] ?? []) + 1),
            'createdAt' => date('c'),
            'status' => 'Needs Approval',
        ], $input);
        array_unshift($db['documents'], $newDoc);
        save_db($db);
        echo json_encode(['document' => $newDoc]);
        exit;
    } elseif ($method === 'PUT') {
        $input = get_input();
        $docId = $input['id'] ?? '';
        foreach ($db['documents'] as &$d) {
            if ($d['id'] === $docId) {
                $d = array_merge($d, $input);
                break;
            }
        }
        save_db($db);
        echo json_encode(['documents' => $db['documents']]);
        exit;
    }
}

// 5. /api/projects
if ($resource === 'projects') {
    if ($method === 'GET') {
        echo json_encode(['projects' => $db['projects'] ?? []]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $newProj = array_merge([
            'id' => 'proj-' . time(),
            'createdAt' => date('c'),
        ], $input);
        array_push($db['projects'], $newProj);
        save_db($db);
        echo json_encode(['project' => $newProj]);
        exit;
    }
}

// 6. /api/meetings
if ($resource === 'meetings') {
    if ($method === 'GET') {
        echo json_encode(['meetings' => $db['meetings'] ?? []]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $leadId = $input['leadId'] ?? '';
        $newMeet = array_merge([
            'id' => 'meet-' . time(),
            'createdAt' => date('c'),
        ], $input);
        array_unshift($db['meetings'], $newMeet);
        save_db($db);
        echo json_encode(['meeting' => $newMeet]);
        exit;
    }
}

// 7. /api/admin/users
if ($resource === 'admin' && $param1 === 'users') {
    if ($method === 'GET') {
        echo json_encode(['users' => $db['users'] ?? []]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $newUser = array_merge([
            'id' => 'user-' . time(),
            'createdAt' => date('c'),
            'disabled' => false,
        ], $input);
        array_push($db['users'], $newUser);
        save_db($db);
        echo json_encode(['user' => $newUser]);
        exit;
    }
}

// 8. /api/admin/upload-logo
if ($resource === 'admin' && $param1 === 'upload-logo') {
    if ($method === 'POST') {
        $input = get_input();
        $fileData = $input['fileData'] ?? '';
        $slot = preg_replace('/[^a-zA-Z0-9_-]/', '', $input['slot'] ?? 'logo');
        $fileName = preg_replace('/[^a-zA-Z0-9_.-]/', '', $input['fileName'] ?? 'logo.png');
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION)) ?: 'png';

        if (!empty($fileData)) {
            if (preg_match('/^data:image\/([a-zA-Z0-9-+.]+);base64,/', $fileData, $type)) {
                $fileData = substr($fileData, strpos($fileData, ',') + 1);
                $ext = strtolower($type[1]);
                if ($ext === 'jpeg') $ext = 'jpg';
            }
            $data = base64_decode($fileData);
            if ($data !== false) {
                $uploadDir = __DIR__ . '/../uploads';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                $destName = 'logo-' . $slot . '-' . time() . '.' . $ext;
                file_put_contents($uploadDir . '/' . $destName, $data);
                $url = '/uploads/' . $destName;

                if ($slot === 'light') {
                    $db['settings']['lightLogoUrl'] = $url;
                    $db['settings']['horizontalLogoUrl'] = $url;
                } elseif ($slot === 'dark') {
                    $db['settings']['darkLogoUrl'] = $url;
                } elseif ($slot === 'icon') {
                    $db['settings']['iconLogoUrl'] = $url;
                }
                save_db($db);

                echo json_encode(['success' => true, 'url' => $url, 'settings' => $db['settings']]);
                exit;
            }
        }
        http_response_code(400);
        echo json_encode(['error' => 'Invalid image data.']);
        exit;
    }
}

// 8.1 /api/admin/settings
if ($resource === 'admin' && $param1 === 'settings') {
    if ($method === 'GET') {
        echo json_encode([
            'settings' => $db['settings'] ?? [],
            'themes' => $db['themes'] ?? [],
            'activeThemeId' => $db['activeThemeId'] ?? null
        ]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        if (isset($input['settings'])) $db['settings'] = $input['settings'];
        if (isset($input['activeThemeId'])) $db['activeThemeId'] = $input['activeThemeId'];
        if (isset($input['theme'])) {
            $found = false;
            foreach ($db['themes'] as &$t) {
                if ($t['id'] === $input['theme']['id']) { $t = $input['theme']; $found = true; break; }
            }
            if (!$found) $db['themes'][] = $input['theme'];
        }
        save_db($db);
        echo json_encode(['status' => 'ok']);
        exit;
    }
}

// 9. /api/ai
if ($resource === 'ai') {
    $input = get_input();
    echo json_encode([
        'result' => "Professional proposal generated by iFleon Intelligence Framework.\n\nKey Deliverables:\n1. Cloud Portal Deployment\n2. Real-time Lead Tracking\n3. Executive Review Dashboard",
        'timestamp' => date('c')
    ]);
    exit;
}

// 9. /api/email
function send_smtp_socket($host, $port, $user, $pass, $fromEmail, $fromName, $toEmail, $subject, $htmlContent) {
    $timeout = 10;
    $isSsl = ($port == 465);
    $transport = $isSsl ? "ssl://{$host}" : "tcp://{$host}";
    
    $socket = @stream_socket_client("{$transport}:{$port}", $errno, $errstr, $timeout);
    if (!$socket) {
        return ['success' => false, 'error' => "Socket connection to {$host}:{$port} failed: {$errstr} ({$errno})"];
    }
    
    stream_set_timeout($socket, $timeout);
    $response = fgets($socket, 512);
    if (substr($response, 0, 3) !== '220') {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP greeting failed: {$response}"];
    }

    fputs($socket, "EHLO ifleon.com\r\n");
    $ehloResp = '';
    while ($line = fgets($socket, 512)) {
        $ehloResp .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }

    if (!$isSsl && (strpos($ehloResp, 'STARTTLS') !== false || $port == 587)) {
        fputs($socket, "STARTTLS\r\n");
        $tlsResp = fgets($socket, 512);
        if (substr($tlsResp, 0, 3) === '220') {
            if (!@stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                return ['success' => false, 'error' => 'STARTTLS handshake failed'];
            }
            fputs($socket, "EHLO ifleon.com\r\n");
            while ($line = fgets($socket, 512)) {
                if (substr($line, 3, 1) === ' ') break;
            }
        }
    }

    fputs($socket, "AUTH LOGIN\r\n");
    $authResp = fgets($socket, 512);
    if (substr($authResp, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => "AUTH LOGIN rejected: {$authResp}"];
    }

    fputs($socket, base64_encode($user) . "\r\n");
    $uResp = fgets($socket, 512);
    if (substr($uResp, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => "User rejected: {$uResp}"];
    }

    fputs($socket, base64_encode($pass) . "\r\n");
    $pResp = fgets($socket, 512);
    if (substr($pResp, 0, 3) !== '235') {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP Authentication failed: {$pResp}"];
    }

    fputs($socket, "MAIL FROM:<{$fromEmail}>\r\n");
    $mfResp = fgets($socket, 512);
    if (substr($mfResp, 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => "MAIL FROM rejected: {$mfResp}"];
    }

    fputs($socket, "RCPT TO:<{$toEmail}>\r\n");
    $rcptResp = fgets($socket, 512);
    if (substr($rcptResp, 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => "RCPT TO rejected: {$rcptResp}"];
    }

    fputs($socket, "DATA\r\n");
    $dataResp = fgets($socket, 512);
    if (substr($dataResp, 0, 3) !== '354') {
        fclose($socket);
        return ['success' => false, 'error' => "DATA rejected: {$dataResp}"];
    }

    $msg = "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>\r\n";
    $msg .= "To: <{$toEmail}>\r\n";
    $msg .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $msg .= "Date: " . date('r') . "\r\n";
    $msg .= "X-Mailer: iFleon-CRM-Hostinger/1.0\r\n\r\n";
    $msg .= $htmlContent . "\r\n.\r\n";

    fputs($socket, $msg);
    $sendResp = fgets($socket, 512);
    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if (substr($sendResp, 0, 3) === '250') {
        return ['success' => true, 'transport' => 'Hostinger SMTP Direct (' . ($isSsl ? 'SSL 465' : 'TLS') . ')', 'response' => trim($sendResp)];
    } else {
        return ['success' => false, 'error' => "SMTP message send error: {$sendResp}"];
    }
}

function send_elastic_email($apiKey, $fromEmail, $fromName, $toEmail, $subject, $htmlContent) {
    $url = 'https://api.elasticemail.com/v2/email/send';
    $postData = http_build_query([
        'apikey' => $apiKey,
        'from' => $fromEmail,
        'fromName' => $fromName,
        'to' => $toEmail,
        'subject' => $subject,
        'bodyHtml' => $htmlContent,
        'isTransactional' => true,
    ]);
    
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $postData,
            'timeout' => 15,
            'ignore_errors' => true,
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) {
        return ['success' => false, 'error' => 'ElasticEmail HTTP connection failed'];
    }
    $json = json_decode($res, true);
    if (!empty($json['success'])) {
        return ['success' => true, 'transport' => 'ElasticEmail API v2', 'transactionId' => $json['data']['transactionid'] ?? ''];
    } else {
        return ['success' => false, 'error' => $json['error'] ?? 'ElasticEmail error'];
    }
}

function send_brevo_email($apiKey, $fromEmail, $fromName, $toEmail, $subject, $htmlContent) {
    $url = 'https://api.brevo.com/v3/smtp/email';
    $payload = json_encode([
        'sender' => ['name' => $fromName, 'email' => $fromEmail],
        'to' => [['email' => $toEmail]],
        'subject' => $subject,
        'htmlContent' => $htmlContent,
    ]);
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\napi-key: {$apiKey}\r\n",
            'content' => $payload,
            'timeout' => 15,
            'ignore_errors' => true,
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) {
        return ['success' => false, 'error' => 'Brevo HTTP request failed'];
    }
    $json = json_decode($res, true);
    if (!empty($json['messageId'])) {
        return ['success' => true, 'transport' => 'Brevo API v3', 'messageId' => $json['messageId']];
    } else {
        return ['success' => false, 'error' => $json['message'] ?? 'Brevo error'];
    }
}

function send_native_php_mail($fromEmail, $fromName, $toEmail, $subject, $htmlContent) {
    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . "=?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>",
        'Reply-To: ' . $fromEmail,
        'X-Mailer: iFleon-CRM-Hostinger-MTA/1.0',
    ];
    $headerStr = implode("\r\n", $headers);
    $sent = @mail($toEmail, $encodedSubject, $htmlContent, $headerStr, "-f{$fromEmail}");
    if (!$sent) {
        $sent = @mail($toEmail, $encodedSubject, $htmlContent, $headerStr);
    }
    if ($sent) {
        return ['success' => true, 'transport' => 'Hostinger Native MTA (lsphp mail)'];
    } else {
        return ['success' => false, 'error' => 'PHP mail() dispatch failed'];
    }
}

function send_crm_email($to, $subject, $htmlContent, $cfg) {
    $provider = $cfg['provider'] ?? 'hostinger_smtp';
    $senderEmail = $cfg['senderEmail'] ?? 'contact@ifleon.com';
    $senderName = $cfg['senderName'] ?? 'iFleon Corporate CRM';
    $apiKey = $cfg['apiKey'] ?? '';
    $smtpHost = $cfg['smtpHost'] ?? 'smtp.hostinger.com';
    $smtpPort = intval($cfg['smtpPort'] ?? 465);
    $smtpUser = $cfg['smtpUser'] ?? $senderEmail;
    $smtpPass = $cfg['smtpPass'] ?? $apiKey;

    $res = null;

    if ($provider === 'elasticemail' && !empty($apiKey)) {
        $res = send_elastic_email($apiKey, $senderEmail, $senderName, $to, $subject, $htmlContent);
    } elseif ($provider === 'brevo' && !empty($apiKey)) {
        $res = send_brevo_email($apiKey, $senderEmail, $senderName, $to, $subject, $htmlContent);
    } elseif (($provider === 'hostinger_smtp' || $provider === 'custom_smtp') && !empty($smtpHost) && !empty($smtpPass)) {
        $res = send_smtp_socket($smtpHost, $smtpPort, $smtpUser, $smtpPass, $senderEmail, $senderName, $to, $subject, $htmlContent);
    } elseif ($provider === 'native_mail') {
        $res = send_native_php_mail($senderEmail, $senderName, $to, $subject, $htmlContent);
    }

    // Auto-fallback to Hostinger Native MTA if primary method produces an error or connection failure
    if (!$res || empty($res['success'])) {
        $primaryError = $res['error'] ?? 'Primary transport connection unavailable';
        $fallbackRes = send_native_php_mail($senderEmail, $senderName, $to, $subject, $htmlContent);
        if ($fallbackRes['success']) {
            return [
                'success' => true,
                'transport' => $fallbackRes['transport'] . ' (Auto-Fallback)',
                'fallbackNotice' => "Primary method ({$provider}) reported: {$primaryError}. Delivered via Hostinger Native Mail Engine."
            ];
        } else {
            return [
                'success' => false,
                'error' => "Primary ({$provider}): {$primaryError} | Fallback (Hostinger MTA): " . ($fallbackRes['error'] ?? 'Failed')
            ];
        }
    }

    return $res;
}

function get_email_template($title, $bodyHtml, $metaDetails = []) {
    $rows = '';
    foreach ($metaDetails as $k => $v) {
        $rows .= "<tr><td style='padding:8px 12px;font-weight:600;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;'>{$k}</td><td style='padding:8px 12px;color:#0f172a;font-family:monospace;font-size:12px;border-bottom:1px solid #e2e8f0;'>{$v}</td></tr>";
    }
    $metaTable = !empty($rows) ? "<table style='width:100%;border-collapse:collapse;margin-top:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;'>{$rows}</table>" : '';

    return "<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;}</style>
</head>
<body style='margin:0;padding:24px;background-color:#f1f5f9;'>
  <div style='max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);'>
    <div style='background:#1e3a8a;padding:20px 24px;border-bottom:3px solid #3b82f6;'>
      <table style='width:100%;border-collapse:collapse;'>
        <tr>
          <td>
            <div style='font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;font-family:sans-serif;'>IFLEON</div>
            <div style='font-size:11px;color:#93c5fd;font-weight:600;margin-top:2px;letter-spacing:0.5px;'>INTELLIGENT FRAMEWORKS • POWERFUL EXECUTION</div>
          </td>
          <td style='text-align:right;'>
            <span style='background:#172554;color:#bfdbfe;font-size:10px;font-weight:700;padding:5px 10px;border-radius:4px;text-transform:uppercase;'>Corporate CRM</span>
          </td>
        </tr>
      </table>
    </div>
    <div style='padding:28px 24px;'>
      <h2 style='margin-top:0;font-size:18px;font-weight:700;color:#0f172a;'>{$title}</h2>
      <div style='font-size:14px;line-height:1.65;color:#334155;'>
        {$bodyHtml}
      </div>
      {$metaTable}
    </div>
    <div style='background:#f8fafc;padding:18px 24px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;'>
      <div style='font-weight:600;color:#475569;'>iFleon Technologies • Trunk Road Commercial Center, Nellore, AP - 524001</div>
      <div style='margin-top:4px;'>This is an automated operational notification dispatched by the iFleon CRM Outbound Gateway.</div>
      <div style='margin-top:4px;font-family:monospace;font-size:10px;color:#94a3b8;'>crm.ifleon.com • contact@ifleon.com</div>
    </div>
  </div>
</body>
</html>";
}

if ($resource === 'email') {
    if ($method === 'GET') {
        $cfg = $db['settings']['emailConfig'] ?? [];
        $maskedCfg = $cfg;
        if (!empty($maskedCfg['apiKey'])) {
            $maskedCfg['apiKeyMasked'] = substr($maskedCfg['apiKey'], 0, 4) . '••••••••' . substr($maskedCfg['apiKey'], -4);
        }
        if (!empty($maskedCfg['smtpPass'])) {
            $maskedCfg['smtpPassMasked'] = '••••••••••••';
        }
        echo json_encode([
            'config' => $maskedCfg,
            'logs' => array_slice($db['emailLogs'] ?? [], 0, 50),
        ]);
        exit;
    } elseif ($method === 'POST') {
        $input = get_input();
        $action = $input['action'] ?? 'send';

        if ($action === 'test') {
            $recipient = trim($input['recipient'] ?? 'contact@ifleon.com');
            $testCfg = array_merge($db['settings']['emailConfig'] ?? [], $input['config'] ?? []);

            $subject = "[Gateway Test] iFleon Corporate CRM Email Delivery Verification";
            $body = "<p>This is a formal test verification message generated by the <strong>iFleon Enterprise CRM Email Gateway</strong>.</p>
                     <p>If you have received this message, outbound mail delivery is operational and properly routed through your configured mail service.</p>";

            $meta = [
                'Recipient' => $recipient,
                'Configured Provider' => strtoupper($testCfg['provider'] ?? 'HOSTINGER_SMTP'),
                'Sender Profile' => ($testCfg['senderName'] ?? 'iFleon Corporate CRM') . ' &lt;' . ($testCfg['senderEmail'] ?? 'contact@ifleon.com') . '&gt;',
                'Host / Gateway' => ($testCfg['smtpHost'] ?? 'smtp.hostinger.com') . ':' . ($testCfg['smtpPort'] ?? 465),
                'Timestamp (Server)' => date('Y-m-d H:i:s T'),
                'Dispatch Node' => $_SERVER['SERVER_NAME'] ?? 'crm.ifleon.com',
            ];

            $html = get_email_template("Email Gateway Verification", $body, $meta);
            $sendResult = send_crm_email($recipient, $subject, $html, $testCfg);

            $logEntry = [
                'id' => 'elog-' . time(),
                'recipient' => $recipient,
                'subject' => $subject,
                'type' => 'test',
                'provider' => $testCfg['provider'] ?? 'hostinger_smtp',
                'status' => !empty($sendResult['success']) ? 'sent' : 'failed',
                'transport' => $sendResult['transport'] ?? '',
                'error' => $sendResult['error'] ?? null,
                'sentAt' => date('c'),
            ];
            if (!isset($db['emailLogs'])) $db['emailLogs'] = [];
            array_unshift($db['emailLogs'], $logEntry);
            save_db($db);

            echo json_encode([
                'success' => !empty($sendResult['success']),
                'recipient' => $recipient,
                'transport' => $sendResult['transport'] ?? '',
                'fallbackNotice' => $sendResult['fallbackNotice'] ?? null,
                'error' => $sendResult['error'] ?? null,
                'log' => $logEntry
            ]);
            exit;
        }

        if ($action === 'send') {
            $to = trim($input['to'] ?? '');
            $subject = trim($input['subject'] ?? 'Notification from iFleon CRM');
            $contentHtml = $input['html'] ?? nl2br(htmlspecialchars($input['message'] ?? ''));
            $type = $input['type'] ?? 'general';
            $title = $input['title'] ?? 'iFleon Operational Notification';
            $meta = $input['meta'] ?? [];

            if (empty($to)) {
                http_response_code(400);
                echo json_encode(['error' => 'Recipient email (to) is required.']);
                exit;
            }

            $cfg = $db['settings']['emailConfig'] ?? [];
            if (empty($cfg['enabled'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email service is currently disabled in Admin Settings.']);
                exit;
            }

            $fullHtml = get_email_template($title, $contentHtml, $meta);
            $sendResult = send_crm_email($to, $subject, $fullHtml, $cfg);

            $logEntry = [
                'id' => 'elog-' . time(),
                'recipient' => $to,
                'subject' => $subject,
                'type' => $type,
                'provider' => $cfg['provider'] ?? 'hostinger_smtp',
                'status' => !empty($sendResult['success']) ? 'sent' : 'failed',
                'transport' => $sendResult['transport'] ?? '',
                'error' => $sendResult['error'] ?? null,
                'sentAt' => date('c'),
            ];
            if (!isset($db['emailLogs'])) $db['emailLogs'] = [];
            array_unshift($db['emailLogs'], $logEntry);
            save_db($db);

            echo json_encode([
                'success' => !empty($sendResult['success']),
                'transport' => $sendResult['transport'] ?? '',
                'fallbackNotice' => $sendResult['fallbackNotice'] ?? null,
                'error' => $sendResult['error'] ?? null,
                'log' => $logEntry,
            ]);
            exit;
        }
    }
}

// 10. Fallback
echo json_encode(['status' => 'ok', 'resource' => $resource]);


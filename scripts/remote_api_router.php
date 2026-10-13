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

// 10. Fallback
echo json_encode(['status' => 'ok', 'resource' => $resource]);

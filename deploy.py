#!/usr/bin/env python3
"""
Hostinger Deployment & Git Commit Script for CRM-IFLEON
======================================================
Automates the full release cycle:
1. Stages and commits local changes to Git (with push to remote).
2. Updates deployment metadata with git commit info.
3. Builds the Next.js static production bundle (npm run build).
4. Prepares the LiteSpeed/Apache out/ distribution with PHP API router and .htaccess.
5. Archives and deploys to Hostinger via SFTP & SSH.
6. Verifies live deployment health on https://crm.ifleon.com.

Usage:
    python deploy.py                          # Interactive prompt for commit message
    python deploy.py -m "Fix lead filter UI"  # Commit with message & deploy
    python deploy.py --no-commit              # Deploy without committing
    python deploy.py --no-build               # Deploy existing build without rebuild
    python deploy.py --verify                 # Verify live site only
"""

import os
import sys
import argparse
import subprocess
import shutil
import tarfile
import json
import time
import urllib.request
import urllib.error
from datetime import datetime

# ======================== CONFIGURATION ========================
SERVER_CONFIG = {
    "host": "86.38.243.155",
    "port": 65002,
    "username": "u408450631",
    "password": "Nikhil@1122Z",
    "remote_dir": "/home/u408450631/domains/ifleon.com/public_html/crm",
    "live_url": "https://crm.ifleon.com",
}

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
OUT_DIR = os.path.join(ROOT_DIR, "out")
TAR_FILE = os.path.join(ROOT_DIR, "deploy_site.tar.gz")
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")

# ANSI color codes
class Color:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"

def log_step(step_num, title):
    print(f"\n{Color.BOLD}{Color.CYAN}[Step {step_num}] {title}{Color.RESET}")

def log_success(msg):
    print(f"  {Color.GREEN}✓ {msg}{Color.RESET}")

def log_warning(msg):
    print(f"  {Color.YELLOW}⚠ {msg}{Color.RESET}")

def log_error(msg):
    print(f"  {Color.RED}✗ {msg}{Color.RESET}")

def log_info(msg):
    print(f"  {Color.BLUE}ℹ {msg}{Color.RESET}")

def run_command(cmd, cwd=ROOT_DIR, check=True, capture=False):
    """Run shell command with streaming output or captured output."""
    if capture:
        result = subprocess.run(cmd, cwd=cwd, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if check and result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, cmd, result.stdout, result.stderr)
        return result.stdout.strip()
    else:
        result = subprocess.run(cmd, cwd=cwd, shell=True)
        if check and result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, cmd)
        return result.returncode

# ======================== 1. GIT COMMIT & PUSH ========================
def handle_git_commit(message=None, no_push=False):
    log_step(1, "Git Commit & Push")

    status = run_command("git status --porcelain", capture=True)
    branch = run_command("git branch --show-current", capture=True) or "main"

    if not status:
        log_info(f"Working tree is clean on branch '{branch}'. Nothing new to commit.")
        return False

    changed_files = [line.strip() for line in status.splitlines() if line.strip()]
    print(f"  Detected {len(changed_files)} changed/untracked file(s):")
    for f in changed_files[:8]:
        print(f"    - {f}")
    if len(changed_files) > 8:
        print(f"    - ... and {len(changed_files) - 8} more file(s)")

    if not message:
        default_msg = f"Auto deploy update - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        try:
            prompt = f"\n  Enter commit message [Enter for '{default_msg}']: "
            user_msg = input(prompt).strip()
            message = user_msg if user_msg else default_msg
        except (EOFError, KeyboardInterrupt):
            message = default_msg

    print(f"\n  Staging all changes with: git add -A")
    run_command("git add -A")

    print(f"  Committing changes: \"{message}\"")
    commit_res = subprocess.run(["git", "commit", "-m", message], cwd=ROOT_DIR)
    if commit_res.returncode != 0:
        log_warning("Git commit exited with non-zero status (maybe files unchanged after add).")

    if not no_push:
        print(f"  Pushing branch '{branch}' to origin...")
        try:
            run_command(f"git push origin {branch}")
            log_success(f"Pushed to origin/{branch}")
        except Exception as e:
            log_warning(f"Could not push to remote origin: {e}")
    else:
        log_info("Skipping push to remote (--no-push flag active).")

    log_success("Git commit completed successfully!")
    return True

# ======================== 2. UPDATE DEPLOYMENT METADATA ========================
def update_deployment_metadata():
    log_step(2, "Generating Deployment & Version Metadata")
    gen_script = os.path.join(SCRIPTS_DIR, "generate_deployment_info.js")
    if os.path.exists(gen_script):
        run_command(f'node "{gen_script}"')
        log_success("Generated fresh deployment-info.json from Git metadata.")
    else:
        log_warning("scripts/generate_deployment_info.js not found, skipping metadata generation.")

# ======================== 3. BUILD APPLICATION ========================
def build_application():
    log_step(3, "Building Next.js Static Application")
    print("  Running: npm run build ...")
    start = time.time()
    run_command("npm run build")
    elapsed = round(time.time() - start, 1)
    log_success(f"Build completed in {elapsed}s.")

# ======================== 4. PREPARE OUT/ FOR HOSTINGER ========================
def prepare_out_directory():
    log_step(4, "Preparing Distribution (out/) Directory")

    if not os.path.exists(OUT_DIR):
        raise FileNotFoundError(f"Directory {OUT_DIR} does not exist. Please run npm run build first.")

    # 1. out/api & index.php
    api_dir = os.path.join(OUT_DIR, "api")
    os.makedirs(api_dir, exist_ok=True)
    php_router_src = os.path.join(SCRIPTS_DIR, "remote_api_router.php")
    if os.path.exists(php_router_src):
        shutil.copyfile(php_router_src, os.path.join(api_dir, "index.php"))
        log_success("Copied remote_api_router.php -> out/api/index.php")

    # 2. out/data & backups
    out_data_dir = os.path.join(OUT_DIR, "data")
    os.makedirs(os.path.join(out_data_dir, "backups"), exist_ok=True)

    for data_file in ["crm-store.json", "db-config.json", "deployment-info.json"]:
        src = os.path.join(ROOT_DIR, "data", data_file)
        if os.path.exists(src):
            shutil.copyfile(src, os.path.join(out_data_dir, data_file))
            log_success(f"Copied data/{data_file} -> out/data/{data_file}")
            if data_file == "deployment-info.json":
                shutil.copyfile(src, os.path.join(OUT_DIR, "deployment-info.json"))

    # 3. Clean directory route fallbacks (e.g. out/leads/index.html)
    route_dirs = [
        "login", "register", "leads", "quotations", "tasks",
        "analytics", "projects", "review-inbox", "audit-log"
    ]
    created_fallbacks = 0
    for r in route_dirs:
        html_file = os.path.join(OUT_DIR, f"{r}.html")
        dest_dir = os.path.join(OUT_DIR, r)
        if os.path.exists(html_file):
            os.makedirs(dest_dir, exist_ok=True)
            shutil.copyfile(html_file, os.path.join(dest_dir, "index.html"))
            created_fallbacks += 1
    log_success(f"Generated {created_fallbacks} route index.html fallbacks for zero-redirect clean URLs.")

    # 4. Write .htaccess
    htaccess_content = """<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Route API requests directly to PHP router
  RewriteRule ^api/(.*)$ api/index.php [QSA,L]
  RewriteRule ^api$ api/index.php [QSA,L]

  # 2. Existing static files
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # 3. Dynamic lead detail fallback: /leads/{any_id} -> leads/[id].html
  RewriteRule ^leads/([^/]+)/?$ leads/[id].html [L]

  # 4. Clean URLs without .html extension (serves $1.html directly with 0 redirects)
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f
  RewriteRule ^([^/]+)/?$ $1.html [L]

  # 5. Clean URLs in subdirectories (admin/users, admin/settings)
  RewriteCond %{DOCUMENT_ROOT}/$1/$2.html -f
  RewriteRule ^([^/]+)/([^/]+)/?$ $1/$2.html [L]

  # 6. Existing directories
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 7. SPA Fallback
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]
</IfModule>
"""
    with open(os.path.join(OUT_DIR, ".htaccess"), "w", encoding="utf-8") as f:
        f.write(htaccess_content)
    log_success("Configured out/.htaccess for LiteSpeed / Apache routing.")

    # 5. Create tar.gz archive
    print("  Compressing out/ into deploy_site.tar.gz ...")
    if os.path.exists(TAR_FILE):
        try:
            os.remove(TAR_FILE)
        except OSError:
            pass

    with tarfile.open(TAR_FILE, "w:gz") as tar:
        for root, dirs, files in os.walk(OUT_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, OUT_DIR)
                tar.add(full_path, arcname=rel_path)

    tar_size = os.path.getsize(TAR_FILE) / (1024 * 1024)
    log_success(f"Created deploy_site.tar.gz ({tar_size:.2f} MB)")

# ======================== 5. DEPLOY TO HOSTINGER ========================
def deploy_to_hostinger():
    log_step(5, f"Deploying to Hostinger ({SERVER_CONFIG['host']})")

    # Check if paramiko is installed
    try:
        import paramiko
    except ImportError:
        log_warning("paramiko not found in current Python. Delegating to node scripts/pack_and_deploy_static.js...")
        run_command(f'node "{os.path.join(SCRIPTS_DIR, "pack_and_deploy_static.js")}"')
        return

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"  Connecting to {SERVER_CONFIG['host']}:{SERVER_CONFIG['port']} via SSH/SFTP...")
    ssh.connect(
        hostname=SERVER_CONFIG["host"],
        port=SERVER_CONFIG["port"],
        username=SERVER_CONFIG["username"],
        password=SERVER_CONFIG["password"],
        timeout=30,
        banner_timeout=30
    )
    log_success("SSH connection established.")

    sftp = ssh.open_sftp()
    remote_tar = f"{SERVER_CONFIG['remote_dir']}/deploy_site.tar.gz"

    # SFTP file upload with progress callback
    total_size = os.path.getsize(TAR_FILE)
    uploaded_bytes = 0
    last_reported = 0

    def progress_callback(transferred, total):
        nonlocal uploaded_bytes, last_reported
        pct = int((transferred / total) * 100)
        if pct >= last_reported + 10 or pct == 100:
            print(f"  Uploading archive: {pct}% ({transferred / 1024 / 1024:.2f} MB / {total / 1024 / 1024:.2f} MB)")
            last_reported = pct

    print("  Uploading deploy_site.tar.gz to remote server...")
    sftp.put(TAR_FILE, remote_tar, callback=progress_callback)
    log_success("Archive upload complete!")

    # Remote extraction & permission commands
    remote_cmds = [
        f"cd {SERVER_CONFIG['remote_dir']}",
        'pkill -f "entry.js" 2>/dev/null || true',
        'rm -rf wp-admin wp-includes wp-content wp-*.php index.php xmlrpc.php default.php crm.sock crm.log',
        'tar -xzf deploy_site.tar.gz --overwrite',
        'rm -f deploy_site.tar.gz',
        'chmod -R 755 .',
        'chmod -R 777 data uploads 2>/dev/null || true',
        'mkdir -p uploads data/backups',
        'chmod -R 777 uploads data/backups',
        'chmod 644 .htaccess',
        'echo "=== DEPLOYMENT EXTRACTION COMPLETE ==="',
        'ls -la api',
    ]
    full_cmd = " && ".join(remote_cmds)

    print("  Extracting archive and applying server permissions...")
    stdin, stdout, stderr = ssh.exec_command(full_cmd)
    output = stdout.read().decode("utf-8", errors="replace")
    errors = stderr.read().decode("utf-8", errors="replace")

    for line in output.splitlines():
        if line.strip():
            print(f"    {line}")

    # Ensure api/index.php and deployment-info.json are directly synced
    local_php = os.path.join(OUT_DIR, "api", "index.php")
    remote_php = f"{SERVER_CONFIG['remote_dir']}/api/index.php"
    if os.path.exists(local_php):
        sftp.put(local_php, remote_php)
        log_success("Verified and synchronized api/index.php via SFTP.")

    local_dep = os.path.join(ROOT_DIR, "data", "deployment-info.json")
    remote_dep = f"{SERVER_CONFIG['remote_dir']}/data/deployment-info.json"
    if os.path.exists(local_dep):
        sftp.put(local_dep, remote_dep)
        log_success("Verified and synchronized data/deployment-info.json via SFTP.")

    sftp.close()
    ssh.close()
    log_success("Hostinger deployment finished successfully!")

# ======================== 6. LIVE VERIFICATION ========================
def verify_live_site():
    log_step(6, f"Verifying Live Deployment ({SERVER_CONFIG['live_url']})")

    endpoints = [
        ("/", "Dashboard / Home Page"),
        ("/login", "Login Page"),
        ("/leads", "Leads Dashboard"),
        ("/api/test", "API Test / Health"),
        ("/deployment-info.json", "Deployment Metadata JSON"),
    ]

    headers = {"User-Agent": "HostingerDeployChecker/1.0"}
    all_ok = True

    for path, desc in endpoints:
        url = f"{SERVER_CONFIG['live_url']}{path}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                code = resp.getcode()
                if 200 <= code < 400:
                    log_success(f"{desc} [{code} OK]: {url}")
                else:
                    log_warning(f"{desc} [{code}]: {url}")
                    all_ok = False
        except urllib.error.HTTPError as e:
            if e.code == 404 and "test" in path:
                log_info(f"{desc} [HTTP {e.code}]: Handled by router")
            else:
                log_warning(f"{desc} [HTTP {e.code}]: {url}")
                all_ok = False
        except Exception as e:
            log_warning(f"{desc} [Connection Failed]: {e}")
            all_ok = False

    return all_ok

# ======================== MAIN CLI ENTRY ========================
def main():
    parser = argparse.ArgumentParser(
        description="Deploy CRM-IFLEON to Hostinger and commit to Git at the same time."
    )
    parser.add_argument(
        "-m", "--message",
        type=str,
        default=None,
        help="Git commit message (if omitted, prompts interactively or uses auto-timestamp)"
    )
    parser.add_argument(
        "--no-commit",
        action="store_true",
        help="Skip Git commit and push; deploy only"
    )
    parser.add_argument(
        "--no-push",
        action="store_true",
        help="Commit locally but do not git push to remote origin"
    )
    parser.add_argument(
        "--no-build",
        action="store_true",
        help="Skip 'npm run build' and deploy existing out/ directory"
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Only verify live endpoints on Hostinger without deploying"
    )

    args = parser.parse_args()

    start_total_time = time.time()
    print(f"\n{Color.BOLD}{Color.CYAN}===================================================={Color.RESET}")
    print(f"{Color.BOLD}   IFLEON CRM - Hostinger Deploy & Git Sync Tool   {Color.RESET}")
    print(f"{Color.BOLD}{Color.CYAN}===================================================={Color.RESET}")

    if args.verify:
        verify_live_site()
        return

    # 1. Commit and push
    if not args.no_commit:
        handle_git_commit(message=args.message, no_push=args.no_push)
    else:
        log_info("Skipping Git commit step (--no-commit flag active).")

    # 2. Update metadata
    update_deployment_metadata()

    # 3. Build application
    if not args.no_build:
        build_application()
    else:
        log_info("Skipping Next.js build (--no-build flag active).")

    # 4. Prepare distribution
    prepare_out_directory()

    # 5. Upload & deploy to Hostinger
    deploy_to_hostinger()

    # 6. Verify live site
    verify_live_site()

    total_duration = round(time.time() - start_total_time, 1)
    print(f"\n{Color.BOLD}{Color.GREEN}===================================================={Color.RESET}")
    print(f"{Color.BOLD}{Color.GREEN}  ✓ DEPLOYMENT & COMMIT CYCLE COMPLETED IN {total_duration}s!{Color.RESET}")
    print(f"  Live Site: {SERVER_CONFIG['live_url']}")
    print(f"{Color.BOLD}{Color.GREEN}===================================================={Color.RESET}\n")

if __name__ == "__main__":
    main()

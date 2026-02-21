#!/bin/bash

# ============================================================================
# Verscienta Health - Backend Security Hardening
# ============================================================================
# Configures Drupal security settings: roles, permissions, password policy,
# audit logging, and trusted host patterns.
#
# Usage: ddev exec bash /var/www/html/scripts/setup-security.sh
# ============================================================================

echo "=============================================="
echo "Backend Security Hardening"
echo "=============================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ---- User Roles ----
echo ""
echo -e "${BLUE}=== Creating User Roles ===${NC}"

create_role() {
    local rid=$1
    local label=$2
    ROLE_EXISTS=$(drush php:eval "
        \$role = \Drupal\user\Entity\Role::load('$rid');
        echo \$role ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$ROLE_EXISTS" = "yes" ]; then
        echo "  Role '${rid}' already exists"
    else
        drush role:create "$rid" "$label" 2>/dev/null || echo "  Warning: Could not create role ${rid}"
        echo -e "${GREEN}  Created role: ${label}${NC}"
    fi
}

create_role "herbalist" "Herbalist"
create_role "tcm_practitioner" "TCM Practitioner"
create_role "peer_reviewer" "Peer Reviewer"
create_role "editor" "Editor"

# ---- Role Permissions ----
echo ""
echo -e "${BLUE}=== Configuring Permissions ===${NC}"

# Anonymous: view-only
drush role:perm:add anonymous "access content" 2>/dev/null
drush role:perm:add anonymous "view published media" 2>/dev/null
echo -e "${GREEN}  Anonymous: view only${NC}"

# Authenticated: reviews, favorites, profile
drush role:perm:add authenticated "access content" 2>/dev/null
drush role:perm:add authenticated "view published media" 2>/dev/null
drush role:perm:add authenticated "create review content" 2>/dev/null
echo -e "${GREEN}  Authenticated: view + reviews${NC}"

# Herbalist: create/edit herb content
drush role:perm:add herbalist "create herb content" 2>/dev/null
drush role:perm:add herbalist "edit own herb content" 2>/dev/null
drush role:perm:add herbalist "create formula content" 2>/dev/null
drush role:perm:add herbalist "edit own formula content" 2>/dev/null
echo -e "${GREEN}  Herbalist: herb/formula CRUD${NC}"

# TCM Practitioner: TCM-specific content
drush role:perm:add tcm_practitioner "create herb content" 2>/dev/null
drush role:perm:add tcm_practitioner "edit own herb content" 2>/dev/null
drush role:perm:add tcm_practitioner "create formula content" 2>/dev/null
drush role:perm:add tcm_practitioner "edit own formula content" 2>/dev/null
drush role:perm:add tcm_practitioner "create practitioner content" 2>/dev/null
drush role:perm:add tcm_practitioner "edit own practitioner content" 2>/dev/null
echo -e "${GREEN}  TCM Practitioner: herb/formula/practitioner CRUD${NC}"

# Peer Reviewer: review submissions
drush role:perm:add peer_reviewer "view any unpublished content" 2>/dev/null
drush role:perm:add peer_reviewer "edit any review content" 2>/dev/null
echo -e "${GREEN}  Peer Reviewer: review moderation${NC}"

# Editor: publish content
drush role:perm:add editor "administer nodes" 2>/dev/null
drush role:perm:add editor "administer content types" 2>/dev/null
drush role:perm:add editor "bypass node access" 2>/dev/null
drush role:perm:add editor "use editorial transition publish" 2>/dev/null
echo -e "${GREEN}  Editor: content publishing${NC}"

# ---- Password Policy ----
echo ""
echo -e "${BLUE}=== Configuring Password Policy ===${NC}"

drush php:eval "
    \$config = \Drupal::configFactory()->getEditable('user.settings');
    \$config->set('password_strength', TRUE);
    \$config->set('register', 'visitors');
    \$config->set('verify_mail', TRUE);
    \$config->set('cancel_method', 'user_cancel_reassign');
    \$config->save();
    echo 'Password policy configured: strength=on, verify_mail=on';
" 2>/dev/null || echo "  Warning: Could not configure password policy"
echo -e "${GREEN}  Password policy configured${NC}"

# ---- Flood Control (brute-force protection) ----
echo ""
echo -e "${BLUE}=== Configuring Flood Control ===${NC}"

drush php:eval "
    \$config = \Drupal::configFactory()->getEditable('user.flood');
    \$config->set('uid_only', FALSE);
    \$config->set('ip_limit', 50);
    \$config->set('ip_window', 3600);
    \$config->set('user_limit', 5);
    \$config->set('user_window', 21600);
    \$config->save();
    echo 'Flood control: 50 attempts/IP/hour, 5 attempts/user/6hours';
" 2>/dev/null || echo "  Warning: Could not configure flood control"
echo -e "${GREEN}  Flood control configured${NC}"

# ---- Error Reporting ----
echo ""
echo -e "${BLUE}=== Configuring Error Reporting ===${NC}"

drush php:eval "
    \$config = \Drupal::configFactory()->getEditable('system.logging');
    \$config->set('error_level', 'hide');
    \$config->save();
    echo 'Error reporting: hide errors from end users';
" 2>/dev/null || echo "  Warning: Could not configure error reporting"
echo -e "${GREEN}  Error messages hidden from users${NC}"

# ---- File System Security ----
echo ""
echo -e "${BLUE}=== File System Security ===${NC}"

# Ensure private files directory exists
mkdir -p /var/www/private
chown www-data:www-data /var/www/private 2>/dev/null
chmod 750 /var/www/private 2>/dev/null
echo -e "${GREEN}  Private files directory secured${NC}"

# Protect settings files
chmod 444 /var/www/html/web/sites/default/settings.php 2>/dev/null
chmod 444 /var/www/html/web/sites/default/settings.local.php 2>/dev/null
echo -e "${GREEN}  Settings files set to read-only${NC}"

# ---- Database Backup Strategy ----
echo ""
echo -e "${BLUE}=== Database Backup Setup ===${NC}"

mkdir -p /var/www/backups
cat > /var/www/html/scripts/backup-database.sh << 'BACKUP_EOF'
#!/bin/bash
# Daily database backup script
# Add to crontab: 0 2 * * * /var/www/html/scripts/backup-database.sh

BACKUP_DIR="/var/www/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/verscienta_${DATE}.sql.gz"

cd /var/www/html
drush sql:dump --gzip --result-file="${BACKUP_DIR}/verscienta_${DATE}.sql"

# Keep only last 30 days of backups
find "${BACKUP_DIR}" -name "verscienta_*.sql.gz" -mtime +30 -delete 2>/dev/null
find "${BACKUP_DIR}" -name "verscienta_*.sql" -mtime +30 -delete 2>/dev/null

echo "Backup created: ${BACKUP_FILE}"
BACKUP_EOF

chmod +x /var/www/html/scripts/backup-database.sh 2>/dev/null
echo -e "${GREEN}  Backup script created at scripts/backup-database.sh${NC}"

# ---- Enable Audit/Logging ----
echo ""
echo -e "${BLUE}=== Configuring Logging ===${NC}"

drush php:eval "
    \$config = \Drupal::configFactory()->getEditable('dblog.settings');
    \$config->set('row_limit', 10000);
    \$config->save();
    echo 'Database logging: 10000 row limit';
" 2>/dev/null || echo "  Warning: Could not configure dblog"

# Enable syslog if available
drush pm:install syslog -y 2>/dev/null || echo "  Syslog module not available"
echo -e "${GREEN}  Logging configured${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}Backend security hardening complete!${NC}"
echo ""
echo "Configured:"
echo "  - User roles: herbalist, tcm_practitioner, peer_reviewer, editor"
echo "  - Role-based permissions for all content types"
echo "  - Password strength enforcement + email verification"
echo "  - Flood control (brute-force protection)"
echo "  - Error messages hidden from end users"
echo "  - Private files directory secured"
echo "  - Settings files set to read-only"
echo "  - Database backup script created"
echo "  - Database logging configured"
echo "=============================================="

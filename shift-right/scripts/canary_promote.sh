#!/usr/bin/env bash
# ==============================================================================
# Script d'Activation / Rétablissement du Split Canary (90% Stable / 10% Canary)
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  ACTIVATION DU ROUTAGE CANARY (90% STABLE / 10% CANARY)            ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_DIR="${SCRIPT_DIR}/../nginx"

# Configuration 90/10 standard
cat << 'EOF' > "${NGINX_DIR}/nginx.conf"
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile        on;

    upstream backend_stable {
        server app-stable:5000 max_fails=3 fail_timeout=5s;
    }

    upstream backend_canary {
        server app-canary:5000 max_fails=3 fail_timeout=5s;
    }

    split_clients "${remote_addr}${http_user_agent}${msec}" $split_target {
        90%     backend_stable;
        *       backend_canary;
    }

    map $http_x_canary $upstream_choice {
        "always"    backend_canary;
        "never"     backend_stable;
        default     $split_target;
    }

    server {
        listen 80;
        server_name _;

        location /canary-status {
            default_type application/json;
            return 200 '{"service": "nginx-canary-router", "strategy": "split_clients", "ratio": "90% Stable / 10% Canary", "headerOverride": "X-Canary: always", "status": "ACTIVE"}\n';
        }

        location / {
            proxy_pass http://$upstream_choice;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header X-Served-By-Upstream $upstream_addr always;
            add_header X-Canary-Pool $upstream_choice always;
            add_header X-Shift-Right-Router "Nginx-Canary-v1" always;
        }
    }
}
EOF

echo -e "1. Configuration 90/10 déployée dans ${NGINX_DIR}/nginx.conf."
echo -e "2. Rechargement à chaud de Nginx..."

if docker ps --format '{{.Names}}' | grep -q "campus-canary-router"; then
  docker exec campus-canary-router nginx -s reload
  echo -e "${GREEN}${BOLD}✓ SUCCÈS : Nginx rechargé. Le trafic Canary est réactivé à 10%.${NC}"
else
  echo -e "${CYAN}Note : Le conteneur Docker campus-canary-router n'est pas actif localement.${NC}"
fi

echo -e "3. Vérification du statut :"
curl -s http://localhost/canary-status || true
echo ""

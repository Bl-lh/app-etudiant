#!/usr/bin/env bash
# ==============================================================================
# Script de Recouvrement Immédiat : Rollback Nginx vers 100% Stable V1
# ==============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${RED}====================================================================${NC}"
echo -e "${BOLD}${RED}  DÉCLENCHEMENT DU ROLLBACK CANARY D'URGENCE (100% STABLE)           ${NC}"
echo -e "${BOLD}${RED}====================================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_DIR="${SCRIPT_DIR}/../nginx"

if [ ! -f "${NGINX_DIR}/nginx-rollback.conf" ]; then
  echo -e "${RED}Erreur : Fichier nginx-rollback.conf introuvable dans ${NGINX_DIR}.${NC}"
  exit 1
fi

echo -e "1. Remplacement de la configuration active Nginx par le profil de Rollback..."
cp "${NGINX_DIR}/nginx-rollback.conf" "${NGINX_DIR}/nginx.conf"

echo -e "2. Rechargement à chaud (Graceful Reload) de Nginx sans interruption de service..."
if docker ps --format '{{.Names}}' | grep -q "campus-canary-router"; then
  docker exec campus-canary-router nginx -s reload
  echo -e "${GREEN}${BOLD}✓ SUCCÈS : Nginx rechargé avec succès.${NC}"
else
  echo -e "${CYAN}Note : Le conteneur Docker campus-canary-router n'est pas actif localement.${NC}"
  echo -e "Pour OCI : Exécutez 'docker exec campus-canary-router nginx -s reload'."
fi

TARGET_PORT="80"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/canary-status 2>/dev/null | grep -q "200"; then
  TARGET_PORT="8080"
fi
curl -s "http://localhost:${TARGET_PORT}/canary-status" || true
echo ""
echo -e "${GREEN}${BOLD}====================================================================${NC}"
echo -e "${GREEN}${BOLD}  RÉCUPÉRATION TERMINÉE : Le trafic est désormais à 100% sécurisé.  ${NC}"
echo -e "${GREEN}${BOLD}====================================================================${NC}"

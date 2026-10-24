#!/usr/bin/env bash
# ==============================================================================
# Script de Simulation de Trafic & Mesure de Résilience Shift-Right
# Teste la répartition Canary et l'impact des Feature Flags Unleash
# ==============================================================================

TARGET_URL="${1}"
if [ -z "$TARGET_URL" ]; then
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/canary-status 2>/dev/null | grep -q "200"; then
    TARGET_URL="http://localhost:8080/api/shift-right/transaction"
  else
    TARGET_URL="http://localhost/api/shift-right/transaction"
  fi
fi
COUNT="${2:-30}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  SHIFT-RIGHT TESTING : SIMULATEUR DE TRAFIC CANARY & UNLEASH       ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "Cible URL         : ${BLUE}${TARGET_URL}${NC}"
echo -e "Nombre d'appels   : ${BOLD}${COUNT}${NC}"
echo -e "Date d'exécution  : $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "--------------------------------------------------------------------"

TOTAL_SUCCESS=0
TOTAL_FAILURES=0
STABLE_COUNT=0
CANARY_COUNT=0

for i in $(seq 1 "$COUNT"); do
  # Exécution de la requête HTTP
  START_TIME=$(date +%s%N)
  RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" -X POST "$TARGET_URL" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"student-$i\", \"amount\": 150.0}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
  TOTAL_TIME=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | sed '$d' | sed '$d')

  # Extraction de la version et du conteneur ayant répondu
  RELEASE_TYPE=$(echo "$BODY" | grep -o '"releaseType":"[^"]*"' | head -n 1 | cut -d'"' -f4 | tr -d '\r\n ')
  VERSION=$(echo "$BODY" | grep -o '"version":"[^"]*"' | head -n 1 | cut -d'"' -f4 | tr -d '\r\n ')
  [ -z "$RELEASE_TYPE" ] && RELEASE_TYPE="UNKNOWN"
  [ -z "$VERSION" ] && VERSION="unknown"

  LATENCY_MS=$(awk -v t="$TOTAL_TIME" 'BEGIN { printf "%.0f", t * 1000 }')

  # Décompte des upstreams
  if [ "$RELEASE_TYPE" = "CANARY" ]; then
    ((CANARY_COUNT++))
    UPSTREAM_TAG="${YELLOW}[CANARY  v2]${NC}"
  else
    ((STABLE_COUNT++))
    UPSTREAM_TAG="${BLUE}[STABLE  v1]${NC}"
  fi

  # Évaluation du statut HTTP
  if [ "$HTTP_CODE" = "200" ]; then
    ((TOTAL_SUCCESS++))
    echo -e "Req #$(printf "%02d" "$i") | ${GREEN}200 OK ${NC} | ${UPSTREAM_TAG} (${VERSION}) | ${LATENCY_MS}ms | Transaction validée"
  else
    ((TOTAL_FAILURES++))
    ERROR_MSG=$(echo "$BODY" | grep -o '"errorCode":"[^"]*"' | cut -d'"' -f4)
    [ -z "$ERROR_MSG" ] && ERROR_MSG="HTTP_$HTTP_CODE"
    echo -e "Req #$(printf "%02d" "$i") | ${RED}${HTTP_CODE} ERR${NC} | ${UPSTREAM_TAG} (${VERSION}) | ${LATENCY_MS}ms | ${RED}${ERROR_MSG}${NC}"
  fi

  # Petite pause pour simuler un trafic utilisateur réaliste (100ms)
  sleep 0.1
done

# Calcul des statistiques
STABLE_PCT=$(awk -v s="$STABLE_COUNT" -v t="$COUNT" 'BEGIN { printf "%.1f", (s/t)*100 }')
CANARY_PCT=$(awk -v c="$CANARY_COUNT" -v t="$COUNT" 'BEGIN { printf "%.1f", (c/t)*100 }')
FAILURE_RATE=$(awk -v f="$TOTAL_FAILURES" -v t="$COUNT" 'BEGIN { printf "%.1f", (f/t)*100 }')

echo -e "--------------------------------------------------------------------"
echo -e "${BOLD}${CYAN}BILAN STATISTIQUE DU TRAFIC SHIFT-RIGHT :${NC}"
echo -e "  • Total Requêtes     : ${BOLD}${COUNT}${NC}"
echo -e "  • Requêtes V1 Stable : ${BLUE}${STABLE_COUNT} (${STABLE_PCT}%)${NC}"
echo -e "  • Requêtes V2 Canary : ${YELLOW}${CANARY_COUNT} (${CANARY_PCT}%)${NC}"
echo -e "  • Succès (HTTP 200)  : ${GREEN}${TOTAL_SUCCESS}${NC}"
echo -e "  • Échecs (HTTP 5xx)  : ${RED}${TOTAL_FAILURES}${NC}"
echo -e "  • ${BOLD}Taux d'Échec Global: "

if [ "$TOTAL_FAILURES" -gt 0 ]; then
  echo -e "    ${RED}${BOLD}⚠️  ALERTE PANNE DÉTECTÉE : Taux d'erreur de ${FAILURE_RATE}% !${NC}"
  echo -e "    ${YELLOW}Action requise : Déclencher le Kill Switch Unleash ou Rollback Nginx.${NC}"
else
  echo -e "    ${GREEN}${BOLD}✓ SYSTÈME SAIN : 0.0% d'erreur. Toutes les transactions ont réussi.${NC}"
fi
echo -e "${BOLD}${CYAN}====================================================================${NC}"

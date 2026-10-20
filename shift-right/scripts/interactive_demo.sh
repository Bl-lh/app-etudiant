#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DÉMONSTRATION INTERACTIVE EN DIRECT POUR LA SOUTENANCE
# Permet de dérouler toute la démo Shift-Right pas-à-pas devant le professeur
# ==============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

clear

pause_step() {
    echo -e "\n${YELLOW}--------------------------------------------------------------------${NC}"
    echo -e "${BOLD}${MAGENTA}👉 [ACTION SOUTENANCE] : $1${NC}"
    echo -e "${YELLOW}--------------------------------------------------------------------${NC}"
    read -p "Appuyez sur [ENTRÉE] pour exécuter cette étape..." dummy
    echo ""
}

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  DÉMONSTRATION EN DIRECT : SHIFT-RIGHT TESTING & PROGRESSIVE DELIVERY ${NC}"
echo -e "${BOLD}${CYAN}  Projet : CampusEnroll • Module Tests Logiciels & DevOps           ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}"

# Détection de l'URL cible (port 80 ou 8080)
TARGET_PORT="80"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/canary-status 2>/dev/null | grep -q "200"; then
    TARGET_PORT="8080"
fi
BASE_URL="http://localhost:${TARGET_PORT}"

# ------------------------------------------------------------------------------
# ÉTAPE 1 : ÉTAT DE SANTÉ DES CONTENEURS & ARCHITECTURE
# ------------------------------------------------------------------------------
pause_step "Étape 1/5 : Présentez l'architecture et vérifiez la santé des 6 conteneurs."

echo -e "${BOLD}${BLUE}1. Vérification de l'état des conteneurs Docker :${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${BOLD}${BLUE}2. Diagnostic du Routeur Nginx Canary :${NC}"
curl -s "${BASE_URL}/canary-status"
echo ""

# ------------------------------------------------------------------------------
# ÉTAPE 2 : TRAFIC NOMINAL CANARY 90/10
# ------------------------------------------------------------------------------
pause_step "Étape 2/5 : Lancez le trafic nominal (Canary 90% Stable / 10% Canary)."

echo -e "${BOLD}${BLUE}Exécution de 20 requêtes simulées...${NC}"
bash "$(dirname "$0")/simulate_traffic.sh" "${BASE_URL}/api/shift-right/transaction" 20

# ------------------------------------------------------------------------------
# ÉTAPE 3 : INJECTION DE LA PANNE VIA UNLEASH
# ------------------------------------------------------------------------------
pause_step "Étape 3/5 : Simulez la panne critique (Feature Flag 'chaos_faulty_payment' ON)."

echo -e "${BOLD}${RED}Activation du Feature Flag de panne dans Unleash...${NC}"
bash "$(dirname "$0")/unleash_toggle_flag.sh" on
sleep 2

echo -e "\n${BOLD}${RED}Simulation du trafic en situation d'incident :${NC}"
bash "$(dirname "$0")/simulate_traffic.sh" "${BASE_URL}/api/shift-right/transaction" 20 || true

# ------------------------------------------------------------------------------
# ÉTAPE 4 : RECOUVREMENT N°1 (KILL SWITCH UNLEASH)
# ------------------------------------------------------------------------------
pause_step "Étape 4/5 : Déclenchez le Kill Switch Unleash pour rétablir le service en < 2s."

echo -e "${BOLD}${GREEN}Déclenchement d'urgence du Kill Switch (Feature Flag OFF)...${NC}"
bash "$(dirname "$0")/unleash_toggle_flag.sh" off
sleep 2

echo -e "\n${BOLD}${GREEN}Vérification du rétablissement immédiat :${NC}"
bash "$(dirname "$0")/simulate_traffic.sh" "${BASE_URL}/api/shift-right/transaction" 20

# ------------------------------------------------------------------------------
# ÉTAPE 5 : RECOUVREMENT N°2 (CANARY ROLLBACK NGINX)
# ------------------------------------------------------------------------------
pause_step "Étape 5/5 : Déclenchez le Rollback Nginx (Isoler l'instance Canary à 100%)."

echo -e "${BOLD}${YELLOW}Reconfiguration Nginx vers 100% Stable (Reload à chaud)...${NC}"
bash "$(dirname "$0")/canary_rollback.sh"

echo -e "\n${BOLD}${YELLOW}Vérification du trafic après Rollback :${NC}"
bash "$(dirname "$0")/simulate_traffic.sh" "${BASE_URL}/api/shift-right/transaction" 20

# Rétablissement final
echo -e "\n${BOLD}${CYAN}Réactivation automatique du Canary 90/10 pour les prochains tests...${NC}"
bash "$(dirname "$0")/canary_promote.sh" > /dev/null 2>&1

echo -e "\n${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}  ✓ DÉMONSTRATION COMPLÈTE TERMINÉE AVEC SUCCÈS DEVANT LE JURY !     ${NC}"
echo -e "${BOLD}${GREEN}====================================================================${NC}\n"

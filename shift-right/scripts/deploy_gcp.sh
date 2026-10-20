#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DÉPLOIEMENT SHIFT-RIGHT SUR GOOGLE CLOUD (GCP)
# Compatible : Google Cloud Shell (0 Carte Bancaire) & Google Compute Engine VM
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  DÉPLOIEMENT DE L'APPLICATION CAMPUSENROLL SUR GOOGLE CLOUD        ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}"

# 1. Vérification / Installation de Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installation de Docker sur Google Cloud VM...${NC}"
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg git docker.io docker-compose-v2
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER || true
else
    echo -e "${GREEN}✓ Docker est déjà disponible.${NC}"
fi

# 2. Cloner ou mettre à jour le dépôt
APP_DIR="${HOME}/app-etudiant"
if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Mise à jour du dépôt existant dans $APP_DIR...${NC}"
    cd "$APP_DIR"
    git pull origin main || true
else
    echo -e "${YELLOW}Clonage du dépôt depuis GitHub...${NC}"
    git clone https://github.com/Bl-lh/app-etudiant.git "$APP_DIR"
    cd "$APP_DIR"
fi

# 3. Démarrage des conteneurs
echo -e "\n${YELLOW}Lancement de la pile Shift-Right (Docker Compose)...${NC}"
docker compose -f shift-right/docker-compose.yml up -d

echo -e "\n${YELLOW}Attente de l'initialisation des conteneurs (15s)...${NC}"
sleep 15

# 4. Détection de l'IP publique GCP
EXTERNAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || true)
[ -z "$EXTERNAL_IP" ] && EXTERNAL_IP=$(curl -s https://checkip.amazonaws.com 2>/dev/null || echo "127.0.0.1")

echo -e "\n${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}  ✓ DÉPLOIEMENT TERMINÉ SUR GOOGLE CLOUD !                         ${NC}"
echo -e "${BOLD}${GREEN}====================================================================${NC}"
if [ "$EXTERNAL_IP" != "127.0.0.1" ]; then
    echo -e "Application Web (Professeur) : ${BOLD}${CYAN}http://${EXTERNAL_IP}/${NC}"
    echo -e "Console Unleash              : ${BOLD}${CYAN}http://${EXTERNAL_IP}:4242/${NC}"
    echo -e "Diagnostic Canary            : ${BOLD}${CYAN}http://${EXTERNAL_IP}/canary-status${NC}"
else
    echo -e "${YELLOW}Mode Google Cloud Shell détecté !${NC}"
    echo -e "Utilisez le bouton 'Aperçu Web' (Web Preview) en haut à droite du Cloud Shell :"
    echo -e "  • Cliquez sur 'Aperçu Web' > 'Modifier le port' > tapez 80"
fi
echo -e "--------------------------------------------------------------------"
echo -e "Commandes de démonstration :"
echo -e "  • Trafic nominal  : bash shift-right/scripts/simulate_traffic.sh http://localhost/api/shift-right/transaction 20"
echo -e "  • Activer panne   : bash shift-right/scripts/unleash_toggle_flag.sh on"
echo -e "  • Kill Switch     : bash shift-right/scripts/unleash_toggle_flag.sh off"
echo -e "  • Rollback Nginx  : bash shift-right/scripts/canary_rollback.sh"
echo -e "${BOLD}${GREEN}====================================================================${NC}\n"

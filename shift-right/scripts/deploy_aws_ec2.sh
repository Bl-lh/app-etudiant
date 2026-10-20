#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DÉPLOIEMENT AUTOMATIQUE SHIFT-RIGHT SUR AWS EC2 (FREE TIER)
# Compatible : Ubuntu 22.04 / 24.04 LTS & Amazon Linux 2023 (t2.micro / t3.micro)
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  DÉPLOIEMENT DE L'APPLICATION CAMPUSENROLL SUR AWS EC2             ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}"

# 1. Détection de l'OS et installation de Docker & Docker Compose
echo -e "\n${YELLOW}[1/5] Installation et configuration de Docker...${NC}"
if command -v apt-get &> /dev/null; then
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg git
    sudo install -m 0755 -d /etc/apt/keyrings
    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
elif command -v dnf &> /dev/null; then
    sudo dnf update -y
    sudo dnf install -y docker git
    sudo systemctl enable --now docker
    # Installation du plugin docker compose
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

sudo systemctl enable --now docker
sudo usermod -aG docker $USER || true

# 2. Récupération du code source
echo -e "\n${YELLOW}[2/5] Clonage du dépôt GitHub...${NC}"
APP_DIR="/opt/app-etudiant"
if [ -d "$APP_DIR" ]; then
    echo "Mise à jour du dépôt existant..."
    cd "$APP_DIR"
    git pull origin main
else
    sudo git clone https://github.com/Bl-lh/app-etudiant.git "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    cd "$APP_DIR"
fi

# 3. Lancement de la pile Docker Compose Shift-Right
echo -e "\n${YELLOW}[3/5] Démarrage des 6 conteneurs Shift-Right (Nginx, V1, V2, Unleash, DBs)...${NC}"
docker compose -f shift-right/docker-compose.yml up -d

echo -e "\n${YELLOW}[4/5] Attente de la stabilisation des services (15s)...${NC}"
sleep 15

# 4. Détection de l'IP publique AWS
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)
if [ -n "$TOKEN" ]; then
    PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)
fi
[ -z "$PUBLIC_IP" ] && PUBLIC_IP=$(curl -s https://checkip.amazonaws.com 2>/dev/null || echo "IP_DE_VOTRE_EC2")

echo -e "\n${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}  ✓ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS SUR AWS !                      ${NC}"
echo -e "${BOLD}${GREEN}====================================================================${NC}"
echo -e "Application Web (Professeur) : ${BOLD}${CYAN}http://${PUBLIC_IP}/${NC}"
echo -e "Console Unleash              : ${BOLD}${CYAN}http://${PUBLIC_IP}:4242/${NC}"
echo -e "Statut Canary Nginx          : ${BOLD}${CYAN}http://${PUBLIC_IP}/canary-status${NC}"
echo -e "--------------------------------------------------------------------"
echo -e "Pour lancer les tests de résilience en direct sur AWS :"
echo -e "  • Trafic nominal  : bash shift-right/scripts/simulate_traffic.sh http://localhost/api/shift-right/transaction 20"
echo -e "  • Activer panne   : bash shift-right/scripts/unleash_toggle_flag.sh on"
echo -e "  • Kill Switch     : bash shift-right/scripts/unleash_toggle_flag.sh off"
echo -e "  • Rollback Nginx  : bash shift-right/scripts/canary_rollback.sh"
echo -e "${BOLD}${GREEN}====================================================================${NC}\n"

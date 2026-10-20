#!/usr/bin/env bash
# ==============================================================================
# Script d'Installation & Déploiement Argo Rollouts sur GitHub Codespaces (0€ / 0 Carte)
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  DÉPLOIEMENT ARGO ROLLOUTS SUR GITHUB CODESPACES (K3D / K8S)       ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}"

# 1. Vérification / Installation de k3d (Kubernetes in Docker)
if ! command -v k3d &> /dev/null; then
  echo -e "${YELLOW}1. Installation de k3d (Cluster Kubernetes ultra-léger pour Codespaces)...${NC}"
  curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
else
  echo -e "${GREEN}✓ k3d est déjà installé.${NC}"
fi

# 2. Création du cluster k3d
if ! k3d cluster list | grep -q "campus-k8s"; then
  echo -e "${YELLOW}2. Création du cluster Kubernetes 'campus-k8s' (Ports 80 et 4242 mappés)...${NC}"
  k3d cluster create campus-k8s --port "80:80@loadbalancer" --port "4242:4242@loadbalancer"
else
  echo -e "${GREEN}✓ Cluster k3d 'campus-k8s' opérationnel.${NC}"
fi

# 3. Installation du contrôleur Argo Rollouts
echo -e "${YELLOW}3. Installation d'Argo Rollouts (CRD & Controller)...${NC}"
kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# 4. Installation du plugin CLI kubectl-argo-rollouts
if ! command -v kubectl-argo-rollouts &> /dev/null; then
  echo -e "${YELLOW}4. Téléchargement du CLI Argo Rollouts...${NC}"
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/')
  curl -LO "https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-${OS}-${ARCH}"
  chmod +x "kubectl-argo-rollouts-${OS}-${ARCH}"
  sudo mv "kubectl-argo-rollouts-${OS}-${ARCH}" /usr/local/bin/kubectl-argo-rollouts
fi

# 5. Build des images applicatives dans k3d
echo -e "${YELLOW}5. Construction des images Docker v1.0.0 et v2.0.0 (Candidate)...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/../.."

docker build -t campus-backend:v1.0.0 -f "${ROOT_DIR}/backend/Dockerfile" "${ROOT_DIR}/backend"
docker build -t campus-backend:v2.0.0 -f "${ROOT_DIR}/backend/Dockerfile" "${ROOT_DIR}/backend"

k3d image import campus-backend:v1.0.0 -c campus-k8s
k3d image import campus-backend:v2.0.0 -c campus-k8s

# 6. Déploiement des Manifests K8s
echo -e "${YELLOW}6. Déploiement des Services et du Rollout Argo...${NC}"
kubectl apply -f "${SCRIPT_DIR}/../k8s-argo-rollouts/services.yaml"
kubectl apply -f "${SCRIPT_DIR}/../k8s-argo-rollouts/rollout.yaml"

echo -e "${GREEN}${BOLD}====================================================================${NC}"
echo -e "${GREEN}${BOLD}  DÉPLOIEMENT ARGO ROLLOUTS TERMINÉ AVEC SUCCÈS !                   ${NC}"
echo -e "${GREEN}${BOLD}====================================================================${NC}"
echo -e "Pour visualiser le Rollout en direct :"
echo -e "  ${CYAN}kubectl argo rollouts get rollout campus-enroll-rollout --watch${NC}"
echo -e ""
echo -e "Pour déclencher la mise à jour progressive Canary vers la V2.0.0 :"
echo -e "  ${YELLOW}kubectl argo rollouts set image campus-enroll-rollout campus-backend=campus-backend:v2.0.0${NC}"
echo -e ""
echo -e "Pour déclencher le ROLLBACK d'urgence en cas de panne détectée :"
echo -e "  ${RED}${BOLD}kubectl argo rollouts abort campus-enroll-rollout${NC}"
echo -e "  ${RED}kubectl argo rollouts undo campus-enroll-rollout${NC}"
echo -e "===================================================================="

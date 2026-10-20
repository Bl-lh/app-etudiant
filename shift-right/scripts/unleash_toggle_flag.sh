#!/usr/bin/env bash
# ==============================================================================
# Script de Commande Unleash : Activation de Panne (ON) ou Kill Switch (OFF)
# Permet de basculer instantanément le Feature Flag sans passer par l'UI
# ==============================================================================

ACTION="${1:-status}"
FEATURE_NAME="${2:-chaos_faulty_payment}"
UNLEASH_HOST="${3:-http://localhost:4242}"
API_TOKEN="${4:-*:*.campus-admin-token-secret-2026}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  UNLEASH FEATURE FLAG MANAGER : [${FEATURE_NAME}]                  ${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}"

case "$ACTION" in
  on|enable|ON|true)
    echo -e "${YELLOW}>>> Action : ACTIVATION DE LA PANNE (Simulation Failure) <<<${NC}"
    echo -e "Envoi de la requête d'activation à Unleash (${UNLEASH_HOST})..."
    
    # 1. Tentative via l'API Admin Unleash
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      "${UNLEASH_HOST}/api/admin/projects/default/features/${FEATURE_NAME}/environments/production/on" \
      -H "Authorization: ${API_TOKEN}" \
      -H "Content-Type: application/json")

    # 2. Si le flag n'existe pas encore dans Unleash, on le crée automatiquement
    if [ "$HTTP_CODE" = "404" ]; then
      echo -e "${YELLOW}Flag non trouvé, création automatique dans le projet 'default'...${NC}"
      curl -s -X POST "${UNLEASH_HOST}/api/admin/projects/default/features" \
        -H "Authorization: ${API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"${FEATURE_NAME}\", \"type\": \"kill-switch\", \"description\": \"Chaos testing flag injectant une panne 500 sur le paiement\"}" > /dev/null
      
      # Réactivation
      curl -s -X POST \
        "${UNLEASH_HOST}/api/admin/projects/default/features/${FEATURE_NAME}/environments/production/on" \
        -H "Authorization: ${API_TOKEN}" > /dev/null
    fi

    echo -e "${RED}${BOLD}✓ PANNE ACTIVÉE ! Le feature flag '${FEATURE_NAME}' est désormais ON.${NC}"
    echo -e "${YELLOW}Les requêtes vers la passerelle de paiement vont maintenant échouer (HTTP 500).${NC}"
    ;;

  off|disable|OFF|false|kill|killswitch)
    echo -e "${GREEN}>>> Action : DÉCLENCHEMENT DU KILL SWITCH (Rétablissement) <<<${NC}"
    echo -e "Envoi de la coupure d'urgence à Unleash (${UNLEASH_HOST})..."

    curl -s -X POST \
      "${UNLEASH_HOST}/api/admin/projects/default/features/${FEATURE_NAME}/environments/production/off" \
      -H "Authorization: ${API_TOKEN}" \
      -H "Content-Type: application/json" > /dev/null

    echo -e "${GREEN}${BOLD}✓ RECOUVREMENT RÉUSSI ! Le Kill Switch a désactivé '${FEATURE_NAME}'.${NC}"
    echo -e "${GREEN}Le trafic est instantanément restauré en mode nominal (HTTP 200) sans redémarrage.${NC}"
    ;;

  status|check)
    echo -e "${CYAN}Consultation de l'état actuel auprès de l'API applicative...${NC}"
    curl -s http://localhost:8080/api/shift-right/status | grep -o '"flags":{[^}]*}' || \
      curl -s http://localhost/api/shift-right/status | grep -o '"flags":{[^}]*}' || \
      curl -s http://localhost:5000/api/shift-right/status | grep -o '"flags":{[^}]*}' || \
      echo -e "${YELLOW}Application non joignable sur les ports standards (80, 8080 ou 5000).${NC}"
    ;;

  *)
    echo -e "Usage : $0 {on|off|status} [nom_du_flag] [url_unleash]"
    echo -e "Exemples :"
    echo -e "  $0 on        -> Active la panne 500 sur le Feature Flag"
    echo -e "  $0 off       -> Coupe la panne immédiatement (Kill Switch)"
    echo -e "  $0 status    -> Vérifie l'état courant"
    exit 1
    ;;
esac

echo -e "${BOLD}${CYAN}====================================================================${NC}"

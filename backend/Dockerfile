FROM node:20-alpine

WORKDIR /app

# Optimisation du cache des dépendances
COPY package*.json ./
RUN npm ci --omit=dev

# Copie du code source
COPY . .

# Configuration des variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000
ENV ENABLE_UNLEASH=true

EXPOSE 5000

# Vérification de santé du conteneur
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]

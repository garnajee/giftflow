# Étape 1: Utiliser une image de base Node.js légère et récente
FROM node:18-alpine

# Étape 2: Définir le répertoire de travail à l'intérieur du conteneur
WORKDIR /usr/src/app

# Étape 3: Copier les fichiers de dépendances.
# On les copie en premier pour profiter du cache de Docker. Si ces fichiers ne changent pas,
# Docker n'exécutera pas l'étape `npm install` à chaque build.
COPY package*.json ./

# Étape 4: Installer les dépendances de l'application (express)
RUN npm install

# Étape 5: Copier le reste du code de l'application (server.js)
COPY . .

# Étape 6: Exposer le port sur lequel notre serveur API écoute
EXPOSE 3000

# Étape 7: Définir la commande pour démarrer l'application
CMD [ "node", "server.js" ]

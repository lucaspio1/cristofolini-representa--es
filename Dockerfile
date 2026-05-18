# Usa a imagem oficial do Node.js
FROM node:22-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm install

# Copia o resto do projeto
COPY . .

# Compila o frontend (Vite) e o backend (TypeScript)
RUN npm run build

# Expõe a porta que o servidor Node vai usar
EXPOSE 3000

# Comando para iniciar o servidor em modo de produção
CMD ["npm", "run", "dev"]
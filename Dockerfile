FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# As variaveis VITE_* sao embutidas no bundle durante o build, nao lidas em runtime:
# a URL da API precisa chegar ate aqui. No Railway, basta declarar VITE_API_BASE_URL
# nas variaveis do servico - builds por Dockerfile as recebem como build args.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
# O Railway injeta PORT. O entrypoint oficial do nginx roda envsubst nos arquivos de
# /etc/nginx/templates, entao ${PORT} e resolvido na subida do container.
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

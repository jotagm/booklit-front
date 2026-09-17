FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Sem VITE_API_BASE_URL o bundle usa o fallback "/api" (ver src/api/client.ts), que e
# exatamente o caminho que o nginx repassa para o backend. Este ARG so existe como
# escape: definir a URL publica da API aqui faz o navegador falar direto com o backend,
# pulando o proxy - e ai o CORS_ALLOWED_ORIGINS do backend passa a ser obrigatorio.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
# O Railway injeta PORT. O entrypoint oficial do nginx roda envsubst nos arquivos de
# /etc/nginx/templates, entao ${PORT} e ${API_URL} sao resolvidos na subida do container.
ENV PORT=8080
# Precisa ser sobrescrito no Railway com a URL publica do booklit-server. O default so
# existe para o container subir com uma config valida (e falhar com 502, nao com erro
# de sintaxe do nginx) caso a variavel seja esquecida.
ENV API_URL=http://localhost:8080

# O entrypoint do nginx so roda (e faz source de) arquivos executaveis; o chmod garante
# isso mesmo quando o COPY vem de um host sem bit de execucao, como o Windows.
COPY docker-entrypoint.d/15-normalize-api-url.envsh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/15-normalize-api-url.envsh

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

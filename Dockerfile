FROM node:buster-slim
RUN apt update && apt -y install cron python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app
COPY ./package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

RUN echo '0 0 * * * bash -c "cd /usr/src/app && npm run fetch"' > /etc/cron.d/tx3 && \
    crontab /etc/cron.d/tx3

CMD ["bash", "-c", "npm run fetch && cron -f"]

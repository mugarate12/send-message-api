## Send Message API
- [Overview](#overview)
- [Requerimentos](#requerimentos)
- [Instalação](#instalação)
- [Executar servidor](#executar-servidor)

## Overview

RESTful API criada em NodeJS para envio de mensagens usando Zapi

## Requerimentos

A instalação das ferramentas para Debian está descrita abaixo na sessão **[Instalação](#instalação)**

- **[Node.js e NPM](https://www.nodejs.org/)** (suportadas versões: 10.x.x)
- **[Git](https://git-scm.com/)**
- **[PM2](https://pm2.io/docs/plus/overview/)**

## Instalação

### Git
```bash
apt-get install git-all
```

### NodeJS and NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_17.x | bash -
```
```bash
apt-get install -y nodejs npm
```

### Instalação PM2

#### Primeira forma: Curl Method
```bash
apt update && apt install sudo curl && curl -sL https://raw.githubusercontent.com/Unitech/pm2/master/packager/setup.deb.sh | sudo -E bash -
```

#### Segunda forma: yarn or npm
```bash
npm install pm2 -g
```

#### Instalação auto complete of PM2
```bash
pm2 completion install
```

#### Atualizar PM2
```bash
npm install pm2 -g && pm2 update
```

### Configuração para acesso do Bando de dados

### Env variáveis
1. crie um arquivo `.env` como o arquivo `.env.example`
2. mude essas configurações de acordo com os dados do seu banco de dados

### Instalar todas as dependências/módulos
```bash
$ npm install 
```

## Executar servidor

### Desenvolvimento
```bash
$ npm run dev
```

### Produção

rode o build do projeto e aguarde a compilação
```bash
$ npm production
```

## Logs

Para ver os logs da aplicação, execute:
```bash
$ npm run show-logs
```

#### Parar a execução da API em produção
Para fazer o pm2 para a execução do servidor, execute:
```bash
$ npm run stop-production
```
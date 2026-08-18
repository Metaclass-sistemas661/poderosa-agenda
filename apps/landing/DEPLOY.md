# Poderosa Agenda — Firebase App Hosting Deployment

## Pré-requisitos

1. **Node.js** 18+ instalado
2. **Firebase CLI** instalado:
   ```bash
   npm install -g firebase-tools
   ```
3. **Conta Google** com projeto Firebase criado

---

## Passo 1: Login no Firebase

```bash
firebase login
```

---

## Passo 2: Habilitar Web Frameworks (para Next.js SSR)

```bash
firebase experiments:enable webframeworks
```

---

## Passo 3: Configurar o Projeto

Edite o arquivo `.firebaserc` e substitua `SEU-PROJETO-FIREBASE` pelo ID do seu projeto:

```json
{
  "projects": {
    "default": "poderosa-agenda-prod"
  }
}
```

---

## Passo 4: Configurar Variáveis de Ambiente (Secrets)

No console do Firebase (ou via CLI), configure os secrets do Supabase:

```bash
firebase apphosting:secrets:set NEXT_PUBLIC_SUPABASE_URL
# Cole o valor: https://xxxxx.supabase.co

firebase apphosting:secrets:set NEXT_PUBLIC_SUPABASE_ANON_KEY  
# Cole o valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Passo 5: Criar o App Hosting Backend

```bash
firebase apphosting:backends:create --project SEU-PROJETO-FIREBASE
```

Siga as instruções interativas:
- Selecione a região (ex: `us-central1` ou `southamerica-east1` para Brasil)
- Confirme o repositório Git (se usando CI/CD automático)

---

## Passo 6: Deploy Manual (Opcional)

Para deploy manual local:

```bash
cd apps/landing
firebase deploy --only hosting
```

---

## Passo 7: Configurar Domínio Customizado (Opcional)

1. Acesse: [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Hosting** → **Add custom domain**
3. Siga as instruções para configurar DNS

---

## Passo 8: Configurar Supabase

No painel do Supabase, adicione a URL de produção do Firebase nas URLs permitidas:

1. Acesse: **Authentication** → **URL Configuration**
2. Em **Site URL**, adicione: `https://SEU-PROJETO.web.app`
3. Em **Redirect URLs**, adicione:
   - `https://SEU-PROJETO.web.app/**`
   - `https://seu-dominio.com.br/**` (se tiver domínio customizado)

---

## Estrutura de Arquivos Firebase

```
apps/landing/
├── firebase.json          # Configuração principal
├── .firebaserc            # ID do projeto
├── apphosting.yaml        # Configuração do App Hosting
└── .gitignore             # Ignora arquivos de build
```

---

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `firebase login` | Autenticar |
| `firebase projects:list` | Listar projetos |
| `firebase deploy` | Deploy completo |
| `firebase deploy --only hosting` | Apenas hosting |
| `firebase hosting:channel:deploy preview` | Deploy de preview |
| `firebase apphosting:secrets:list` | Listar secrets |
| `firebase open` | Abrir console no browser |

---

## Solução de Problemas

### Erro: "Unauthorized"
```bash
firebase logout
firebase login
```

### Erro: "Project not found"
Verifique se o ID do projeto está correto em `.firebaserc`

### Erro: "Build failed"
Certifique-se que `npm run build` funciona localmente antes de fazer deploy

---

## Custos Estimados (Firebase Spark/Free)

| Recurso | Limite Gratuito |
|---------|-----------------|
| Hosting | 10 GB/mês |
| Cloud Run | 2 milhões invocações/mês |
| Bandwidth | 360 MB/dia |
| Storage | 10 GB |

Para produção com tráfego significativo, considere o plano Blaze (pay-as-you-go).

---

## Links Úteis

- [Firebase App Hosting Docs](https://firebase.google.com/docs/app-hosting)
- [Next.js on Firebase](https://firebase.google.com/docs/hosting/frameworks/nextjs)
- [Firebase Console](https://console.firebase.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
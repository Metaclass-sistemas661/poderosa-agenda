# Firebase Deployment Guide - Poderosa Agenda

**Stack:** Next.js + Firebase Hosting + Firebase Secret Manager + GitHub Actions

---

## 🎯 Deployment Strategy

### Architecture
```
GitHub → CI/CD Pipeline → Firebase Hosting (Production)
   ↓
Firebase Secret Manager (Secrets)
   ↓
Supabase (Database)
```

### Environments
- **Production:** Firebase Hosting (main branch)
- **Preview:** Firebase Preview Channels (PRs)
- **Development:** Local + Supabase staging

---

## 📋 Pre-requisites Checklist

### 1. Firebase Setup
- [ ] Firebase project created
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase project initialized (`firebase init`)
- [ ] Billing enabled (required for Secret Manager)

### 2. GitHub Setup
- [ ] Repository pushed to GitHub
- [ ] GitHub Actions enabled
- [ ] Firebase service account created

### 3. Supabase Setup
- [ ] Production database ready
- [ ] All migrations applied
- [ ] RLS policies verified

---

## 🔐 Step 1: Firebase Secret Manager Setup

### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Set Firebase Project
```bash
cd apps/landing
firebase use --add
# Select your Firebase project
# Alias: production
```

### Create Secrets
```bash
# Supabase secrets
firebase secrets:set NEXT_PUBLIC_SUPABASE_URL
firebase secrets:set NEXT_PUBLIC_SUPABASE_ANON_KEY
firebase secrets:set SUPABASE_SERVICE_ROLE_KEY

# Database secrets
firebase secrets:set DATABASE_URL
firebase secrets:set DIRECT_URL

# Cache secrets (Upstash Redis)
firebase secrets:set UPSTASH_REDIS_REST_URL
firebase secrets:set UPSTASH_REDIS_REST_TOKEN

# Email secrets
firebase secrets:set SENDGRID_API_KEY
firebase secrets:set RESEND_API_KEY

# Payment secrets (if applicable)
firebase secrets:set STRIPE_SECRET_KEY
firebase secrets:set STRIPE_WEBHOOK_SECRET

# Monitoring (optional)
firebase secrets:set SENTRY_DSN
firebase secrets:set SENTRY_AUTH_TOKEN
```

### List Secrets
```bash
firebase secrets:list
```

### Access Secrets in Code
Firebase automatically injects secrets as environment variables in production.

---

## 📦 Step 2: Firebase Configuration

### firebase.json
```json
{
  "hosting": {
    "source": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "frameworksBackend": {
      "region": "southamerica-east1"
    }
  }
}
```

### .firebaserc
```json
{
  "projects": {
    "default": "poderosa-agenda-prod",
    "production": "poderosa-agenda-prod"
  }
}
```

---

## 🚀 Step 3: GitHub Actions CI/CD

### Create Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Create new service account
3. Generate private key (JSON)
4. Add to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT_PODEROSA_AGENDA`

### GitHub Secrets Required

Go to GitHub → Settings → Secrets and variables → Actions:

```
FIREBASE_SERVICE_ACCOUNT_PODEROSA_AGENDA
FIREBASE_TOKEN (alternative to service account)
```

---

## 📝 Step 4: Package.json Scripts

Add to `apps/landing/package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "build:prod": "NODE_ENV=production next build",
    "deploy:firebase": "firebase deploy --only hosting",
    "deploy:preview": "firebase hosting:channel:deploy preview",
    "firebase:login": "firebase login",
    "firebase:use": "firebase use production"
  }
}
```

---

## 🔄 Step 5: CI/CD Workflow

The GitHub Actions workflow will:

1. **Lint & Type Check** - Verify code quality
2. **Security Audit** - Check vulnerabilities
3. **Build** - Compile Next.js app
4. **Deploy** - Push to Firebase Hosting

**Triggers:**
- Push to `main` → Production deployment
- Pull Request → Preview deployment

---

## 🎯 Step 6: Deploy Commands

### Manual Deployment
```bash
# Production
cd apps/landing
npm run build:prod
firebase deploy --only hosting

# Preview (for testing)
firebase hosting:channel:deploy preview
```

### Automatic Deployment
Push to main branch triggers automatic deployment via GitHub Actions.

---

## 📊 Step 7: Post-Deployment Verification

### Health Check Checklist

```bash
# 1. Check deployment status
firebase hosting:channel:list

# 2. Test production URL
curl https://poderosa-agenda.web.app/api/health

# 3. Check logs
firebase functions:log

# 4. Monitor errors (if Sentry configured)
# Check Sentry dashboard
```

### Manual Testing
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Database queries working
- [ ] Images loading
- [ ] API routes responding

---

## 🔄 Step 8: Rollback Procedure

### Quick Rollback
```bash
# List previous deployments
firebase hosting:clone

# Rollback to previous version
firebase hosting:rollback
```

### Emergency Rollback
```bash
# Get list of releases
firebase hosting:releases:list

# Restore specific release
firebase hosting:clone <SOURCE_VERSION> <TARGET_VERSION>
```

---

## 📈 Step 9: Performance Optimization

### Firebase Hosting CDN
- Automatic global CDN
- Edge caching enabled
- HTTPS enforced
- HTTP/2 support

### Recommended Headers
Already configured in `next.config.js`:
- Cache-Control
- Security headers
- Compression

---

## 🔐 Step 10: Security Checklist

### Pre-Production
- [ ] All secrets in Firebase Secret Manager
- [ ] No hardcoded credentials in code
- [ ] Environment variables validated
- [ ] HTTPS redirect enabled
- [ ] Security headers configured
- [ ] CORS configured correctly

### Post-Production
- [ ] Monitor Firebase console for anomalies
- [ ] Check Supabase RLS policies active
- [ ] Verify rate limiting working
- [ ] Test authentication flow
- [ ] Verify audit logging

---

## 📋 Deployment Checklist

### Before First Deploy
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize project
cd apps/landing
firebase init hosting

# 4. Set all secrets
firebase secrets:set NEXT_PUBLIC_SUPABASE_URL
# ... (all other secrets)

# 5. Build locally to test
npm run build:prod

# 6. Deploy
firebase deploy --only hosting
```

### Regular Deployment
```bash
# 1. Merge PR to main (triggers GitHub Actions)
# OR

# 2. Manual deployment
git pull origin main
cd apps/landing
npm run build:prod
firebase deploy --only hosting
```

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Check Node version
node -v  # Should be 18.x

# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Secrets Not Loading
```bash
# Verify secrets exist
firebase secrets:list

# Access secrets (requires Firebase Functions)
firebase secrets:access NEXT_PUBLIC_SUPABASE_URL
```

### Deployment Fails
```bash
# Check Firebase CLI version
firebase --version

# Re-authenticate
firebase logout
firebase login

# Check project
firebase use --add
```

---

## 📊 Monitoring

### Firebase Console
- Hosting usage
- Request logs
- Performance metrics
- Error tracking

### Custom Monitoring
```typescript
// Add to your app
import { logger } from '@/lib/observability/logger'

logger.info('User logged in', { userId: user.id })
logger.error('Payment failed', { error, orderId })
```

---

## 🎯 Next Steps

### After First Deployment
1. ✅ Configure custom domain
2. ✅ Set up Firebase Performance Monitoring
3. ✅ Enable Firebase Analytics
4. ✅ Configure error tracking (Sentry)
5. ✅ Set up backup strategy

### Ongoing
- Monitor Firebase quota usage
- Review security rules monthly
- Update dependencies regularly
- Scale Firebase plan as needed

---

## 💰 Cost Estimation

### Firebase Hosting (Spark Plan - Free)
- 10 GB storage
- 360 MB/day transfer
- Good for: MVP, small projects

### Firebase Hosting (Blaze Plan - Pay as you go)
- $0.026 per GB storage
- $0.15 per GB transfer
- Estimated: $20-50/month for small SaaS

### Supabase (Pro Plan)
- $25/month
- 8 GB database
- 250 GB bandwidth

**Total Estimated: $45-75/month**

---

## 📚 Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Firebase Secret Manager](https://firebase.google.com/docs/functions/config-env)
- [Next.js on Firebase](https://firebase.google.com/docs/hosting/nextjs)
- [GitHub Actions for Firebase](https://github.com/marketplace/actions/deploy-to-firebase-hosting)

---

**Last Updated:** 2026-08-17  
**Version:** 1.0  
**Status:** Production Deployment Guide Complete
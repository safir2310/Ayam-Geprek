# 🚀 VERCEL DEPLOYMENT GUIDE - WITH TOKEN

## 📋 PREREQUISITES

✅ **Vercel Token**: `BvGHQ8bzpsQ0NGcX8kiOCHxt`
✅ **GitHub Repository**: https://github.com/safir2310/Ayam-Geprek
✅ **Project Ready**: Ayam Geprek Sambal Ijo application

---

## 🎯 DEPLOYMENT STRATEGY

Since deploying via CLI requires GitHub authentication, we'll use the **web-based deployment** method which is faster and easier!

### Advantages of Web-Based Deployment:
- ✅ No CLI authentication needed
- ✅ Visual interface
- ✅ Easier to troubleshoot
- ✅ Better for beginners
- ✅ Automatic GitHub integration

---

## 📤 STEP 1: PUSH CODE TO GITHUB

### Option A: If you have GitHub access:

1. Open your terminal
2. Navigate to project:
```bash
cd /home/z/my-project
```

3. Push to GitHub:
```bash
git push -u origin master
```

4. When prompted:
   - Username: `safir2310`
   - Password: [Your GitHub Personal Access Token]

### Option B: Manual upload via GitHub web:

1. Go to: https://github.com/safir2310/Ayam-Geprek
2. Click: **"Add file"** → **"Upload files"**
3. Drag and drop your project files
4. Click: **"Commit changes"**

---

## 🌐 STEP 2: CREATE VERCEL ACCOUNT WITH TOKEN

### 2.1 Use the Vercel Token:

1. Go to: https://vercel.com/login
2. Click on **"Continue with GitHub"**
3. If prompted for token, enter: `BvGHQ8bzpsQ0NGcX8kiOCHxt`

### 2.2 Alternative - Add Token to Settings:

1. Log in to Vercel
2. Go to: https://vercel.com/account/tokens
3. Click: **"Create Token"**
4. Token: `BvGHQ8bzpsQ0NGcX8kiOCHxt`
5. Label: `Ayam Geprek Deployment`
6. Scope: **Full Account** (recommended)
7. Click: **"Create"**

---

## 🚀 STEP 3: IMPORT PROJECT TO VERCEL

### 3.1 Create New Project:

1. Go to: https://vercel.com/new
2. Click: **"Add New Project"**

### 3.2 Import from GitHub:

1. Look for: **"Import Project From Git"** section
2. Find repository: **safir2310/Ayam-Geprek**
3. Click: **"Import"**

### 3.3 Configure Project:

Vercel will auto-detect:
- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `next build` ✅
- **Output Directory**: `.next` ✅

**Project Settings:**
- **Project Name**: `ayam-geprek-sambal-ijo`
- **Team**: [Your team or personal account]
- **Region**: [Nearest to your users]

4. Click: **"Deploy"**

🎉 **Deployment will start automatically!**

---

## 💾 STEP 4: SETUP VERCEL POSTGRES DATABASE

### 4.1 Navigate to Storage:

1. After deployment, go to: https://vercel.com/dashboard
2. Select project: **ayam-geprek-sambal-ijo**
3. Click tab: **"Storage"** in sidebar
4. Click: **"Create Database"**

### 4.2 Create Database:

1. **Database Provider**: Postgres (Neon) ✅
2. **Plan**: **Hobby (Free)** - 512MB storage
3. **Database Name**: `ayam-geprek-db`
4. **Region**: [Select nearest region]
5. Click: **"Create"**

### 4.3 Get Connection String:

1. After creation, click on the database
2. Go to: **"Connect"** tab
3. Copy the **Connection String**

Example:
```
postgresql://default:xxxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

⚠️ **Keep this string safe! You'll need it for environment variables.**

---

## 🔧 STEP 5: UPDATE PRISMA SCHEMA

### 5.1 Edit `prisma/schema.prisma`:

**File Location:** `/home/z/my-project/prisma/schema.prisma`

**CHANGE FROM:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**CHANGE TO:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 5.2 Generate Prisma Client:

```bash
cd /home/z/my-project
bun run db:generate
```

Expected output:
```
✔ Generated Prisma Client (v6.11.1) to ./node_modules/@prisma/client in XXms
```

---

## ⚙️ STEP 6: SETUP ENVIRONMENT VARIABLES

### 6.1 Add DATABASE_URL:

1. In Vercel project, go to: **"Settings"** tab
2. Scroll to: **"Environment Variables"**
3. Click: **"Add New"**
4. **Name**: `DATABASE_URL`
5. **Value**: [Paste the connection string from Step 4.3]
6. **Environments**: ✅ Check all - **Production, Preview, Development**
7. Click: **"Save"**

### 6.2 Add NODE_ENV (Optional):

1. Click: **"Add New"**
2. **Name**: `NODE_ENV`
3. **Value**: `production`
4. **Environments**: ✅ Check **Production** only
5. Click: **"Save"**

---

## 📤 STEP 7: PUSH SCHEMA TO DATABASE

### 7.1 Update Local .env:

Edit `/home/z/my-project/.env`:

```env
DATABASE_URL=[PASTE CONNECTION STRING FROM VERCEL POSTGRES]
```

### 7.2 Push Schema to Vercel Postgres:

```bash
cd /home/z/my-project
bun run db:push
```

Expected output:
```
Your database is now in sync with your Prisma schema.
Done in XXms
```

✅ **Your database tables are now created in Vercel Postgres!**

---

## 🔄 STEP 8: REDEPLOY APPLICATION

### 8.1 Redeploy from Vercel Dashboard:

1. Go to: https://vercel.com/dashboard/[username]/ayam-geprek-sambal-ijo
2. Click: **"Deployments"** tab
3. Find the latest deployment
4. Click: **"..."** (three dots)
5. Click: **"Redeploy"**
6. Confirm: **"Redeploy"**

### 8.2 Alternative: Push to GitHub:

Any push to GitHub will trigger automatic deployment:

```bash
git add .
git commit -m "Update for Vercel deployment"
git push origin master
```

🎉 **Vercel will automatically deploy the latest code!**

---

## ✅ STEP 9: VERIFICATION & TESTING

### 9.1 Get Your Production URL:

Vercel will provide a URL like:
```
https://ayam-geprek-sambal-ijo.vercel.app
```

Or check custom domain if configured.

### 9.2 Test Registration:

1. Open: `https://ayam-geprek-sambal-ijo.vercel.app/auth/register`
2. Fill in User registration form
3. Click: **"Register sebagai User"**
4. ✅ **Should succeed and store data in Vercel Postgres**

### 9.3 Test Login:

1. Go to: `/auth/login`
2. Login with credentials from registration
3. ✅ **Should successfully login and redirect to dashboard**

### 9.4 Test Admin Features:

1. Register as admin with date of birth
2. Login
3. Access: `/admin/dashboard`
4. ✅ **Should be able to access admin features**

### 9.5 Test Coin Exchange:

1. Login as user
2. Go to: `/user/coin-exchange`
3. Try to exchange coins
4. ✅ **Coin exchange should work**

### 9.6 Test Data Persistence:

1. Create some data (users, transactions, products)
2. Refresh page or open in incognito
3. ✅ **Data should still be there (persistent database)**

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] Code pushed to GitHub
- [ ] Vercel account created with token
- [ ] Project imported to Vercel
- [ ] Initial deployment completed

### Database Setup:
- [ ] Vercel Postgres created (Hobby Free tier)
- [ ] Connection string copied
- [ ] Prisma schema updated to PostgreSQL
- [ ] Prisma client generated
- [ ] DATABASE_URL added to Vercel environment variables
- [ ] Schema pushed to Vercel Postgres

### Post-Deployment:
- [ ] Application redeployed
- [ ] Production URL accessible
- [ ] Registration works
- [ ] Login works
- [ ] Data persists in database
- [ ] Admin dashboard accessible
- [ ] All features working

---

## 🔍 TROUBLESHOOTING

### Issue 1: Deployment fails with build error

**Solution:**
1. Check Vercel Build Logs
2. Ensure all dependencies are in package.json
3. Verify build command is correct
4. Check for syntax errors

### Issue 2: Database connection error

**Solution:**
1. Verify DATABASE_URL is correct in Vercel Settings
2. Copy connection string again from Vercel Postgres
3. Ensure schema was pushed successfully
4. Redeploy after fixing environment variables

### Issue 3: Register creates users but data disappears

**Solution:**
1. Check if using Vercel Postgres (not local SQLite)
2. Verify DATABASE_URL in production environment
3. Ensure schema pushed to Vercel Postgres, not local database

### Issue 4: Images not loading

**Solution:**
1. Check if images are in `/public` folder
2. Verify image paths are correct
3. Check CDN/Asset optimization settings in Vercel

### Issue 5: Slow performance

**Solution:**
1. Vercel provides global CDN (should be fast)
2. Check Vercel Analytics for insights
3. Optimize images and code
4. Consider upgrading to Pro plan if needed

---

## 📈 MONITORING & MAINTENANCE

### Vercel Dashboard:
- **URL**: https://vercel.com/dashboard
- Monitor: Deployment status, build logs, analytics
- Functions: Check API route logs
- Analytics: View traffic and performance

### Vercel Postgres:
- **URL**: https://vercel.com/dashboard/storage/postgres
- Monitor: Storage usage, query performance
- Backups: Automatic (7 days retention on free tier)
- Connection: Manage connection strings

### GitHub:
- **Repository**: https://github.com/safir2310/Ayam-Geprek
- **Issues**: Track bugs and feature requests
- **Actions**: View deployment history

---

## 🎉 SUCCESS CRITERIA

### Your deployment is successful when:

✅ Application loads at Vercel URL
✅ New users can register
✅ Users can login
✅ Data persists across sessions
✅ Admin dashboard is accessible
✅ All features work as expected
✅ No console errors in browser
✅ Vercel build logs show success

---

## 💡 NEXT STEPS AFTER DEPLOYMENT

### 1. Custom Domain (Optional):
1. Go to Vercel Project → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records

### 2. Analytics:
1. Enable Vercel Analytics
2. Monitor user behavior
3. Track performance metrics

### 3. Optimization:
1. Monitor build times
2. Optimize images and assets
3. Consider caching strategies

### 4. Scaling:
1. Monitor resource usage
2. Upgrade plan if needed
3. Add more team members

---

## 📞 SUPPORT & RESOURCES

### Official Documentation:
- **Vercel**: https://vercel.com/docs
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs

### Your Resources:
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your Project**: https://vercel.com/dashboard/[username]/ayam-geprek-sambal-ijo
- **GitHub Repository**: https://github.com/safir2310/Ayam-Geprek
- **Vercel Token**: `BvGHQ8bzpsQ0NGcX8kiOCHxt`

---

## 🚀 QUICK START SUMMARY

### Fastest Path to Production:

1. **Push code to GitHub** (5 min)
2. **Import to Vercel** from https://vercel.com/new (2 min)
3. **Create Vercel Postgres** database (3 min)
4. **Update Prisma schema** to PostgreSQL (2 min)
5. **Add DATABASE_URL** to Vercel environment variables (1 min)
6. **Push schema** to Vercel Postgres (2 min)
7. **Redeploy** (2 min)
8. **Test application** (5 min)

**Total Time: ~20-25 minutes**

---

## 🎊 CONGRATULATIONS!

You're about to deploy your Ayam Geprek Sambal Ijo application to production with Vercel!

This deployment provides:
✅ Persistent PostgreSQL database (512MB free)
✅ Automatic deployments from GitHub
✅ Global CDN for fast loading
✅ SSL certificates
✅ Professional production environment
✅ Easy scaling and monitoring

**Good luck! Your application will be production-ready soon!** 🚀

# Deployment Guide

This guide covers deploying your Vape Store Manager to various hosting platforms.

## Supabase Setup (Required First)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to initialize

2. **Set up Database**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `database/schema.sql`
   - Click "Run" to execute the schema

3. **Get API Keys**
   - Go to Settings > API
   - Copy your Project URL and anon public key
   - You'll need these for environment variables

## Vercel Deployment (Recommended)

### Option 1: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
5. Deploy

### Option 2: CLI Deployment
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Netlify Deployment

### Option 1: Drag and Drop
1. Build the project: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to the deploy area
4. Go to Site settings > Environment variables
5. Add your Supabase environment variables

### Option 2: Git Integration
1. Push code to GitHub
2. Connect repository in Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables

## Railway Deployment

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Deploy automatically

## Manual Server Deployment

### Build for Production
```bash
npm run build
```

### Upload Files
Upload the `dist` folder contents to your web server.

### Environment Variables
Make sure your hosting service supports environment variables or create a `.env.production` file.

## Environment Variables Reference

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Post-Deployment Checklist

- [ ] Test login with demo PINs (1234 for admin, 5678 for worker)
- [ ] Verify Supabase connection
- [ ] Test worker shift functionality
- [ ] Test admin dashboard and charts
- [ ] Verify data export functionality
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)

## Production Considerations

### Security
- Update Supabase RLS policies for production
- Use strong PINs for real users
- Enable Supabase rate limiting
- Consider adding HTTPS headers

### Performance
- Enable CDN if available
- Optimize images and assets
- Consider implementing service worker for offline functionality

### Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor Supabase usage and billing
- Set up uptime monitoring

## Troubleshooting

### Common Issues

**Build Fails**
- Check Node.js version (needs 18+)
- Clear node_modules and reinstall
- Check for TypeScript errors

**Environment Variables Not Working**
- Ensure variables start with `VITE_`
- Check variable names are exact
- Restart development server after changes

**Supabase Connection Issues**
- Verify URL and key are correct
- Check Supabase project is active
- Verify RLS policies allow access

**Charts Not Loading**
- Ensure sample data exists in database
- Check browser console for errors
- Verify Recharts dependency is installed

### Getting Help

1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Check hosting platform logs
4. Ensure all environment variables are set correctly

## Custom Domain Setup

### Vercel
1. Go to project settings
2. Add custom domain
3. Update DNS records as instructed

### Netlify
1. Go to domain management
2. Add custom domain
3. Configure DNS settings

### Cloudflare (Optional)
- Add site to Cloudflare for additional CDN and security
- Update nameservers
- Enable security features

## Backup Strategy

### Database Backups
- Supabase provides automatic backups
- Consider additional backup solutions for critical data
- Export data regularly using the built-in export features

### Code Backups
- Use Git for version control
- Keep backups of environment configurations
- Document any custom modifications

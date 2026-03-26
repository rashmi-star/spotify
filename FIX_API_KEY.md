# 🔑 Fix: API Key Leaked Error

## ❌ Problem
Your Gemini API key was flagged as leaked by Google:
```
[403 Forbidden] Your API key was reported as leaked. Please use another API key.
```

This happened because the API key was exposed in your GitHub repository earlier.

---

## ✅ Solution: Get a New API Key

### **Step 1: Get a New Gemini API Key**

1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select **"Create API key in new project"** (or use existing)
5. Copy the new API key

### **Step 2: Update .env File**

1. Open `.env` file in your project root
2. Replace the old key:
   ```
   GEMINI_API_KEY=your_new_api_key_here
   ```
3. Save the file

### **Step 3: Restart Dev Server**

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 4: Verify It Works**

1. Try typing a message in the app
2. Click "Get AI Response"
3. You should see real Gemini responses (not fallback)

---

## 🛡️ Security Checklist

### **✅ Make Sure:**
- [ ] `.env` is in `.gitignore` (should already be there)
- [ ] Never commit `.env` to git
- [ ] Never share API keys in screenshots/videos
- [ ] Use environment variables in production (Vercel/Netlify)

### **✅ If Deploying:**
- Set API keys in hosting platform's environment variables
- Never hardcode keys in code
- Use different keys for dev/production

---

## 🚨 Important Notes

1. **Old Key is Dead** - The leaked key won't work anymore, even if you remove it from GitHub
2. **Get New Key** - You must create a completely new API key
3. **Keep It Secret** - Never expose the new key anywhere public

---

## 📝 Quick Test

After updating the key, test it:

```bash
# Create a quick test
node -e "require('dotenv').config(); console.log('Key length:', process.env.GEMINI_API_KEY?.length || 'Not found')"
```

---

**Once you have the new key, update `.env` and restart the server!** 🚀





# 🎨 BaoPixel Studio OS v4

Application Web **moderne SaaS** pour la gestion de calendrier de contenu avec intégration Notion et chatbot IA.

---

## ✨ Fonctionnalités

- 📅 **Calendrier Notion** - Synchronisation automatique à minuit
- 💬 **Chatbot IA** - Ollama/Mistral gratuit (local)
- 🎨 **Design SaaS** - Light/Dark mode, responsive
- 📱 **Mobile-First** - 5 points de rupture (0, 641px, 1025px, 1440px, 1920px)
- 🤝 **WhatsApp Integration** - Bouton contact rapide (+221 779 127 614)
- 📊 **Sync Notion** - 90 jours de contenu à venir

---

## 🚀 Installation

### Prérequis
- Node.js v25.8.2+ ([nodejs.org](https://nodejs.org))
- Ollama ([ollama.ai](https://ollama.ai)) - Pour le chatbot local

### 1️⃣ Cloner et installer
```bash
git clone <your-repo>
cd baopixel-studio-v4
npm install
```

### 2️⃣ Configuration

Copie `.env.example` en `.env.local` :
```bash
cp .env.example .env.local
```

Remplis les variables :
```env
NOTION_TOKEN=ntn_votre_token_ici
```

### 3️⃣ Lancer Ollama (Chatbot)

**Dans un terminal séparé** :
```bash
ollama run mistral
```

*(Cela télécharge ~4GB et démarre le serveur sur port 11434)*

### 4️⃣ Lancer l'app

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) 🎉

---

## 🏗️ Architecture

```
baopixel-studio-v4/
├── app/
│   ├── page.tsx          # React component principal (13 modules)
│   ├── globals.css       # System design (light/dark, responsive)
│   ├── layout.tsx        # Next.js layout
│   └── api/
│       ├── ai/           # Chatbot API (Ollama)
│       └── notion/
│           ├── sync/     # Sync calendrier Notion
│           └── mark/     # Marquer post comme publié
├── .env.local            # Variables d'environnement
├── next.config.js        # Configuration Next.js
├── tsconfig.json         # TypeScript config
└── vercel.json           # Configuration Vercel
```

---

## 🔑 Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NOTION_TOKEN` | Token d'intégration Notion | `ntn_xxxxx...` |

> **Obtenir un token Notion** : [Créer une intégration](https://www.notion.so/my-integrations)

---

## 🧠 Chatbot - Configuration

### Option 1️⃣ : Ollama (Gratuit, Local) ⭐
```bash
ollama run mistral
```
- ✅ Gratuit, local, pas de clé
- ✅ Confidentiel (données locales)
- ✅ Hors-ligne

### Option 2️⃣ : Claude API (Premium)
Ajoute ta clé dans `.env.local` :
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
```

---

## 📡 Déploiement

### Sur Vercel (Recommandé)

1. **Push le repo sur GitHub**
2. **Vercel** → [vercel.com](https://vercel.com)
3. **Import** → Sélectionne ton repo
4. Ajoute les variables d'environnement dans Vercel Dashboard
5. Deploy ! 🚀

```bash
git push origin main
```

---

## 📊 Notion Integration

**Base de données requise** :
- ✅ Créer une base de données "Calendrier Avril 2026" (ou autre)
- ✅ Propriétés : `nom`, `date_publication`, `plateforme`, `type`, `statut`, `client`

La synchronisation se fait automatiquement chaque **00:00** (minuit).

---

## 🎨 Design System

### Palette
- **Light** : Background #FAFBFC, Primary Indigo #6366F1, Accent Amber #F59E0B
- **Dark** : Background #0F1419, Primary #818CF8, Accent #FCA311

### Breakpoints
- 📱 Mobile: 0 - 640px
- 📱 Tablet: 641px - 1024px  
- 🖥️ Desktop: 1025px - 1440px
- 🖥️ Large: 1441px - 1920px
- 🖥️ XL: 1921px+

---

## 📞 Support

- **Notion Help** : [notion.so/help](https://notion.so/help)
- **Ollama Docs** : [ollama.ai/docs](https://ollama.ai)
- **Next.js Docs** : [nextjs.org](https://nextjs.org/docs)

---

## 📄 License

© 2026 BaoPixel Studio. Tous droits réservés.

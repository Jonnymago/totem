#!/bin/bash
set -e

if [[ -z "$GITHUB_REPO" || "$GITHUB_REPO" != *"/"* ]]; then
  REPO="Jonnymago/totem"
else
  REPO="$GITHUB_REPO"
fi
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Errore: GITHUB_TOKEN non configurato nell'ambiente."
  exit 1
fi

echo "🚀 [Auto-Push] Inizializzazione sincronizzazione git su https://github.com/$REPO..."

# Configura git e remote origin
if [ ! -d ".git" ]; then
  git init
fi

git config user.name "AI Studio Agent"
git config user.email "agent@aistudio.google.com"

if git remote | grep -q "^origin$"; then
  git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}.git"
else
  git remote add origin "https://x-access-token:${TOKEN}@github.com/${REPO}.git"
fi

# Fetch o checkout main
git fetch origin main 2>/dev/null || true
git branch -M main

# Aggiungi e committa modifiche
git add -A
COMMIT_MSG="${1:-feat(totem): update Totem QuickBite - offline translation glossary & kiosk build ($(date -u +'%Y-%m-%d %H:%M:%S UTC'))}"
git commit -m "$COMMIT_MSG" || echo "Nessuna modifica da committare."

# Push al branch main
echo "📤 [Auto-Push] Invio modifiche a origin main..."
git push origin main --force

echo "✅ [Auto-Push] Push completato con successo. GitHub Actions avvierà il bundle OTA."

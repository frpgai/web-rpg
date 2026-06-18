#!/usr/bin/env bash
# setup.sh — configura o ambiente de desenvolvimento do web-rpg
# Execute uma vez após clonar: bash setup.sh

set -e

echo "⚙️  Configurando git hooks..."
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
echo "   ✅ pre-commit hook instalado (.githooks/pre-commit)"

echo ""
echo "📦 Instalando dependências..."
npm install

echo ""
echo "✅ Setup concluído. Rode 'npm run dev' para iniciar."

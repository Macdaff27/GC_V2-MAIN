# refactor_plan.md — Plan & historique

## ✅ État actuel (v1.3.0 — Cards‑only stable)
- Extraction : `types`, `utils/format`, `ClientCard`, `SearchBar`, `Stats`, `DataActions`, `ThemeToggle`, `SortButton`
- **Suppression définitive** de toute “page de détail” : UI **cards‑only**
- Import : mode “remplacement complet” avec confirmation
- `dateAjout` préservée depuis JSON (si fournie)

## 🕒 Historique (Phase 1)
1. Types & utils extraits
2. `ClientCard`, `SearchBar` → allègement `App.tsx`
3. `Stats`, `DataActions`, `ThemeToggle`, `SortButton`
4. Correction accents & couleurs (lisibilité sur cartes)
5. Import : purge + insertions, `dateAjout` fix

## 🧭 Règle produit (verrou)
- Pas de `ClientDetailModal`, pas de navigation ou page dédiée
- Tout ajout doit respecter **cards‑only** (vérifier PRs pour régressions)

## 🗺️ Roadmap légère (facultative)
- v1.3.x : petites UX (badge impayés, copie numéro)
- v1.4.0 : export CSV optionnel
- v1.5.0 : sauvegarde auto (rappel fin de journée)

## 🧪 Checklist de release
- [ ] CRUD OK + bascule statut
- [ ] Recherche/tri OK
- [ ] Export/Import OK (dates respectées)
- [ ] Android build OK
- [ ] README/context/refactor_plan à jour

## 🛡️ Garde‑fous
- ESLint: pas d’inlines inutiles, factoriser styles communs
- Pas de références à `ClientDetailModal`/navigation
- Toute nouvelle vue doit justifier la **non** régression “cards‑only”

## ⚡ Action immédiate (mini‑exercice)
- Ouvrir `ClientCard.tsx` → ajouter une **icône “copier le numéro”** à côté de chaque téléphone (Clipboard API RN).  
- Tester : copier puis coller dans un champ texte, valider sur Android.

## 🧰 Outils utiles
- VS Code + Gemini/ChatGPT (prompts ciblés, 1 composant par PR)
- Android Studio (build, logs)
- Git tags : `v1.3.0-cards-only-stable`

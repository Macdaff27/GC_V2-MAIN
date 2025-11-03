# context.md — Contexte technique & règles

## 🎯 Principe produit
- App offline‑first pour gérer commandes clientes en boutique
- Interface **“cards‑only”** : tout sur la carte, pas de détails séparés

## 🏗️ Architecture
- `App.tsx` : état global (clients, filtres, tri), handlers (import/export, CRUD), FlatList
- Composants UI : `ClientCard`, `SearchBar`, `Stats`, `DataActions`, `ThemeToggle`, `SortButton`
- Utilitaires purs : `src/utils/format.ts` (formatage DA, date JJ/MM/AAAA, normalisations)
- Types partagés : `src/types/index.ts` (ClientWithRelations, etc.)

## 🎨 Thème & palette
- Palette dérivée d’`isDarkMode` (textPrimary/Secondary, accent, background, surface…)
- **Lisibilité** : cartes statut jaune/vert → texte noir forcé sur valeurs clés

## 📥 Import — règles
- **Remplacement complet** : purge tables puis insertions
- `dateAjout` : si présente dans JSON (JJ/MM/AAAA) → **utiliser telle quelle**, sinon `formatDate(new Date())`
- Normalisations : `normalizeAmount`, `normalizeStatus`, `normalizeString`

## 📤 Export — règles
- JSON lisible (indentation 2)
- Inclut `dateAjout`, `statut`, `telephones[]`, `frais[]`
- Nom de fichier : `buildExportFileName()`

## 🗃️ Données & contraintes
- `clients.nom` UNIQUE, `clients.page` UNIQUE
- Suppression en cascade (frais, téléphones)
- Index : `idx_frais_client`, `idx_tel_client`

## 🧭 Suppression définitive des modales
- ❌ Pas de `ClientDetailModal`, pas de navigation/stack
- ❌ Pas d’`onOpenDetail`, `detailClient`, `setDetailClient`
- ✅ `ClientCard` contient : nom, page, dateAjout, statut, montants, frais, téléphones, note, actions (modifier/supprimer/basculer)

## 🔐 Sécurité & fiabilité
- Pas d’Internet requis
- Confirmation avant purge à l’import
- Validation basique (nom, page, montants numériques)

## 🧪 Tests manuels (checklist)
- Ajout / édition / suppression
- Basculer statut (couleur carte)
- Recherche texte & tri pages
- Export → ouvrir JSON et vérifier `dateAjout`
- Import → base vidée + réinsérée

## 🧩 Extrait utile (ex. UI “cards‑only”)
```tsx
<ClientCard
  client={item}
  palette={palette}
  onEdit={handleEditClient}
  onDelete={handleDeleteClient}
  onToggleStatus={handleToggleStatus}
/>
```

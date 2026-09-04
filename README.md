# Calligraphia

Éditeur d'écriture manuscrite sur papier Seyès, avec tirage aléatoire des polices lettre par lettre et export PDF fidèle à l'aperçu.

## Fonctionnalités

- Zone principale + marge, sur fond Seyès réglé au millimètre
- Mélange de polices manuscrites (tirage au hasard par lettre)
- Réglages : encre, taille, interligne, espacement, alignement, calage vertical
- Export PDF A4 : grille Seyès optionnelle, gras optionnel
- Sauvegarde JSON + brouillon auto local (restauration au rechargement)
- Démo intégrée

## Lancement

Le chargement de la démo utilise `fetch`, donc il faut servir le dossier en HTTP :

```sh
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/editor.html`.

## Structure

- `editor.html` : page et barre d'outils
- `css/styles.css` : styles, grille, impression
- `js/app.js` : éditeur, pagination, export
- `vendor/` : html2canvas, jsPDF
- `fonts/` : polices manuscrites
- `assets/` : fond Seyès
- `data/` : démo et exemple

## Notes d'export

- Pendant l'export, le crénage et les ligatures sont désactivés : certaines polices manuscrites produisent sinon des chasses nulles que le moteur de capture ignore (lettres manquantes).
- Le curseur virtuel et la surbrillance de sélection sont masqués à l'export.
- `Export en gras` applique une graisse 700 synthétisée, uniquement à l'export.

## Format de sauvegarde

JSON versionné (`version: 1`) : réglages, polices actives, contenus des deux zones. Compatible entre Enregistrer/Charger et le brouillon auto (`localStorage`).

export type EffectPage = 'Cut' | 'Edit' | 'Fusion' | 'Color' | 'Fairlight';

export interface DavinciEffect {
  id: string;
  name: string;
  pages: EffectPage[];
  category: string;
  summary: string;
  usage: string;
  path: string;
  keywords: string[];
  availability?: 'Gratuit' | 'Studio';
}

export const EFFECT_PAGES: { name: EffectPage; icon: string; hint: string }[] = [
  { name: 'Cut', icon: '✂️', hint: 'Montage rapide' },
  { name: 'Edit', icon: '🎞️', hint: 'Montage et Open FX' },
  { name: 'Fusion', icon: '🪄', hint: 'Compositing par nodes' },
  { name: 'Color', icon: '🎨', hint: 'Étalonnage et Resolve FX' },
  { name: 'Fairlight', icon: '🎧', hint: 'Traitement audio' },
];

/**
 * Curated, plain-language catalog of common built-in DaVinci Resolve tools.
 * It is intentionally stored outside the user's shortcut database.
 */
export const DAVINCI_EFFECTS: DavinciEffect[] = [
  // Resolve FX shared by Cut, Edit and Color
  {
    id: 'gaussian-blur', name: 'Gaussian Blur', pages: ['Cut', 'Edit', 'Color'], category: 'Flous',
    summary: 'Crée un flou doux et régulier en mélangeant les pixels voisins.',
    usage: 'Utile pour flouter un visage, calmer un arrière-plan ou adoucir une zone trop détaillée.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Blur → Gaussian Blur',
    keywords: ['blur', 'flou gaussien', 'visage', 'adoucir', 'background'], availability: 'Gratuit',
  },
  {
    id: 'box-blur', name: 'Box Blur', pages: ['Cut', 'Edit', 'Color'], category: 'Flous',
    summary: 'Produit un flou simple au rendu plus carré et plus direct qu’un flou gaussien.',
    usage: 'Pratique pour des aplats flous, des caches graphiques ou un effet volontairement numérique.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Blur → Box Blur',
    keywords: ['blur', 'flou boîte', 'pixel', 'graphique'], availability: 'Gratuit',
  },
  {
    id: 'directional-blur', name: 'Directional Blur', pages: ['Cut', 'Edit', 'Color'], category: 'Flous',
    summary: 'Étire le flou dans une direction choisie pour suggérer un mouvement.',
    usage: 'Sert à renforcer une vitesse, une transition ou un mouvement de caméra.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Blur → Directional Blur',
    keywords: ['motion blur', 'flou directionnel', 'vitesse', 'mouvement'], availability: 'Gratuit',
  },
  {
    id: 'lens-blur', name: 'Lens Blur', pages: ['Cut', 'Edit', 'Color'], category: 'Flous',
    summary: 'Simule le flou optique et la forme du diaphragme d’un objectif.',
    usage: 'Donne une profondeur de champ plus photographique et des hautes lumières en bokeh.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Blur → Lens Blur',
    keywords: ['bokeh', 'depth of field', 'profondeur de champ', 'objectif'], availability: 'Studio',
  },
  {
    id: 'mosaic-blur', name: 'Mosaic Blur', pages: ['Cut', 'Edit', 'Color'], category: 'Flous',
    summary: 'Remplace les détails par de gros blocs colorés de type mosaïque.',
    usage: 'Convient pour anonymiser un visage, une plaque ou une information sensible.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Blur → Mosaic Blur',
    keywords: ['pixelate', 'mosaïque', 'censure', 'anonymiser', 'plaque'], availability: 'Gratuit',
  },
  {
    id: 'radial-blur', name: 'Radial Blur', pages: ['Cut', 'Edit', 'Color'], category: 'Flous',
    summary: 'Fait rayonner ou tourner le flou autour d’un point central.',
    usage: 'Crée un zoom rapide, un vertige ou une rotation stylisée.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Blur → Radial Blur',
    keywords: ['zoom blur', 'spin', 'rotation', 'vortex'], availability: 'Gratuit',
  },
  {
    id: 'glow', name: 'Glow', pages: ['Cut', 'Edit', 'Color'], category: 'Éclairage',
    summary: 'Ajoute une lueur autour des parties lumineuses de l’image.',
    usage: 'Idéal pour des néons, des sources brillantes ou une ambiance douce et onirique.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Light → Glow',
    keywords: ['lueur', 'néon', 'bloom', 'light', 'brillance'], availability: 'Gratuit',
  },
  {
    id: 'lens-flare', name: 'Lens Flare', pages: ['Cut', 'Edit', 'Color'], category: 'Éclairage',
    summary: 'Simule les reflets et halos produits par une forte lumière dans un objectif.',
    usage: 'Ajoute une source lumineuse spectaculaire ou renforce un contre-jour.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Light → Lens Flare',
    keywords: ['flare', 'reflet objectif', 'soleil', 'halo', 'light'], availability: 'Studio',
  },
  {
    id: 'light-rays', name: 'Light Rays', pages: ['Cut', 'Edit', 'Color'], category: 'Éclairage',
    summary: 'Génère des rayons lumineux à partir des zones claires de l’image.',
    usage: 'Sert à créer des faisceaux de fenêtre, un effet divin ou une lumière atmosphérique.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Light → Light Rays',
    keywords: ['god rays', 'rayons', 'faisceau', 'volumetric light'], availability: 'Studio',
  },
  {
    id: 'vignette', name: 'Vignette', pages: ['Cut', 'Edit', 'Color'], category: 'Éclairage',
    summary: 'Assombrit ou éclaire progressivement les bords de l’image.',
    usage: 'Guide le regard vers le sujet ou imite le rendu d’un ancien objectif.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Light → Vignette',
    keywords: ['coins sombres', 'focus', 'encadrement', 'vignetting'], availability: 'Gratuit',
  },
  {
    id: 'color-space-transform', name: 'Color Space Transform', pages: ['Edit', 'Color'], category: 'Couleur',
    summary: 'Convertit une image d’un espace colorimétrique et gamma vers un autre.',
    usage: 'Permet notamment de transformer un rush Log vers Rec.709 ou d’intégrer plusieurs caméras.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Color → Color Space Transform',
    keywords: ['CST', 'log', 'rec709', 'gamma', 'gamut', 'conversion'], availability: 'Gratuit',
  },
  {
    id: 'color-compressor', name: 'Color Compressor', pages: ['Edit', 'Color'], category: 'Couleur',
    summary: 'Rapproche une gamme de couleurs d’une couleur cible sans détourage complexe.',
    usage: 'Uniformise rapidement un vêtement, un décor ou plusieurs nuances proches.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Color → Color Compressor',
    keywords: ['uniformiser couleur', 'teinte', 'hue', 'compression'], availability: 'Gratuit',
  },
  {
    id: 'false-color', name: 'False Color', pages: ['Edit', 'Color'], category: 'Couleur',
    summary: 'Affiche l’exposition sous forme de couleurs conventionnelles faciles à lire.',
    usage: 'Aide à vérifier rapidement les niveaux de peau, les ombres et les hautes lumières.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Color → False Color',
    keywords: ['exposition', 'IRE', 'peau', 'scope', 'fausses couleurs'], availability: 'Gratuit',
  },
  {
    id: 'gamut-limiter', name: 'Gamut Limiter', pages: ['Edit', 'Color'], category: 'Couleur',
    summary: 'Ramène les couleurs hors gamut dans une plage compatible avec la diffusion choisie.',
    usage: 'Évite des couleurs impossibles ou illégales lors d’une livraison broadcast.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Color → Gamut Limiter',
    keywords: ['gamut', 'broadcast safe', 'légal', 'livraison'], availability: 'Gratuit',
  },
  {
    id: 'chromatic-adaptation', name: 'Chromatic Adaptation', pages: ['Edit', 'Color'], category: 'Couleur',
    summary: 'Corrige une dominante en adaptant le point blanc entre deux illuminants.',
    usage: 'Utile pour neutraliser un éclairage trop chaud, froid ou teinté.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Color → Chromatic Adaptation',
    keywords: ['balance des blancs', 'white balance', 'illuminant', 'dominante'], availability: 'Gratuit',
  },
  {
    id: 'film-look-creator', name: 'Film Look Creator', pages: ['Edit', 'Color'], category: 'Look cinéma',
    summary: 'Combine plusieurs caractéristiques photochimiques pour construire un rendu film.',
    usage: 'Centralise contraste, couleur, halation, grain et autres réglages de look cinéma.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Film Look → Film Look Creator',
    keywords: ['film look', 'cinéma', 'pellicule', 'analogique'], availability: 'Studio',
  },
  {
    id: 'film-grain', name: 'Film Grain', pages: ['Edit', 'Color'], category: 'Look cinéma',
    summary: 'Ajoute un grain organique inspiré de différents formats de pellicule.',
    usage: 'Réduit l’aspect numérique et aide à intégrer des éléments composites.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Texture → Film Grain',
    keywords: ['grain', 'pellicule', '35mm', '16mm', 'texture'], availability: 'Studio',
  },
  {
    id: 'halation', name: 'Halation', pages: ['Edit', 'Color'], category: 'Look cinéma',
    summary: 'Crée un léger halo coloré autour des hautes lumières comme sur une pellicule.',
    usage: 'Renforce un rendu argentique, surtout autour des sources lumineuses et contre-jours.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Film Look → Halation',
    keywords: ['halo rouge', 'pellicule', 'argentique', 'highlight'], availability: 'Studio',
  },
  {
    id: 'analog-damage', name: 'Analog Damage', pages: ['Cut', 'Edit', 'Color'], category: 'Stylisation',
    summary: 'Imite les défauts d’une vidéo analogique : bruit, instabilité et décalages.',
    usage: 'Crée un look VHS, télévision ancienne ou signal vidéo dégradé.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Stylize → Analog Damage',
    keywords: ['VHS', 'glitch', 'télévision', 'cassette', 'retro'], availability: 'Gratuit',
  },
  {
    id: 'scanlines', name: 'Scanlines', pages: ['Cut', 'Edit', 'Color'], category: 'Stylisation',
    summary: 'Superpose des lignes de balayage rappelant un écran cathodique.',
    usage: 'Convient aux looks CRT, écrans de contrôle et interfaces rétro.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Stylize → Scanlines',
    keywords: ['CRT', 'écran', 'retro', 'lignes', 'monitor'], availability: 'Gratuit',
  },
  {
    id: 'edge-detect', name: 'Edge Detect', pages: ['Cut', 'Edit', 'Color'], category: 'Stylisation',
    summary: 'Détecte et affiche les contours contrastés présents dans l’image.',
    usage: 'Produit un dessin technique, un contour lumineux ou un masque de détail.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Stylize → Edge Detect',
    keywords: ['contours', 'outline', 'dessin', 'edges'], availability: 'Gratuit',
  },
  {
    id: 'emboss', name: 'Emboss', pages: ['Cut', 'Edit', 'Color'], category: 'Stylisation',
    summary: 'Transforme les contrastes en relief comme une image gravée.',
    usage: 'S’utilise pour un effet métallique, une texture en relief ou un graphisme abstrait.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Stylize → Emboss',
    keywords: ['relief', 'gravure', 'métal', 'texture'], availability: 'Gratuit',
  },
  {
    id: 'dead-pixel-fixer', name: 'Dead Pixel Fixer', pages: ['Edit', 'Color'], category: 'Restauration',
    summary: 'Remplace un pixel mort ou bloqué par les pixels qui l’entourent.',
    usage: 'Corrige les petits défauts fixes provenant directement du capteur.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Revival → Dead Pixel Fixer',
    keywords: ['pixel mort', 'capteur', 'hot pixel', 'repair'], availability: 'Studio',
  },
  {
    id: 'dust-buster', name: 'Dust Buster', pages: ['Edit', 'Color'], category: 'Restauration',
    summary: 'Supprime ponctuellement poussières, taches et petits défauts d’une image.',
    usage: 'Particulièrement utile pour restaurer des scans de film ou nettoyer un capteur sale.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Revival → Dust Buster',
    keywords: ['poussière', 'tache', 'restauration', 'film scan'], availability: 'Studio',
  },
  {
    id: 'deflicker', name: 'Deflicker', pages: ['Edit', 'Color'], category: 'Restauration',
    summary: 'Réduit les variations rapides de luminosité entre les images.',
    usage: 'Corrige un éclairage qui scintille, certains timelapses ou des archives instables.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Revival → Deflicker',
    keywords: ['flicker', 'scintillement', 'timelapse', 'lumière'], availability: 'Studio',
  },
  {
    id: 'object-removal', name: 'Object Removal', pages: ['Edit', 'Color'], category: 'Restauration',
    summary: 'Reconstruit le fond afin de masquer un objet suivi dans le plan.',
    usage: 'Peut retirer un élément gênant, un câble, un panneau ou une petite personne au fond.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Revival → Object Removal',
    keywords: ['supprimer objet', 'clean plate', 'remove', 'effacer'], availability: 'Studio',
  },
  {
    id: 'patch-replacer', name: 'Patch Replacer', pages: ['Edit', 'Color'], category: 'Restauration',
    summary: 'Copie une zone propre de l’image sur une zone à corriger.',
    usage: 'Masque un logo, un bouton, une poussière ou une petite imperfection.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Revival → Patch Replacer',
    keywords: ['clone', 'tampon', 'retouche', 'logo', 'patch'], availability: 'Gratuit',
  },
  {
    id: 'sharpen', name: 'Sharpen', pages: ['Cut', 'Edit', 'Color'], category: 'Netteté',
    summary: 'Renforce les contours pour donner une impression d’image plus nette.',
    usage: 'Compense légèrement une image douce, avec modération pour éviter les halos.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Sharpen → Sharpen',
    keywords: ['netteté', 'sharp', 'détail', 'piqué'], availability: 'Gratuit',
  },
  {
    id: 'texture-pop', name: 'Texture Pop', pages: ['Edit', 'Color'], category: 'Netteté',
    summary: 'Augmente ou diminue le microcontraste des détails et textures.',
    usage: 'Renforce une matière, un paysage ou adoucit subtilement une peau.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Texture → Texture Pop',
    keywords: ['microcontraste', 'texture', 'détail', 'peau'], availability: 'Studio',
  },
  {
    id: 'beauty', name: 'Beauty', pages: ['Edit', 'Color'], category: 'Peau et portrait',
    summary: 'Lisse sélectivement la peau tout en essayant de préserver les détails importants.',
    usage: 'Sert aux retouches de portrait, de beauté et d’interview.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Refine → Beauty',
    keywords: ['skin', 'peau', 'visage', 'lissage', 'portrait'], availability: 'Studio',
  },
  {
    id: 'face-refinement', name: 'Face Refinement', pages: ['Edit', 'Color'], category: 'Peau et portrait',
    summary: 'Analyse un visage et fournit des réglages ciblés pour ses différentes zones.',
    usage: 'Permet d’ajuster peau, yeux, lèvres et détails du visage à partir d’un suivi automatique.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Refine → Face Refinement',
    keywords: ['face', 'visage', 'beauty', 'tracking', 'retouche'], availability: 'Studio',
  },
  {
    id: 'magic-mask', name: 'Magic Mask', pages: ['Edit', 'Color'], category: 'Détourage et masques',
    summary: 'Isole automatiquement une personne, un objet ou une zone et suit son mouvement.',
    usage: 'Accélère les corrections locales, les changements de fond et les effets sélectifs.',
    path: 'Page Color → palette Magic Mask, ou outil disponible dans les versions compatibles',
    keywords: ['détourage', 'rotoscopie', 'personne', 'objet', 'AI', 'mask'], availability: 'Studio',
  },
  {
    id: 'depth-map', name: 'Depth Map', pages: ['Edit', 'Color'], category: 'Détourage et masques',
    summary: 'Estime la profondeur de la scène et génère un masque du proche vers le lointain.',
    usage: 'Sépare rapidement un premier plan, ajoute une brume ou module un effet selon la distance.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Generate → Depth Map',
    keywords: ['profondeur', 'depth', 'premier plan', 'arrière-plan', 'AI'], availability: 'Studio',
  },
  {
    id: 'camera-shake', name: 'Camera Shake', pages: ['Cut', 'Edit', 'Color'], category: 'Mouvement',
    summary: 'Ajoute un mouvement de caméra procédural à une image trop stable.',
    usage: 'Simule une caméra portée, un choc ou une vibration contrôlée.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Transform → Camera Shake',
    keywords: ['tremblement', 'handheld', 'vibration', 'shake'], availability: 'Gratuit',
  },
  {
    id: 'lens-distortion', name: 'Lens Distortion', pages: ['Edit', 'Color'], category: 'Déformation',
    summary: 'Corrige ou crée une déformation en barillet ou en coussinet.',
    usage: 'Redresse un objectif grand-angle ou accentue volontairement une optique extrême.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Warp → Lens Distortion',
    keywords: ['barrel', 'pincushion', 'objectif', 'grand angle', 'warp'], availability: 'Gratuit',
  },
  {
    id: 'grid-warp', name: 'Grid Warp', pages: ['Edit', 'Color'], category: 'Déformation',
    summary: 'Déforme l’image à l’aide d’une grille dont les points peuvent être déplacés.',
    usage: 'Remodèle localement un objet, un visage ou un élément graphique.',
    path: 'Bibliothèque d’effets → Open FX → Resolve FX Warp → Grid Warp',
    keywords: ['grille', 'déformer', 'mesh', 'warp', 'remodeler'], availability: 'Studio',
  },

  // Fusion tools
  {
    id: 'fusion-blur', name: 'Blur', pages: ['Fusion'], category: 'Flous',
    summary: 'Floute une image dans Fusion avec un contrôle séparé horizontal et vertical.',
    usage: 'S’utilise pour adoucir un élément, créer une profondeur ou préparer un masque.',
    path: 'Fusion → Effects Library → Tools → Blur → Blur',
    keywords: ['node', 'flou', 'blur', 'soften'], availability: 'Gratuit',
  },
  {
    id: 'fusion-defocus', name: 'Defocus', pages: ['Fusion'], category: 'Flous',
    summary: 'Simule une image hors mise au point avec un diaphragme réglable.',
    usage: 'Crée une profondeur de champ crédible ou un bokeh dans un composite.',
    path: 'Fusion → Effects Library → Tools → Blur → Defocus',
    keywords: ['défocus', 'bokeh', 'focus', 'profondeur de champ'], availability: 'Gratuit',
  },
  {
    id: 'fusion-vari-blur', name: 'VariBlur', pages: ['Fusion'], category: 'Flous',
    summary: 'Fait varier la quantité de flou à partir d’une seconde image de contrôle.',
    usage: 'Permet un flou progressif, piloté par un masque ou une carte de profondeur.',
    path: 'Fusion → Effects Library → Tools → Blur → VariBlur',
    keywords: ['variable blur', 'depth map', 'masque', 'gradient'], availability: 'Gratuit',
  },
  {
    id: 'fusion-delta-keyer', name: 'Delta Keyer', pages: ['Fusion'], category: 'Keying',
    summary: 'Supprime un fond vert ou bleu et génère un canal alpha propre.',
    usage: 'C’est le keyer principal pour incruster un sujet filmé sur chroma key.',
    path: 'Fusion → Effects Library → Tools → Matte → Delta Keyer',
    keywords: ['fond vert', 'green screen', 'chroma key', 'détourage', 'alpha'], availability: 'Gratuit',
  },
  {
    id: 'fusion-luma-keyer', name: 'Luma Keyer', pages: ['Fusion'], category: 'Keying',
    summary: 'Crée une transparence en fonction de la luminosité de l’image.',
    usage: 'Isole rapidement les zones claires ou sombres, comme de la fumée sur fond noir.',
    path: 'Fusion → Effects Library → Tools → Matte → Luma Keyer',
    keywords: ['luminance', 'alpha', 'noir', 'blanc', 'matte'], availability: 'Gratuit',
  },
  {
    id: 'fusion-ultra-keyer', name: 'Ultra Keyer', pages: ['Fusion'], category: 'Keying',
    summary: 'Effectue une incrustation chromatique rapide avec des réglages simplifiés.',
    usage: 'Convient à un fond vert ou bleu propre lorsqu’un réglage immédiat suffit.',
    path: 'Fusion → Effects Library → Tools → Matte → Ultra Keyer',
    keywords: ['green screen', 'fond vert', 'chroma', 'key'], availability: 'Gratuit',
  },
  {
    id: 'fusion-merge', name: 'Merge', pages: ['Fusion'], category: 'Composition',
    summary: 'Superpose un premier plan sur un arrière-plan dans le flux de nodes.',
    usage: 'C’est le node central pour assembler images, textes, masques et rendus 2D.',
    path: 'Fusion → Effects Library → Tools → Composite → Merge',
    keywords: ['composite', 'superposer', 'foreground', 'background', 'node'], availability: 'Gratuit',
  },
  {
    id: 'fusion-channel-booleans', name: 'Channel Booleans', pages: ['Fusion'], category: 'Composition',
    summary: 'Combine, copie ou réorganise mathématiquement les canaux RGBA de deux images.',
    usage: 'Sert à reconstruire un alpha, extraire un canal ou effectuer des opérations de compositing.',
    path: 'Fusion → Effects Library → Tools → Composite → Channel Booleans',
    keywords: ['RGBA', 'alpha', 'channels', 'canaux', 'boolean'], availability: 'Gratuit',
  },
  {
    id: 'fusion-planar-tracker', name: 'Planar Tracker', pages: ['Fusion'], category: 'Tracking',
    summary: 'Suit une surface plane qui change de perspective dans le plan.',
    usage: 'Parfait pour remplacer un écran, coller un logo ou stabiliser une surface.',
    path: 'Fusion → Effects Library → Tools → Tracking → Planar Tracker',
    keywords: ['suivi planaire', 'screen replacement', 'écran', 'corner pin'], availability: 'Gratuit',
  },
  {
    id: 'fusion-tracker', name: 'Tracker', pages: ['Fusion'], category: 'Tracking',
    summary: 'Suit un ou plusieurs points contrastés à travers le temps.',
    usage: 'Attache un graphisme à un mouvement, stabilise un plan ou calcule une trajectoire.',
    path: 'Fusion → Effects Library → Tools → Tracking → Tracker',
    keywords: ['point tracker', 'suivi', 'stabilisation', 'match move'], availability: 'Gratuit',
  },
  {
    id: 'fusion-camera-tracker', name: 'Camera Tracker', pages: ['Fusion'], category: 'Tracking',
    summary: 'Analyse le mouvement 2D pour reconstruire une caméra et un espace 3D.',
    usage: 'Intègre des objets 3D ou des textes avec la perspective d’une caméra réelle.',
    path: 'Fusion → Effects Library → Tools → Tracking → Camera Tracker',
    keywords: ['3D tracking', 'matchmove', 'caméra', 'solve'], availability: 'Studio',
  },
  {
    id: 'fusion-paint', name: 'Paint', pages: ['Fusion'], category: 'Peinture et retouche',
    summary: 'Permet de peindre, cloner ou effacer directement sur l’image avec des traits animables.',
    usage: 'Retouche un élément, supprime un câble ou crée une animation dessinée.',
    path: 'Fusion → Effects Library → Tools → Paint → Paint',
    keywords: ['paint', 'clone', 'retouche', 'pinceau', 'wire removal'], availability: 'Gratuit',
  },
  {
    id: 'fusion-polygon', name: 'Polygon', pages: ['Fusion'], category: 'Masques',
    summary: 'Crée un masque vectoriel point par point, animable dans le temps.',
    usage: 'Détoure une forme précise, limite un effet ou réalise une rotoscopie.',
    path: 'Fusion → Effects Library → Tools → Mask → Polygon',
    keywords: ['mask', 'masque', 'rotoscopie', 'détourage', 'spline'], availability: 'Gratuit',
  },
  {
    id: 'fusion-bspline', name: 'B-Spline', pages: ['Fusion'], category: 'Masques',
    summary: 'Crée un masque aux courbes souples avec moins de points de contrôle.',
    usage: 'Facilite les détourages organiques et les formes très arrondies.',
    path: 'Fusion → Effects Library → Tools → Mask → B-Spline',
    keywords: ['mask', 'courbe', 'organic', 'rotoscopie'], availability: 'Gratuit',
  },
  {
    id: 'fusion-text-plus', name: 'Text+', pages: ['Edit', 'Fusion'], category: 'Titres et graphisme',
    summary: 'Crée un texte avancé avec animation, mise en forme et shading multiples.',
    usage: 'Produit des titres, génériques, habillages et animations typographiques.',
    path: 'Effects Library → Titles → Text+ ou Fusion → Tools → Text → Text+',
    keywords: ['texte', 'titre', 'typographie', 'title', 'motion design'], availability: 'Gratuit',
  },
  {
    id: 'fusion-particle-emitter', name: 'pEmitter', pages: ['Fusion'], category: 'Particules',
    summary: 'Génère des particules dont on règle quantité, vitesse, direction et apparence.',
    usage: 'Crée pluie, neige, poussière, étincelles, fumée stylisée ou essaims.',
    path: 'Fusion → Effects Library → Tools → Particles → pEmitter',
    keywords: ['particles', 'particules', 'neige', 'pluie', 'étincelles'], availability: 'Gratuit',
  },
  {
    id: 'fusion-particle-renderer', name: 'pRender', pages: ['Fusion'], category: 'Particules',
    summary: 'Transforme un flux de particules Fusion en image visible.',
    usage: 'Se place à la fin d’un système de particules pour rendre son résultat 2D ou 3D.',
    path: 'Fusion → Effects Library → Tools → Particles → pRender',
    keywords: ['particles', 'render', 'particules', 'rendu'], availability: 'Gratuit',
  },
  {
    id: 'fusion-image-plane-3d', name: 'Image Plane 3D', pages: ['Fusion'], category: '3D',
    summary: 'Place une image ou une vidéo sur un plan dans l’espace 3D.',
    usage: 'Intègre des écrans, matte paintings, cartes ou éléments 2D dans une scène 3D.',
    path: 'Fusion → Effects Library → Tools → 3D → Image Plane 3D',
    keywords: ['3D', 'plan', 'texture', 'image plane'], availability: 'Gratuit',
  },
  {
    id: 'fusion-renderer-3d', name: 'Renderer 3D', pages: ['Fusion'], category: '3D',
    summary: 'Convertit une scène Fusion 3D en image 2D compositable.',
    usage: 'Finalise caméra, lumières, matériaux et géométrie avant un Merge 2D.',
    path: 'Fusion → Effects Library → Tools → 3D → Renderer 3D',
    keywords: ['3D', 'rendu', 'renderer', 'caméra'], availability: 'Gratuit',
  },
  {
    id: 'fusion-displace', name: 'Displace', pages: ['Fusion'], category: 'Déformation',
    summary: 'Déplace les pixels d’une image à partir des valeurs d’une autre image.',
    usage: 'Crée des ondulations, une réfraction, une chaleur ou des déformations organiques.',
    path: 'Fusion → Effects Library → Tools → Warp → Displace',
    keywords: ['déplacement', 'distortion', 'heat haze', 'réfraction'], availability: 'Gratuit',
  },
  {
    id: 'fusion-grid-warp', name: 'Grid Warp', pages: ['Fusion'], category: 'Déformation',
    summary: 'Déforme une image en manipulant les points d’une grille.',
    usage: 'Adapte une texture à une surface ou remodèle localement une forme.',
    path: 'Fusion → Effects Library → Tools → Warp → Grid Warp',
    keywords: ['warp', 'grille', 'mesh', 'morphing'], availability: 'Gratuit',
  },
  {
    id: 'fusion-color-corrector', name: 'Color Corrector', pages: ['Fusion'], category: 'Couleur',
    summary: 'Corrige balance, contraste, saturation et teintes au sein d’un composite.',
    usage: 'Harmonise un élément incrusté avec le fond ou crée un look local.',
    path: 'Fusion → Effects Library → Tools → Color → Color Corrector',
    keywords: ['color', 'couleur', 'contraste', 'saturation', 'match'], availability: 'Gratuit',
  },
  {
    id: 'fusion-optical-flow', name: 'Optical Flow', pages: ['Fusion'], category: 'Temps',
    summary: 'Analyse le mouvement des pixels entre les images pour créer des vecteurs de mouvement.',
    usage: 'Prépare un ralenti interpolé, un motion blur ou d’autres traitements temporels.',
    path: 'Fusion → Effects Library → Tools → Optical Flow → Optical Flow',
    keywords: ['ralenti', 'slow motion', 'motion vectors', 'interpolation'], availability: 'Gratuit',
  },
  {
    id: 'fusion-time-stretcher', name: 'Time Stretcher', pages: ['Fusion'], category: 'Temps',
    summary: 'Permet de choisir ou d’animer précisément l’image source affichée à chaque instant.',
    usage: 'Crée arrêts sur image, remappages temporels et animations pilotées image par image.',
    path: 'Fusion → Effects Library → Tools → Time → Time Stretcher',
    keywords: ['retime', 'temps', 'freeze frame', 'remappage'], availability: 'Gratuit',
  },

  // Color-specific tools and effects
  {
    id: 'color-noise-reduction', name: 'Temporal Noise Reduction', pages: ['Color'], category: 'Réduction de bruit',
    summary: 'Compare plusieurs images successives pour distinguer le bruit du mouvement réel.',
    usage: 'Nettoie efficacement un plan sombre ou tourné à haute sensibilité.',
    path: 'Page Color → palette Motion Effects → Temporal Noise Reduction',
    keywords: ['denoise', 'bruit', 'noise reduction', 'ISO', 'temporel'], availability: 'Studio',
  },
  {
    id: 'color-spatial-noise-reduction', name: 'Spatial Noise Reduction', pages: ['Color'], category: 'Réduction de bruit',
    summary: 'Réduit le bruit en analysant les pixels voisins dans chaque image.',
    usage: 'Complète la réduction temporelle ou traite un plan sans mouvement exploitable.',
    path: 'Page Color → palette Motion Effects → Spatial Noise Reduction',
    keywords: ['denoise', 'bruit spatial', 'chroma noise', 'luma noise'], availability: 'Studio',
  },
  {
    id: 'color-node-mixer', name: 'Layer Mixer', pages: ['Color'], category: 'Nodes et composition',
    summary: 'Mélange plusieurs corrections de nodes comme des calques superposés.',
    usage: 'Combine des looks, des mattes ou des traitements avec différents modes de fusion.',
    path: 'Page Color → clic droit dans les nodes → Add Node → Add Layer Mixer',
    keywords: ['nodes', 'mixer', 'calques', 'blend mode'], availability: 'Gratuit',
  },
  {
    id: 'color-parallel-mixer', name: 'Parallel Mixer', pages: ['Color'], category: 'Nodes et composition',
    summary: 'Applique plusieurs corrections en parallèle à partir de la même image source.',
    usage: 'Évite qu’une correction influence l’entrée de la suivante et facilite des grades indépendants.',
    path: 'Page Color → clic droit dans les nodes → Add Node → Add Parallel Mixer',
    keywords: ['nodes', 'parallel', 'mixer', 'correction'], availability: 'Gratuit',
  },
  {
    id: 'color-tracker', name: 'Tracker', pages: ['Color'], category: 'Tracking',
    summary: 'Suit le déplacement d’une fenêtre ou d’un masque dans le plan.',
    usage: 'Maintient une correction locale sur un visage, un objet ou une zone en mouvement.',
    path: 'Page Color → palette Tracker',
    keywords: ['suivi', 'power window', 'masque', 'tracking'], availability: 'Gratuit',
  },
  {
    id: 'color-stabilizer', name: 'Stabilizer', pages: ['Color'], category: 'Tracking',
    summary: 'Analyse le mouvement de caméra afin de réduire les secousses du plan.',
    usage: 'Stabilise une caméra portée ou lisse un mouvement irrégulier.',
    path: 'Page Color → palette Tracker → mode Stabilizer',
    keywords: ['stabilisation', 'shake', 'caméra', 'lisser'], availability: 'Gratuit',
  },

  // Fairlight FX
  {
    id: 'fairlight-dialogue-processor', name: 'Dialogue Processor', pages: ['Fairlight'], category: 'Dialogue',
    summary: 'Réunit plusieurs traitements essentiels pour rendre une voix plus claire et régulière.',
    usage: 'Accélère le nettoyage d’une interview, d’une voix off ou d’un dialogue de fiction.',
    path: 'Fairlight → Effects Library → Fairlight FX → Dialogue Processor',
    keywords: ['voix', 'dialogue', 'speech', 'interview', 'voice over'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-voice-isolation', name: 'Voice Isolation', pages: ['Fairlight'], category: 'Dialogue',
    summary: 'Met la voix en avant en atténuant automatiquement les sons environnants.',
    usage: 'Aide sur une interview enregistrée dans un lieu bruyant ou réverbérant.',
    path: 'Fairlight → Inspector ou Mixer → Voice Isolation',
    keywords: ['isoler voix', 'bruit de fond', 'AI', 'speech', 'dialogue'], availability: 'Studio',
  },
  {
    id: 'fairlight-dialogue-leveler', name: 'Dialogue Leveler', pages: ['Fairlight'], category: 'Dialogue',
    summary: 'Uniformise automatiquement le niveau d’une voix trop variable.',
    usage: 'Réduit les écarts entre passages faibles et forts avant le mixage final.',
    path: 'Fairlight → Inspector ou Mixer → Dialogue Leveler',
    keywords: ['niveau voix', 'level', 'volume', 'dialogue'], availability: 'Studio',
  },
  {
    id: 'fairlight-de-esser', name: 'De-Esser', pages: ['Fairlight'], category: 'Nettoyage audio',
    summary: 'Atténue les sifflantes agressives produites par les sons « s » et « ch ».',
    usage: 'Adoucit une voix trop sifflante sans réduire toute sa brillance.',
    path: 'Fairlight → Effects Library → Fairlight FX → De-Esser',
    keywords: ['sifflantes', 'sibilance', 'voix', 'ess'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-de-hummer', name: 'De-Hummer', pages: ['Fairlight'], category: 'Nettoyage audio',
    summary: 'Supprime un ronflement électrique et ses harmoniques.',
    usage: 'Corrige un bourdonnement secteur à 50 ou 60 Hz dans un enregistrement.',
    path: 'Fairlight → Effects Library → Fairlight FX → De-Hummer',
    keywords: ['hum', 'ronflement', '50Hz', '60Hz', 'électricité'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-noise-reduction', name: 'Noise Reduction', pages: ['Fairlight'], category: 'Nettoyage audio',
    summary: 'Apprend un profil de bruit puis réduit les sons qui lui ressemblent.',
    usage: 'Nettoie souffle, ventilation ou bruit ambiant relativement constant.',
    path: 'Fairlight → Effects Library → Fairlight FX → Noise Reduction',
    keywords: ['denoise', 'souffle', 'ventilation', 'bruit de fond', 'learn'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-stereo-fixer', name: 'Stereo Fixer', pages: ['Fairlight'], category: 'Nettoyage audio',
    summary: 'Corrige ou réorganise les canaux gauche et droit d’un signal stéréo.',
    usage: 'Répare une phase inversée, un canal manquant ou un enregistrement mal câblé.',
    path: 'Fairlight → Effects Library → Fairlight FX → Stereo Fixer',
    keywords: ['stéréo', 'phase', 'left right', 'canaux'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-equalizer', name: 'Equalizer', pages: ['Fairlight'], category: 'Égalisation',
    summary: 'Augmente ou réduit des plages de fréquences précises du son.',
    usage: 'Éclaircit une voix, enlève un grondement ou équilibre un instrument.',
    path: 'Fairlight → Mixer → double-clic dans la zone EQ',
    keywords: ['EQ', 'fréquences', 'grave', 'aigu', 'filtre'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-compressor', name: 'Compressor', pages: ['Fairlight'], category: 'Dynamique',
    summary: 'Réduit les écarts de niveau en atténuant les sons qui dépassent un seuil.',
    usage: 'Stabilise une voix, donne de la densité ou contrôle les crêtes d’un instrument.',
    path: 'Fairlight → Mixer → Dynamics → Compressor',
    keywords: ['compression', 'dynamique', 'threshold', 'ratio', 'niveau'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-limiter', name: 'Limiter', pages: ['Fairlight'], category: 'Dynamique',
    summary: 'Empêche le signal de dépasser un niveau maximal défini.',
    usage: 'Protège contre les crêtes et sécurise le niveau de sortie du mix.',
    path: 'Fairlight → Mixer → Dynamics → Limiter',
    keywords: ['limiteur', 'peak', 'crête', 'niveau', 'master'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-expander-gate', name: 'Expander / Gate', pages: ['Fairlight'], category: 'Dynamique',
    summary: 'Atténue ou coupe le signal lorsqu’il descend sous un seuil.',
    usage: 'Réduit les bruits entre les phrases ou sépare mieux les frappes d’une batterie.',
    path: 'Fairlight → Mixer → Dynamics → Expander/Gate',
    keywords: ['gate', 'expander', 'porte', 'silence', 'bruit'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-multiband-compressor', name: 'Multiband Compressor', pages: ['Fairlight'], category: 'Dynamique',
    summary: 'Compresse séparément plusieurs bandes de fréquences.',
    usage: 'Contrôle un grave envahissant, adoucit un aigu agressif ou finalise un mix.',
    path: 'Fairlight → Effects Library → Fairlight FX → Multiband Compressor',
    keywords: ['multibande', 'mastering', 'compression', 'fréquences'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-reverb', name: 'Reverb', pages: ['Fairlight'], category: 'Espace et ambiance',
    summary: 'Simule les réflexions d’un espace et donne une sensation de profondeur.',
    usage: 'Place une voix dans une pièce, une salle, une église ou un espace artificiel.',
    path: 'Fairlight → Effects Library → Fairlight FX → Reverb',
    keywords: ['réverbération', 'room', 'hall', 'ambiance', 'espace'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-echo', name: 'Echo', pages: ['Fairlight'], category: 'Espace et ambiance',
    summary: 'Répète le son après un délai réglable avec une décroissance progressive.',
    usage: 'Crée un écho réaliste, rythmique ou un effet vocal stylisé.',
    path: 'Fairlight → Effects Library → Fairlight FX → Echo',
    keywords: ['delay', 'écho', 'répétition', 'feedback'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-chorus', name: 'Chorus', pages: ['Fairlight'], category: 'Modulation',
    summary: 'Duplique et module légèrement le son pour donner une impression de largeur.',
    usage: 'Épaissit une voix, une guitare ou un synthétiseur.',
    path: 'Fairlight → Effects Library → Fairlight FX → Chorus',
    keywords: ['largeur', 'doublage', 'modulation', 'voix'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-flanger', name: 'Flanger', pages: ['Fairlight'], category: 'Modulation',
    summary: 'Mélange le signal avec une copie très légèrement retardée et modulée.',
    usage: 'Produit un balayage métallique ou aérien sur voix, musique et effets sonores.',
    path: 'Fairlight → Effects Library → Fairlight FX → Flanger',
    keywords: ['jet', 'sweep', 'modulation', 'métallique'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-pitch', name: 'Pitch', pages: ['Fairlight'], category: 'Hauteur et voix',
    summary: 'Modifie la hauteur du son sans nécessairement changer sa durée.',
    usage: 'Corrige ou transforme une voix, transpose un son et crée des variations.',
    path: 'Fairlight → Effects Library → Fairlight FX → Pitch',
    keywords: ['hauteur', 'transpose', 'voix grave', 'voix aiguë', 'pitch shift'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-vocal-channel', name: 'Vocal Channel', pages: ['Fairlight'], category: 'Hauteur et voix',
    summary: 'Regroupe plusieurs traitements conçus pour façonner rapidement une voix.',
    usage: 'Fournit une chaîne simple pour nettoyer, égaliser et contrôler une piste vocale.',
    path: 'Fairlight → Effects Library → Fairlight FX → Vocal Channel',
    keywords: ['voix', 'vocal', 'channel strip', 'dialogue', 'chant'], availability: 'Gratuit',
  },
  {
    id: 'fairlight-music-remixer', name: 'Music Remixer', pages: ['Fairlight'], category: 'Musique',
    summary: 'Sépare les principaux éléments d’un morceau pour ajuster leur niveau indépendamment.',
    usage: 'Baisse la voix d’une chanson, renforce la batterie ou adapte une musique au montage.',
    path: 'Fairlight → Inspector ou Effects Library → Music Remixer',
    keywords: ['stems', 'musique', 'voix', 'batterie', 'basse', 'AI'], availability: 'Studio',
  },
];

export function normalizeEffectSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

export function effectMatchesQuery(effect: DavinciEffect, query: string): boolean {
  const normalizedQuery = normalizeEffectSearch(query);
  if (!normalizedQuery) return true;
  const nameTokens = normalizeEffectSearch(effect.name).split(/[^a-z0-9]+/).filter(Boolean);
  const contentTokens = normalizeEffectSearch([
    effect.category,
    effect.summary,
    effect.usage,
    effect.path,
    ...effect.pages,
    ...effect.keywords,
  ].join(' ')).split(/[^a-z0-9]+/).filter(Boolean);

  return normalizedQuery.split(/\s+/).every(word =>
    contentTokens.includes(word) || nameTokens.some(token => token.startsWith(word))
  );
}

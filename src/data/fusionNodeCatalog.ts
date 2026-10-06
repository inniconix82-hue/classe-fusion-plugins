import { normalizeEffectSearch } from './effectCatalog';

export interface FusionNodeCategory {
  id: string;
  english: string;
  french: string;
  icon: string;
}

export interface FusionNode {
  id: string;
  name: string;
  category: string;
  summary: string;
  usage: string;
  keywords: string[];
  availability?: 'Gratuit' | 'Studio';
}

export const FUSION_NODE_CATEGORIES: FusionNodeCategory[] = [
  { id: 'io', english: 'I/O', french: 'Entrées et sorties', icon: '⇄' },
  { id: 'composite', english: 'Composite', french: 'Composition', icon: '◫' },
  { id: 'creator', english: 'Creator', french: 'Générateurs', icon: '✦' },
  { id: 'color', english: 'Color', french: 'Couleur', icon: '◉' },
  { id: 'blur', english: 'Blur', french: 'Flous et netteté', icon: '◌' },
  { id: 'mask', english: 'Mask', french: 'Masques', icon: '⬡' },
  { id: 'matte', english: 'Matte', french: 'Détourage et alpha', icon: '◆' },
  { id: 'tracker', english: 'Tracker', french: 'Suivi', icon: '⌖' },
  { id: 'transform', english: 'Transform', french: 'Transformation', icon: '↗' },
  { id: 'warp', english: 'Warp', french: 'Déformation', icon: '〰' },
  { id: 'paint', english: 'Paint', french: 'Peinture et retouche', icon: '✎' },
  { id: 'text', english: 'Text', french: 'Texte', icon: 'T' },
  { id: 'particle', english: 'Particle', french: 'Particules', icon: '⁙' },
  { id: '3d', english: '3D', french: 'Scène 3D', icon: '◇' },
  { id: 'material3d', english: '3D Material', french: 'Matériaux 3D', icon: '◈' },
  { id: 'optical-flow', english: 'Optical Flow', french: 'Flux optique', icon: '≈' },
  { id: 'time', english: 'Time', french: 'Temps', icon: '◷' },
  { id: 'utility', english: 'Miscellaneous', french: 'Utilitaires', icon: '⚙' },
];

type NodeSeed = [name: string, category: string, summary: string, usage: string, keywords?: string[], availability?: 'Gratuit' | 'Studio'];

const NODE_SEEDS: NodeSeed[] = [
  ['MediaIn', 'io', 'Fournit à la composition un plan provenant de la timeline ou du Media Pool.', 'C’est généralement le point de départ d’une composition dans DaVinci Resolve.', ['entrée', 'source', 'clip']],
  ['MediaOut', 'io', 'Envoie le résultat final de Fusion vers la timeline.', 'Placez-le à la fin du flow pour que le composite apparaisse dans Edit et Deliver.', ['sortie', 'rendu', 'timeline']],
  ['Loader', 'io', 'Charge une image fixe, une séquence ou un média depuis un fichier.', 'S’emploie surtout dans Fusion Studio ou pour une source externe.', ['charger', 'fichier', 'image']],
  ['Saver', 'io', 'Écrit le résultat d’une branche Fusion dans un fichier.', 'Permet un rendu intermédiaire ou une sortie distincte dans Fusion Studio.', ['sauvegarder', 'export', 'rendu']],

  ['Merge', 'composite', 'Superpose un premier plan sur un arrière-plan.', 'C’est le node central pour assembler deux images 2D et régler leur mode de fusion.', ['fusionner', 'foreground', 'background', 'calque']],
  ['Dissolve', 'composite', 'Mélange progressivement deux entrées avec un curseur.', 'Crée une transition ou permet de choisir entre deux branches du flow.', ['fondu', 'transition', 'mélange']],
  ['Channel Booleans', 'composite', 'Combine, copie ou calcule les canaux RGBA de plusieurs images.', 'Sert à reconstruire un alpha, permuter des canaux ou fabriquer une passe technique.', ['canaux', 'rgba', 'alpha']],
  ['Matte Control', 'composite', 'Ajuste l’alpha et les bords d’un matte déjà créé.', 'Permet de contracter, dilater, nettoyer ou combiner un détourage.', ['alpha', 'matte', 'bord']],
  ['Alpha Divide', 'composite', 'Divise les couleurs par le canal alpha.', 'Corrige certains traitements sur des images prémultipliées avant une opération couleur.', ['premultiply', 'alpha', 'prémultiplication']],
  ['Alpha Multiply', 'composite', 'Multiplie les couleurs par le canal alpha.', 'Rétablit la prémultiplication après une correction effectuée sur les couleurs seules.', ['premultiply', 'alpha', 'prémultiplication']],

  ['Background', 'creator', 'Génère une image unie ou un dégradé avec un canal alpha.', 'Crée un fond, une couleur, une forme masquée ou la toile d’un graphisme.', ['fond', 'couleur', 'gradient']],
  ['Fast Noise', 'creator', 'Produit un bruit procédural animé et réglable.', 'Sert aux nuages, fumées, textures, déplacements et variations organiques.', ['bruit', 'texture', 'fumée', 'nuage']],
  ['Checkerboard', 'creator', 'Génère un motif régulier en damier.', 'Utile comme texture, repère de déformation ou fond graphique.', ['damier', 'motif', 'grille']],
  ['Day Sky', 'creator', 'Crée un ciel procédural avec soleil, atmosphère et nuages.', 'Fournit rapidement un environnement de ciel pour un composite ou une scène 3D.', ['ciel', 'soleil', 'nuages']],
  ['Plasma', 'creator', 'Génère une texture colorée fluide de type plasma.', 'Produit des fonds abstraits, des matières animées ou des cartes de déplacement.', ['texture', 'abstrait', 'animation']],
  ['Mandelbrot', 'creator', 'Génère une fractale de Mandelbrot paramétrable.', 'Crée des motifs mathématiques complexes et des animations de zoom.', ['fractale', 'motif', 'mathématique']],

  ['Brightness Contrast', 'color', 'Ajuste luminosité, contraste, gain et saturation.', 'Effectue une correction globale rapide sur une branche du composite.', ['luminosité', 'contraste', 'saturation']],
  ['Color Corrector', 'color', 'Corrige teinte, saturation, niveaux et balance des couleurs.', 'C’est le correcteur généraliste pour harmoniser les éléments d’un composite.', ['correction', 'couleur', 'gamma']],
  ['Color Curves', 'color', 'Modifie les valeurs et les canaux au moyen de courbes.', 'Permet des corrections précises de contraste ou de couleur.', ['courbes', 'contraste', 'rgb']],
  ['Color Gain', 'color', 'Multiplie individuellement les canaux de couleur et l’alpha.', 'Réalise un ajustement technique simple de gain par canal.', ['gain', 'canaux', 'rgb']],
  ['Color Space', 'color', 'Convertit l’image entre différents modèles ou espaces de couleur.', 'Prépare des calculs dans un autre espace ou harmonise plusieurs sources.', ['espace colorimétrique', 'conversion', 'gamut']],
  ['Gamut', 'color', 'Transforme ou limite la gamme de couleurs de l’image.', 'Contrôle les couleurs selon l’espace de travail ou de livraison.', ['gamut', 'couleurs', 'limiteur']],
  ['Hue Curves', 'color', 'Modifie une couleur selon sa teinte avec des courbes ciblées.', 'Change sélectivement une gamme de couleurs sans masque manuel.', ['teinte', 'courbes', 'sélectif']],
  ['White Balance', 'color', 'Neutralise une dominante à partir d’un point blanc ou noir.', 'Corrige rapidement la température et la teinte d’un élément.', ['balance des blancs', 'température', 'dominante']],

  ['Blur', 'blur', 'Adoucit l’image avec plusieurs méthodes de flou.', 'Floute un élément, une texture ou un masque.', ['flou', 'adoucir']],
  ['Defocus', 'blur', 'Simule un flou optique avec forme de diaphragme.', 'Crée une profondeur de champ et un bokeh plus photographiques.', ['défocus', 'bokeh', 'objectif']],
  ['Directional Blur', 'blur', 'Étire les pixels dans une direction définie.', 'Suggère une vitesse ou crée un flou de mouvement graphique.', ['flou directionnel', 'mouvement', 'vitesse']],
  ['Glow', 'blur', 'Ajoute une lueur autour des zones lumineuses.', 'Renforce néons, hautes lumières et éléments énergétiques.', ['lueur', 'bloom', 'lumière']],
  ['Sharpen', 'blur', 'Accentue les contours pour augmenter la netteté perçue.', 'Récupère légèrement du détail ou renforce une texture.', ['netteté', 'détail']],
  ['Soft Glow', 'blur', 'Crée une lueur diffuse avec un rendu plus doux.', 'Donne une ambiance onirique ou adoucit les hautes lumières.', ['lueur douce', 'dream', 'diffusion']],
  ['Unsharp Mask', 'blur', 'Renforce le détail à partir d’une version floutée de l’image.', 'Offre un contrôle fin du rayon et de l’intensité de netteté.', ['masque flou', 'netteté', 'détail']],
  ['VariBlur', 'blur', 'Fait varier la quantité de flou à l’aide d’une seconde image.', 'Utilise une carte pour créer une profondeur ou un flou localisé.', ['flou variable', 'depth map', 'carte']],
  ['Vector Motion Blur', 'blur', 'Applique un flou guidé par des vecteurs de mouvement.', 'Produit un mouvement cohérent après un calcul d’Optical Flow.', ['vecteurs', 'motion blur', 'mouvement']],

  ['Bitmap', 'mask', 'Transforme la luminance ou un canal d’image en masque.', 'Réutilise une image, une texture ou un matte comme masque Fusion.', ['masque bitmap', 'luminance', 'canal']],
  ['Ellipse', 'mask', 'Crée un masque elliptique ou circulaire.', 'Isole rapidement un visage, une lumière ou une zone arrondie.', ['cercle', 'ellipse', 'power window']],
  ['Polygon', 'mask', 'Crée un masque précis à partir de points et courbes.', 'Sert à la rotoscopie et au détourage manuel de formes complexes.', ['polygone', 'rotoscopie', 'détourage']],
  ['Rectangle', 'mask', 'Crée un masque rectangulaire aux coins réglables.', 'Isole un écran, une fenêtre, un cadre ou une zone graphique.', ['rectangle', 'cadre', 'masque']],
  ['B-Spline', 'mask', 'Crée un masque souple contrôlé par une courbe B-Spline.', 'Dessine rapidement des formes organiques avec peu de points.', ['courbe', 'rotoscopie', 'forme']],
  ['Mask Paint', 'mask', 'Peint directement une succession de traits dans un masque.', 'Ajoute ou retire manuellement de petites zones d’un matte.', ['peinture', 'masque', 'retouche']],

  ['Chroma Keyer', 'matte', 'Crée un alpha à partir d’une couleur choisie.', 'Détoure un fond vert ou bleu avec des contrôles simples.', ['fond vert', 'chroma', 'key']],
  ['Delta Keyer', 'matte', 'Effectue un keying avancé avec nettoyage du fond et des bords.', 'Détoure précisément un écran vert ou bleu et traite le spill.', ['fond vert', 'spill', 'keying']],
  ['Difference Keyer', 'matte', 'Compare l’image à un fond de référence pour créer un matte.', 'Isole les éléments qui diffèrent d’une clean plate.', ['différence', 'clean plate', 'alpha']],
  ['Luma Keyer', 'matte', 'Crée un alpha selon la luminosité des pixels.', 'Isole un ciel clair, des ombres, de la fumée ou des éléments lumineux.', ['luminance', 'luma', 'détourage']],
  ['Ultra Keyer', 'matte', 'Détoure une couleur avec des réglages fins du matte et du spill.', 'Propose une autre méthode complète pour les incrustations chromatiques.', ['fond vert', 'keying', 'spill']],
  ['Clean Plate', 'matte', 'Construit une référence propre et régulière du fond coloré.', 'Améliore un key lorsque le fond vert est taché, bruité ou mal éclairé.', ['fond propre', 'green screen', 'key']],

  ['Tracker', 'tracker', 'Suit un ou plusieurs points dans l’image.', 'Stabilise, matche un mouvement ou attache un élément au plan.', ['suivi de point', 'stabiliser', 'match move']],
  ['Planar Tracker', 'tracker', 'Suit une surface plane et sa perspective.', 'Remplace un écran, colle un graphisme ou stabilise une zone plane.', ['suivi planaire', 'écran', 'corner pin']],
  ['Camera Tracker', 'tracker', 'Analyse le mouvement pour reconstruire une caméra 3D.', 'Intègre des objets 3D dans un plan filmé avec une caméra mobile.', ['tracking 3d', 'caméra', 'solve'], 'Studio'],
  ['Surface Tracker', 'tracker', 'Suit la déformation d’une surface non rigide.', 'Applique un tatouage, une texture ou une correction sur un tissu ou une peau.', ['surface', 'déformation', 'tracking'], 'Studio'],

  ['Transform', 'transform', 'Déplace, redimensionne, pivote et retourne une image 2D.', 'C’est le node de base pour positionner un élément dans le cadre.', ['position', 'échelle', 'rotation']],
  ['Crop', 'transform', 'Rogne l’image ou modifie les limites de son canvas.', 'Supprime des bords et adapte la zone utile d’une source.', ['recadrer', 'rogner', 'canvas']],
  ['Resize', 'transform', 'Change la définition de l’image avec un filtre de rééchantillonnage.', 'Adapte une branche à une résolution précise.', ['résolution', 'taille', 'rééchantillonnage']],
  ['Letterbox', 'transform', 'Ajoute ou règle des bandes de format dans l’image.', 'Prévisualise ou impose un ratio cinéma.', ['bandes noires', 'ratio', 'cinéma']],
  ['Camera Shake', 'transform', 'Génère un mouvement de caméra aléatoire contrôlé.', 'Ajoute une vibration réaliste ou stylisée à un plan trop stable.', ['tremblement', 'caméra', 'vibration']],
  ['DVE', 'transform', 'Transforme une image en perspective 2.5D.', 'Crée une rotation de panneau, un effet de page ou un placement en perspective.', ['perspective', 'rotation', '2.5d']],
  ['Corner Positioner', 'transform', 'Place les quatre coins d’une image indépendamment.', 'Insère un écran ou une affiche dans une surface quadrilatère.', ['corner pin', 'écran', 'perspective']],

  ['Displace', 'warp', 'Déforme l’image selon les valeurs d’une carte.', 'Crée chaleur, eau, fumée ou distorsions organiques avec une texture.', ['déplacement', 'carte', 'distorsion']],
  ['Grid Warp', 'warp', 'Déforme l’image au moyen d’une grille de contrôle.', 'Remodèle précisément une forme, un visage ou un élément graphique.', ['grille', 'morphing', 'déformation']],
  ['Lens Distort', 'warp', 'Ajoute ou corrige la distorsion géométrique d’un objectif.', 'Fait correspondre un élément 3D/2D à la distorsion du plan filmé.', ['objectif', 'distorsion', 'barillet']],
  ['Vortex', 'warp', 'Tord l’image autour d’un centre.', 'Crée une spirale, un tourbillon ou une transition stylisée.', ['tourbillon', 'spirale', 'déformation']],
  ['Dent', 'warp', 'Pousse ou aspire localement les pixels autour d’un point.', 'Simule une bosse, un creux ou une déformation comique.', ['bosse', 'creux', 'distorsion']],
  ['Perspective Positioner', 'warp', 'Repositionne une image selon quatre points de perspective.', 'Ajuste un insert aux lignes de fuite d’une surface.', ['perspective', 'position', 'insert']],

  ['Paint', 'paint', 'Peint des traits, clones et formes directement dans l’image.', 'Retouche, efface un câble, dessine ou anime des coups de pinceau.', ['peinture', 'clone', 'retouche']],
  ['Clone Multistroke', 'paint', 'Regroupe plusieurs traits de clonage dans une même opération.', 'Nettoie rapidement poussières et petits éléments répétitifs.', ['clone', 'nettoyage', 'traits']],
  ['Repair Frame', 'paint', 'Reconstruit une image à partir d’images voisines.', 'Aide à corriger un défaut bref ou une image endommagée.', ['réparer', 'frame', 'restauration']],

  ['Text+', 'text', 'Crée du texte 2D riche avec animation, mise en forme et shading.', 'Réalise titres, lower thirds et animations typographiques.', ['titre', 'typographie', 'animation']],
  ['Text 3D', 'text', 'Crée un texte géométrique dans une véritable scène 3D.', 'Ajoute extrusion, matériau, éclairage et mouvement de caméra à un titre.', ['titre 3d', 'extrusion', 'typographie']],

  ['pEmitter', 'particle', 'Émet des particules selon une forme, une région ou une image.', 'Définit la naissance, la vitesse et la durée de vie d’un système de particules.', ['émetteur', 'particules', 'naissance']],
  ['pRender', 'particle', 'Transforme la simulation de particules en image 2D.', 'Se place à la fin d’une chaîne de particules pour afficher le résultat.', ['rendu', 'particules', 'sortie']],
  ['pMerge', 'particle', 'Réunit plusieurs flux de particules.', 'Combine différentes émissions avant les forces et le rendu.', ['fusion', 'particules', 'flux']],
  ['pTurbulence', 'particle', 'Ajoute une force chaotique et organique aux particules.', 'Simule fumée, poussière, étincelles et mouvements irréguliers.', ['turbulence', 'force', 'fumée']],
  ['pDirectionalForce', 'particle', 'Pousse toutes les particules dans une direction.', 'Simule un vent, une gravité simple ou une accélération constante.', ['force', 'vent', 'direction']],
  ['pPointForce', 'particle', 'Attire ou repousse les particules autour d’un point.', 'Crée attraction, explosion ou orbite locale.', ['attraction', 'répulsion', 'force']],
  ['pVortex', 'particle', 'Fait tourner les particules autour d’un axe.', 'Produit tornades, spirales et mouvements orbitaux.', ['vortex', 'spirale', 'rotation']],
  ['pBounce', 'particle', 'Fait rebondir les particules sur une région.', 'Simule des collisions avec un sol ou un obstacle.', ['rebond', 'collision', 'sol']],
  ['pAvoid', 'particle', 'Dévie les particules pour éviter une région.', 'Crée un obstacle invisible dans la simulation.', ['éviter', 'obstacle', 'collision']],

  ['Shape 3D', '3d', 'Crée une primitive 3D comme un plan, cube, sphère ou cylindre.', 'Fournit rapidement une géométrie pour une scène Fusion.', ['forme', 'cube', 'sphère']],
  ['Image Plane 3D', '3d', 'Place une image 2D sur un plan dans l’espace 3D.', 'Intègre une photo, vidéo ou texture comme carte dans la scène.', ['plan 3d', 'image', 'texture']],
  ['Camera 3D', '3d', 'Définit le point de vue utilisé pour cadrer une scène 3D.', 'Anime un mouvement de caméra, sa focale et sa profondeur de champ.', ['caméra', 'focale', 'point de vue']],
  ['Point Light', '3d', 'Émet de la lumière dans toutes les directions depuis un point.', 'Simule une ampoule ou une petite source dans la scène.', ['lumière', 'point', 'ampoule']],
  ['Spot Light', '3d', 'Projette un cône lumineux orientable.', 'Simule un projecteur et permet de concentrer l’éclairage.', ['spot', 'projecteur', 'lumière']],
  ['Ambient Light', '3d', 'Éclaire uniformément toute la scène 3D.', 'Débouche les ombres et fixe un niveau de lumière général.', ['ambiance', 'lumière', 'global']],
  ['Merge 3D', '3d', 'Réunit plusieurs objets, lumières et caméras dans une scène.', 'C’est le hub qui assemble les branches d’une composition 3D.', ['fusion 3d', 'scène', 'assembler']],
  ['Renderer 3D', '3d', 'Convertit une scène 3D Fusion en image 2D.', 'Se place avant MediaOut ou Merge pour rendre géométrie, matériaux et lumières.', ['rendu 3d', 'sortie', 'image']],
  ['Transform 3D', '3d', 'Déplace, tourne et redimensionne des objets dans l’espace 3D.', 'Anime ou repositionne une branche entière de la scène.', ['position 3d', 'rotation', 'échelle']],
  ['Duplicate 3D', '3d', 'Crée plusieurs copies transformées d’un objet 3D.', 'Construit rangées, motifs, escaliers ou répétitions animées.', ['dupliquer', 'copies', 'répétition']],
  ['Replicate 3D', '3d', 'Distribue un objet sur les sommets d’une autre géométrie.', 'Réalise des foules d’objets, feuillages ou motifs complexes.', ['répliquer', 'distribution', 'instances']],
  ['FBX Mesh 3D', '3d', 'Importe une géométrie provenant d’un fichier FBX.', 'Intègre des modèles ou animations 3D créés dans un autre logiciel.', ['fbx', 'modèle 3d', 'import']],
  ['Alembic Mesh 3D', '3d', 'Importe une géométrie ou animation au format Alembic.', 'Lit des caches 3D complexes issus d’un logiciel externe.', ['alembic', 'cache', 'import']],

  ['Blinn', 'material3d', 'Crée un matériau 3D brillant polyvalent.', 'Convient au plastique, métal peint et nombreuses surfaces générales.', ['matériau', 'brillant', 'shader']],
  ['Cook Torrance', 'material3d', 'Crée un matériau spéculaire à comportement plus physique.', 'Produit des surfaces métalliques ou brillantes avec contrôle fin.', ['matériau', 'spéculaire', 'métal']],
  ['Phong', 'material3d', 'Crée un matériau classique avec reflet spéculaire net.', 'Fournit un shader simple pour objets lisses et éclairés.', ['matériau', 'shader', 'reflet']],
  ['Reflect', 'material3d', 'Ajoute des réflexions d’environnement à un matériau.', 'Simule métal poli, verre réfléchissant ou surfaces miroir.', ['réflexion', 'miroir', 'environnement']],
  ['Replace Material 3D', 'material3d', 'Remplace le matériau appliqué à un objet 3D.', 'Change le look d’une géométrie sans modifier son import.', ['remplacer', 'matériau', 'texture']],
  ['BumpMap', 'material3d', 'Convertit une texture en relief apparent pour un matériau.', 'Ajoute du détail de surface sans augmenter la géométrie.', ['bump map', 'relief', 'normal', 'texture']],

  ['Optical Flow', 'optical-flow', 'Calcule les vecteurs de mouvement entre les images.', 'Alimente le ralenti, le motion blur vectoriel et certaines déformations temporelles.', ['flux optique', 'vecteurs', 'mouvement']],
  ['Vector Distortion', 'optical-flow', 'Déforme une image à l’aide de vecteurs de mouvement.', 'Transfère ou amplifie un mouvement calculé sur une autre image.', ['vecteurs', 'distorsion', 'mouvement']],

  ['Time Speed', 'time', 'Modifie la vitesse de lecture d’une séquence.', 'Crée accéléré, ralenti, inversion ou image figée avec une vitesse constante.', ['vitesse', 'ralenti', 'reverse']],
  ['Time Stretcher', 'time', 'Choisit l’image source à afficher pour chaque image de sortie.', 'Permet un remappage temporel animé et précis.', ['remappage temporel', 'retime', 'frame']],
  ['Trails', 'time', 'Accumule des images successives pour créer des traînées.', 'Visualise le mouvement ou produit un effet fantôme temporel.', ['traînée', 'écho vidéo', 'mouvement']],

  ['Custom Tool', 'utility', 'Fournit des expressions et calculs personnalisés sur les canaux.', 'Crée un traitement mathématique lorsque les nodes standards ne suffisent pas.', ['expression', 'calcul', 'personnalisé']],
  ['Change Depth', 'utility', 'Convertit la profondeur de couleur de l’image.', 'Adapte une branche en 8, 16 ou 32 bits selon le traitement.', ['bits', 'profondeur', 'float']],
  ['Set Domain', 'utility', 'Redéfinit la zone de données utile d’une image.', 'Optimise ou contraint la région calculée dans un flow.', ['domaine', 'canvas', 'bounds']],
  ['Custom Vertex 3D', 'utility', 'Déforme une géométrie 3D avec des expressions de sommets.', 'Crée des transformations procédurales avancées sur un maillage.', ['vertex', 'expression', 'géométrie']],
];

function nodeId(name: string) {
  return name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const FUSION_NODES: FusionNode[] = NODE_SEEDS.map(([name, category, summary, usage, keywords = [], availability = 'Gratuit']) => ({
  id: `fusion-${nodeId(name)}`,
  name,
  category,
  summary,
  usage,
  keywords,
  availability,
}));

export function getFusionNodeCategory(categoryId: string) {
  return FUSION_NODE_CATEGORIES.find(category => category.id === categoryId);
}

export function fusionNodeMatchesQuery(node: FusionNode, query: string): boolean {
  const normalizedQuery = normalizeEffectSearch(query);
  if (!normalizedQuery) return true;
  const category = getFusionNodeCategory(node.category);
  const haystack = normalizeEffectSearch([
    node.name,
    category?.english,
    category?.french,
    node.summary,
    node.usage,
    ...node.keywords,
  ].join(' '));
  return normalizedQuery.split(/\s+/).every(word => haystack.includes(word));
}

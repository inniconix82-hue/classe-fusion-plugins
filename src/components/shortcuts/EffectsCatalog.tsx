import React, { useEffect, useMemo, useState } from 'react';
import {
  DAVINCI_EFFECTS,
  EFFECT_PAGES,
  effectMatchesQuery,
  getEffectCategoryLabel,
  type DavinciEffect,
  type EffectPage,
} from '../../data/effectCatalog';
import {
  FUSION_NODES,
  FUSION_NODE_CATEGORIES,
  fusionNodeMatchesQuery,
  getFusionNodeCategory,
  type FusionNode,
} from '../../data/fusionNodeCatalog';

const FAVORITES_KEY = 'davinci-effects-favorites-v1';

function loadFavorites(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function EffectsView() {
  const [selectedPage, setSelectedPage] = useState<EffectPage | 'Tous'>('Tous');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [selectedEffectId, setSelectedEffectId] = useState<string>(DAVINCI_EFFECTS[0]?.id ?? '');

  const pageEffects = useMemo(
    () => selectedPage === 'Tous'
      ? DAVINCI_EFFECTS
      : DAVINCI_EFFECTS.filter(effect => effect.pages.includes(selectedPage)),
    [selectedPage]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    pageEffects.forEach(effect => counts.set(effect.category, (counts.get(effect.category) ?? 0) + 1));
    return [...counts.entries()].sort(([a], [b]) =>
      getEffectCategoryLabel(a).english.localeCompare(getEffectCategoryLabel(b).english, 'en')
    );
  }, [pageEffects]);

  const filteredEffects = useMemo(() => pageEffects.filter(effect =>
    (selectedCategory === 'Toutes' || effect.category === selectedCategory)
    && (!favoritesOnly || favorites.has(effect.id))
    && effectMatchesQuery(effect, query)
  ), [pageEffects, selectedCategory, favoritesOnly, favorites, query]);

  const selectedEffect = filteredEffects.find(effect => effect.id === selectedEffectId)
    ?? filteredEffects[0]
    ?? null;

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const choosePage = (page: EffectPage | 'Tous') => {
    setSelectedPage(page);
    setSelectedCategory('Toutes');
  };

  const toggleFavorite = (effect: DavinciEffect) => {
    setFavorites(current => {
      const next = new Set(current);
      if (next.has(effect.id)) next.delete(effect.id);
      else next.add(effect.id);
      return next;
    });
  };

  return (
    <div className="effects-catalog">
      <aside className="effects-pages" aria-label="Pages DaVinci Resolve">
        <div className="effects-panel-heading">Pages</div>
        <button
          className={`effects-nav-item ${selectedPage === 'Tous' ? 'active' : ''}`}
          onClick={() => choosePage('Tous')}
        >
          <span className="effects-nav-icon">▦</span>
          <span className="effects-nav-copy"><strong>Tous</strong><small>Catalogue complet</small></span>
          <span className="effects-nav-count">{DAVINCI_EFFECTS.length}</span>
        </button>
        {EFFECT_PAGES.map(page => {
          const count = DAVINCI_EFFECTS.filter(effect => effect.pages.includes(page.name)).length;
          return (
            <button
              key={page.name}
              className={`effects-nav-item ${selectedPage === page.name ? 'active' : ''}`}
              onClick={() => choosePage(page.name)}
            >
              <span className="effects-nav-icon">{page.icon}</span>
              <span className="effects-nav-copy"><strong>{page.name}</strong><small>{page.hint}</small></span>
              <span className="effects-nav-count">{count}</span>
            </button>
          );
        })}
      </aside>

      <aside className="effects-categories" aria-label="Catégories d’effets">
        <div className="effects-panel-heading">Categories · Catégories</div>
        <button
          className={`effects-category-item ${selectedCategory === 'Toutes' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Toutes')}
        >
          <span className="category-bilingual"><strong>All Categories</strong><small>Toutes les catégories</small></span><span>{pageEffects.length}</span>
        </button>
        {categories.map(([category, count]) => {
          const label = getEffectCategoryLabel(category);
          return (
            <button
              key={category}
              className={`effects-category-item ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              <span className="category-bilingual"><strong>{label.english}</strong><small>{label.french}</small></span><span>{count}</span>
            </button>
          );
        })}
      </aside>

      <main className="effects-main">
        <div className="effects-toolbar">
          <div className="effects-search-wrap">
            <span aria-hidden="true">⌕</span>
            <input
              id="effects-search-input"
              className="effects-search-input"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Rechercher un effet, un usage… ex. flou, fond vert, voix"
              aria-label="Rechercher dans les effets"
            />
            {query && <button className="effects-clear" onClick={() => setQuery('')} aria-label="Effacer la recherche">×</button>}
          </div>
          <button
            className={`effects-favorites-filter ${favoritesOnly ? 'active' : ''}`}
            onClick={() => setFavoritesOnly(value => !value)}
            title="Afficher uniquement les favoris"
          >
            ★ Favoris <span>{favorites.size}</span>
          </button>
        </div>

        <div className="effects-context-row">
          <div>
            <h2>{selectedCategory === 'Toutes'
              ? (selectedPage === 'Tous' ? 'All Effects · Tous les effets' : `Page ${selectedPage}`)
              : `${getEffectCategoryLabel(selectedCategory).english} · ${selectedCategory}`}</h2>
            <p>{filteredEffects.length} résultat{filteredEffects.length > 1 ? 's' : ''}</p>
          </div>
          {(selectedPage !== 'Tous' || selectedCategory !== 'Toutes' || query || favoritesOnly) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { choosePage('Tous'); setQuery(''); setFavoritesOnly(false); }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {filteredEffects.length > 0 ? (
          <div className="effects-content-grid">
            <div className="effects-results" role="list">
              {filteredEffects.map(effect => (
                <button
                  key={effect.id}
                  role="listitem"
                  className={`effect-card ${selectedEffect?.id === effect.id ? 'active' : ''}`}
                  onClick={() => setSelectedEffectId(effect.id)}
                >
                  <span className="effect-card-header">
                    <strong>{effect.name}</strong>
                    <span
                      className={`effect-favorite ${favorites.has(effect.id) ? 'active' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={favorites.has(effect.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      onClick={event => { event.stopPropagation(); toggleFavorite(effect); }}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleFavorite(effect);
                        }
                      }}
                    >★</span>
                  </span>
                  <span className="effect-card-meta">
                    <span>{getEffectCategoryLabel(effect.category).english} · {effect.category}</span>
                    {effect.availability && <span className={`effect-edition ${effect.availability === 'Studio' ? 'studio' : ''}`}>{effect.availability}</span>}
                  </span>
                  <span className="effect-card-summary">{effect.summary}</span>
                  <span className="effect-page-chips">
                    {effect.pages.map(page => <span key={page}>{page}</span>)}
                  </span>
                </button>
              ))}
            </div>

            {selectedEffect && (
              <article className="effect-detail" aria-live="polite">
                <div className="effect-detail-heading">
                  <div>
                    <span className="effect-detail-category">{getEffectCategoryLabel(selectedEffect.category).english} · {selectedEffect.category}</span>
                    <h2>{selectedEffect.name}</h2>
                  </div>
                  <button
                    className={`effect-detail-favorite ${favorites.has(selectedEffect.id) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(selectedEffect)}
                    aria-label={favorites.has(selectedEffect.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    title={favorites.has(selectedEffect.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >★</button>
                </div>

                <p className="effect-detail-summary">{selectedEffect.summary}</p>

                <section>
                  <h3>À quoi ça sert ?</h3>
                  <p>{selectedEffect.usage}</p>
                </section>

                <section>
                  <h3>Où le trouver ?</h3>
                  <p className="effect-path">{selectedEffect.path}</p>
                </section>

                <section>
                  <h3>Disponible dans</h3>
                  <div className="effect-detail-chips">
                    {selectedEffect.pages.map(page => <span key={page}>{page}</span>)}
                    {selectedEffect.availability && (
                      <span className={selectedEffect.availability === 'Studio' ? 'studio' : ''}>
                        {selectedEffect.availability === 'Studio' ? 'DaVinci Resolve Studio' : 'DaVinci Resolve gratuit'}
                      </span>
                    )}
                  </div>
                </section>

                <section>
                  <h3>Mots clés</h3>
                  <div className="effect-keywords">
                    {selectedEffect.keywords.slice(0, 6).map(keyword => <span key={keyword}>{keyword}</span>)}
                  </div>
                </section>
              </article>
            )}
          </div>
        ) : (
          <div className="effects-empty">
            <span>⌕</span>
            <h3>Aucun effet trouvé</h3>
            <p>Essayez un usage comme « fond vert », « flou visage », « bruit » ou « voix ».</p>
          </div>
        )}
      </main>
    </div>
  );
}

const NODE_FAVORITES_KEY = 'davinci-fusion-node-favorites-v1';

function loadNodeFavorites(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(NODE_FAVORITES_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function FusionNodesView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadNodeFavorites());
  const [selectedNodeId, setSelectedNodeId] = useState(FUSION_NODES[0]?.id ?? '');

  const categories = useMemo(() => FUSION_NODE_CATEGORIES.map(category => ({
    ...category,
    count: FUSION_NODES.filter(node => node.category === category.id).length,
  })).filter(category => category.count > 0), []);

  const filteredNodes = useMemo(() => FUSION_NODES.filter(node =>
    (selectedCategory === 'Toutes' || node.category === selectedCategory)
    && (!favoritesOnly || favorites.has(node.id))
    && fusionNodeMatchesQuery(node, query)
  ), [selectedCategory, favoritesOnly, favorites, query]);

  const selectedNode = filteredNodes.find(node => node.id === selectedNodeId) ?? filteredNodes[0] ?? null;

  useEffect(() => {
    localStorage.setItem(NODE_FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (node: FusionNode) => {
    setFavorites(current => {
      const next = new Set(current);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  const selectedCategoryLabel = selectedCategory === 'Toutes'
    ? null
    : getFusionNodeCategory(selectedCategory);

  return (
    <div className="effects-catalog">
      <aside className="effects-pages fusion-node-intro" aria-label="Bibliothèque des nodes Fusion">
        <div className="effects-panel-heading">Fusion</div>
        <div className="fusion-node-intro-card">
          <span className="fusion-node-symbol">⬡</span>
          <strong>Fusion Nodes</strong>
          <small>Nodes Fusion</small>
          <p>{FUSION_NODES.length} nodes principaux documentés avec leur nom original et une explication en français.</p>
        </div>
        <div className="fusion-node-tip">
          <strong>Ajouter un node</strong>
          <kbd>⇧ Shift</kbd> + <kbd>Space</kbd>
          <p>Puis tapez son nom anglais.</p>
        </div>
      </aside>

      <aside className="effects-categories" aria-label="Catégories des nodes Fusion">
        <div className="effects-panel-heading">Categories · Catégories</div>
        <button
          className={`effects-category-item ${selectedCategory === 'Toutes' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Toutes')}
        >
          <span className="category-bilingual"><strong>All Nodes</strong><small>Tous les nodes</small></span>
          <span>{FUSION_NODES.length}</span>
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`effects-category-item ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-bilingual"><strong>{category.english}</strong><small>{category.french}</small></span>
            <span>{category.count}</span>
          </button>
        ))}
      </aside>

      <main className="effects-main">
        <div className="effects-toolbar">
          <div className="effects-search-wrap">
            <span aria-hidden="true">⌕</span>
            <input
              id="effects-search-input"
              className="effects-search-input"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Rechercher un node ou un usage… ex. fond vert, tracking, particules"
              aria-label="Rechercher dans les nodes Fusion"
            />
            {query && <button className="effects-clear" onClick={() => setQuery('')} aria-label="Effacer la recherche">×</button>}
          </div>
          <button
            className={`effects-favorites-filter ${favoritesOnly ? 'active' : ''}`}
            onClick={() => setFavoritesOnly(value => !value)}
            title="Afficher uniquement les favoris"
          >
            ★ Favoris <span>{favorites.size}</span>
          </button>
        </div>

        <div className="effects-context-row">
          <div>
            <h2>{selectedCategoryLabel
              ? `${selectedCategoryLabel.english} · ${selectedCategoryLabel.french}`
              : 'All Fusion Nodes · Tous les nodes Fusion'}</h2>
            <p>{filteredNodes.length} résultat{filteredNodes.length > 1 ? 's' : ''}</p>
          </div>
          {(selectedCategory !== 'Toutes' || query || favoritesOnly) && (
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setSelectedCategory('Toutes'); setQuery(''); setFavoritesOnly(false);
            }}>Réinitialiser</button>
          )}
        </div>

        {filteredNodes.length > 0 ? (
          <div className="effects-content-grid">
            <div className="effects-results" role="list">
              {filteredNodes.map(node => {
                const category = getFusionNodeCategory(node.category);
                return (
                  <button
                    key={node.id}
                    role="listitem"
                    className={`effect-card ${selectedNode?.id === node.id ? 'active' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <span className="effect-card-header">
                      <strong>{node.name}</strong>
                      <span
                        className={`effect-favorite ${favorites.has(node.id) ? 'active' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={favorites.has(node.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        onClick={event => { event.stopPropagation(); toggleFavorite(node); }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault(); event.stopPropagation(); toggleFavorite(node);
                          }
                        }}
                      >★</span>
                    </span>
                    <span className="effect-card-meta">{category?.english} · {category?.french}</span>
                    <span className="effect-card-summary">{node.summary}</span>
                    <span className="effect-page-chips"><span>Fusion</span></span>
                  </button>
                );
              })}
            </div>

            {selectedNode && (() => {
              const category = getFusionNodeCategory(selectedNode.category);
              return (
                <article className="effect-detail" aria-live="polite">
                  <div className="effect-detail-heading">
                    <div>
                      <span className="effect-detail-category">{category?.english} · {category?.french}</span>
                      <h2>{selectedNode.name}</h2>
                    </div>
                    <button
                      className={`effect-detail-favorite ${favorites.has(selectedNode.id) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(selectedNode)}
                      aria-label={favorites.has(selectedNode.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >★</button>
                  </div>
                  <p className="effect-detail-summary">{selectedNode.summary}</p>
                  <section><h3>À quoi ça sert ?</h3><p>{selectedNode.usage}</p></section>
                  <section>
                    <h3>Comment l’ajouter ?</h3>
                    <p className="effect-path"><kbd>Shift</kbd> + <kbd>Space</kbd>, puis recherchez <strong>{selectedNode.name}</strong>.</p>
                  </section>
                  <section>
                    <h3>Catégorie originale</h3>
                    <div className="effect-detail-chips">
                      <span>{category?.english}</span><span>{category?.french}</span><span>Fusion</span>
                    </div>
                  </section>
                  <section>
                    <h3>Mots clés</h3>
                    <div className="effect-keywords">{selectedNode.keywords.map(keyword => <span key={keyword}>{keyword}</span>)}</div>
                  </section>
                </article>
              );
            })()}
          </div>
        ) : (
          <div className="effects-empty">
            <span>⌕</span><h3>Aucun node trouvé</h3>
            <p>Essayez « fond vert », « tracking », « texte », « particules » ou le nom anglais du node.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export function EffectsCatalog() {
  const [kind, setKind] = useState<'effects' | 'nodes'>('effects');

  return (
    <div className="effects-library">
      <div className="catalog-kind-switch" role="tablist" aria-label="Type de catalogue">
        <button className={kind === 'effects' ? 'active' : ''} onClick={() => setKind('effects')} role="tab" aria-selected={kind === 'effects'}>
          ✨ Effects · Effets <span>{DAVINCI_EFFECTS.length}</span>
        </button>
        <button className={kind === 'nodes' ? 'active' : ''} onClick={() => setKind('nodes')} role="tab" aria-selected={kind === 'nodes'}>
          ⬡ Fusion Nodes · Nodes Fusion <span>{FUSION_NODES.length}</span>
        </button>
      </div>
      {kind === 'effects' ? <EffectsView /> : <FusionNodesView />}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  DAVINCI_EFFECTS,
  EFFECT_PAGES,
  effectMatchesQuery,
  type DavinciEffect,
  type EffectPage,
} from '../../data/effectCatalog';

const FAVORITES_KEY = 'davinci-effects-favorites-v1';

function loadFavorites(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function EffectsCatalog() {
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
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'));
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
        <div className="effects-panel-heading">Catégories</div>
        <button
          className={`effects-category-item ${selectedCategory === 'Toutes' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Toutes')}
        >
          <span>Toutes les catégories</span><span>{pageEffects.length}</span>
        </button>
        {categories.map(([category, count]) => (
          <button
            key={category}
            className={`effects-category-item ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            <span>{category}</span><span>{count}</span>
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
            <h2>{selectedCategory === 'Toutes' ? (selectedPage === 'Tous' ? 'Tous les effets' : `Page ${selectedPage}`) : selectedCategory}</h2>
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
                    <span>{effect.category}</span>
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
                    <span className="effect-detail-category">{selectedEffect.category}</span>
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

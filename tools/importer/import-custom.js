/* eslint-disable no-console */
/*
 * Westpac home page importer for Edge Delivery Services
 */

import WebImporter from '@adobe/helix-importer';

/**
 * Build a simple Hero block from the main carousel.
 *
 * @param {HTMLElement} main
 * @param {HTMLDocument} document
 */
function convertHero(main, document) {
  const carousel = document.querySelector('#carousel34');
  if (!carousel) return;

  const slide = carousel.querySelector('.slide');
  if (!slide) return;

  const img = slide.querySelector('img.slide-img');
  const titleEl = slide.querySelector('.slide-text-classic');
  const descEl = slide.querySelector('.slide-text-body p');
  const ctaEl = slide.querySelector('.slide-text-footer a');

  const cells = [];
  cells.push(['Hero']); // block name row
  cells.push(['Image', img ? img.cloneNode(true) : '']);
  cells.push(['Title', titleEl ? titleEl.textContent.trim() : '']);
  cells.push(['Description', descEl ? descEl.textContent.trim() : '']);
  cells.push(['CTA Text', ctaEl ? ctaEl.textContent.trim() : '']);
  cells.push(['CTA Link', ctaEl ? ctaEl.href : '']);

  const table = WebImporter.DOMUtils.createTable(cells, document);

  // place hero near the top of main
  main.insertBefore(table, main.firstChild);

  // remove original complex carousel markup
  carousel.remove();
}

/**
 * Convert a tiles section (Personal / Business) into a Tiles block.
 *
 * @param {HTMLElement} main
 * @param {HTMLElement} section
 * @param {HTMLDocument} document
 */
function convertTilesSection(main, section, document) {
  const headingEl = section.querySelector('.solution-heading');
  const sectionTitle = headingEl ? headingEl.textContent.trim() : 'Tiles';

  const tiles = section.querySelectorAll('.tiles-tile');
  if (!tiles.length) return;

  const cells = [];
  // block name + heading
  cells.push(['Tiles', sectionTitle]);
  // header row
  cells.push(['Tile Title', 'Text', 'Image', 'Link']);

  tiles.forEach((tile) => {
    const title = tile.querySelector('.tile-heading');
    const body = tile.querySelector('p');
    const img = tile.querySelector('img.tiles-tile-img');
    const link = tile.querySelector('a.tiles-anchor');

    cells.push([
      title ? title.textContent.trim() : '',
      body ? body.textContent.trim() : '',
      img ? img.cloneNode(true) : '',
      link ? link.href : '',
    ]);
  });

  const table = WebImporter.DOMUtils.createTable(cells, document);
  main.append(table);

  // remove original tiles markup
  section.remove();
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be transformed to Markdown.
   *
   * @param {object} params
   * @param {HTMLDocument} params.document
   * @param {string} params.url
   * @param {string} params.html
   * @param {object} params.params
   * @returns {HTMLElement} main element
   */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document,
    url,
    html,
    params,
  }) => {
    console.log('westpac importer: transformDOM');

    // Remove chrome (header/nav/footer/scripts etc.)
    WebImporter.DOMUtils.remove(document, [
      'noindex',
      '.header-wrapper',
      '.homepage-cta-wrapper',
      '.nav-sidebar',
      '.footer-wrapper',
      'script',
      'noscript',
      'style',
    ]);

    // main content area
    const main = document.querySelector('main.content') || document.body;

    // Hero → block
    convertHero(main, document);

    // Tiles sections (Personal, Business, etc.) → blocks
    document
      .querySelectorAll('.tiles-wrapper.column-container')
      .forEach((section) => convertTilesSection(main, section, document));

    // leave supporting-links, acknowledgement, etc. in-place;
    // they will become normal markdown sections

    // Create metadata block at the very top
    WebImporter.DOMUtils.createMetadata(main, document);

    return main;
  },

  /**
   * Return a path describing the document being transformed.
   *
   * @param {object} params
   * @param {HTMLDocument} params.document
   * @param {string} params.url
   * @param {string} params.html
   * @param {object} params.params
   * @returns {string} sanitized path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document,
    url,
    html,
    params,
  }) => {
    const u = new URL(url);
    let pathname = u.pathname;

    // normalise: drop trailing ".html"
    pathname = pathname.replace(/\.html?$/i, '');

    // root → /index
    if (!pathname || pathname === '/') {
      pathname = '/index';
    }

    // let Helix/EDS do final sanitisation
    return WebImporter.FileUtils.sanitizePath(pathname);
  },
};

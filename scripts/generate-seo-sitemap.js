#!/usr/bin/env node
/**
 * Regenerate sitemap-seo.xml from lib/seo-pages-data.js
 * Run after adding services or locations: node scripts/generate-seo-sitemap.js
 */
const fs = require('fs');
const path = require('path');
const { listSeoPageSlugs } = require('../lib/seo-pages-data');
const { renderSeoSitemap } = require('../lib/seo-page-render');

const siteUrl = (process.env.SITE_URL || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
const slugs = listSeoPageSlugs();
const xml = renderSeoSitemap(siteUrl, slugs);
const outPath = path.join(__dirname, '..', 'sitemap-seo.xml');

fs.writeFileSync(outPath, xml, 'utf8');
console.log('Wrote ' + slugs.length + ' URLs to ' + outPath);

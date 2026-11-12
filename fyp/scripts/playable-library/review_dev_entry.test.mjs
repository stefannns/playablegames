import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reviewDevEntry, reviewDevEntryHtml} from './review_dev_entry.mjs';

const template = '<div id="root"></div><script type="module" src="/src/main.tsx"></script>';
const expected = template.replace('/src/main.tsx', '/src/portfolio_fyp_main.tsx');

test('local batch review selects exactly the published FYP entry before Vite transforms scripts', () => {
  for (const url of ['/app/home?review=batch', '/app/home/?feed=playable-batch-one&review=batch', '/app/home?review=batch&reviewHost=http%3A%2F%2F127.0.0.1%3A54770']) {
    assert.equal(reviewDevEntryHtml(template, url), expected);
  }
  const plugin = reviewDevEntry();
  assert.equal(plugin.apply, 'serve');
  assert.equal(plugin.transformIndexHtml.order, 'pre');
  assert.equal(plugin.transformIndexHtml.handler(template, {originalUrl:'/app/home?review=batch'}), expected);
});

test('normal original-framework routes, resources and missing context stay untouched', () => {
  for (const url of [undefined, '', '/app/home', '/app/home?feed=playable-local-one-stroke', '/app/home?review=other', '/app/profile?review=batch', '/resource/playable-batch/one/game.html?review=batch']) {
    assert.equal(reviewDevEntryHtml(template, url), template);
  }
  assert.equal(reviewDevEntryHtml(expected, '/app/home?review=batch'), expected);
});

test('the selected shell retains AppFrame, original display navigation and dynamic navigation measurement', () => {
  const read = name => fs.readFileSync(new URL('../../'+name, import.meta.url),'utf8');
  const entry = read('src/portfolio_fyp_main.tsx');
  const nav = read('src/components/app/portfolio_feed_navigation.tsx');
  assert(entry.includes('<AppFrame') && entry.includes('<HomePage fypOnly feedNavigation={<PortfolioFeedNavigation/>}/>'));
  assert(nav.includes('nav.offsetHeight') && nav.includes('new ResizeObserver(measure)'));
  assert(nav.includes('<AppTabBarNav') && nav.includes('displayOnly'));
  assert(!nav.includes('82px'));
});

test('approved upstream masks are anchored to the header and Tabbar, not the game footer', () => {
  const css = fs.readFileSync(new URL('../../src/page/home/components/playable_feed.css',import.meta.url),'utf8');
  const top=css.match(/\.playable-feed-tint-top \{[^}]*\}/)[0];
  const bottom=css.match(/\.playable-feed-tint-bottom \{[^}]*\}/)[0];
  assert(top.includes('height:calc(var(--tint-header) + 68.8px)'));
  assert(bottom.includes('height:calc(var(--playable-screen-height, 100%) * .24)'));
  assert(!bottom.includes('--playable-footer-height'));
  assert.equal(106+68.8,174.8);
  assert(Math.abs(874*.24-209.76)<1e-9);
  for (const screen of [598,667,844,932]) {
    for (const nav of [48,82,98]) {
      const tintHeight=screen*.24;
      const tintTop=screen-nav-tintHeight;
      assert(Math.abs(tintTop+tintHeight-(screen-nav))<1e-9);
      assert(Math.abs(tintTop+tintHeight-89-(screen-nav-89))<1e-9);
    }
  }
});

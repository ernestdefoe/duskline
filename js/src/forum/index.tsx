import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import type ItemList from 'flarum/common/utils/ItemList';
import DuskHero from './components/DuskHero';
import Radar from './components/Radar';
import TagStrip from './components/TagStrip';
import XpPanel from './components/XpPanel';
import RankRoad from './components/RankRoad';
import HudBar from './components/HudBar';
import Sky from './components/Sky';
import { cfg, currentScene, followClock, standing, t } from './util';
import { isNew } from './tagsNew';
import { isScene } from '../common/sky';

app.initializers.add('ernestdefoe-duskline', () => {
  // Inert unless the server stamped this page for Duskline (Wardrobe/Bespoke may pick another theme).
  // 🚨 app.forum is not loaded yet while initializers run: every hook reads cfg() when it renders.
  if (!document.documentElement.hasAttribute('data-duskline')) return;

  // The clock and the phone bar start with the first page, once the forum's data is in.
  extend('flarum/common/components/Page', 'oninit', () => {
    if (!cfg()) return;
    followClock();
    mountHud();
  });

  // The index hero (tag pages keep the Tags hero).
  override('flarum/forum/components/IndexPage', 'hero', function (this: any, original: () => any) {
    const c = cfg();
    if (!c || c.hero === 'off' || this.currentTag?.()) return original();
    return <DuskHero />;
  });

  // Tag tiles above the discussion list, on the unfiltered index only.
  extend('flarum/forum/components/IndexPage', 'contentItems', function (this: any, items: ItemList<any>) {
    if (cfg()?.tiles !== 'top' || this.currentTag?.() || !('flarum-tags' in (flarum as any).extensions)) return;
    if (m.route.param('q')) return;
    items.add('duskTiles', <TagStrip />, 110);
  });

  // The radar under the index navigation.
  extend('flarum/forum/components/IndexSidebar', 'items', function (items: ItemList<any>) {
    // Index and tag lists only: the Tags page lays these items out as a row.
    if (cfg()?.radar && ['index', 'tag'].includes(app.current.get('routeName'))) items.add('duskRadar', <Radar />, -50);
  });

  // The Tags page: the same unread glow on its tiles.
  extend('ext:flarum/tags/forum/components/TagsPage', 'tagTileView', function (vdom: any, tag: any) {
    if (vdom?.attrs && isNew(tag)) vdom.attrs.className = (vdom.attrs.className || '') + ' DuskTile--new';
  });

  // Player cards: an XP ring and level pill around each post author's avatar (Renown).
  const ring = (vdom: any, user: any) => {
    const s = cfg()?.cards && standing(user);
    if (!s || !vdom?.attrs) return;
    vdom.attrs.className = (vdom.attrs.className || '') + ' DuskAvatar';
    vdom.attrs['data-level'] = s.level;
    vdom.attrs.style = { ...(vdom.attrs.style || {}), '--dusk-xp': s.pct + '%', '--dusk-level': s.level };
  };
  extend('flarum/forum/components/CommentPost', 'avatar', function (this: any, vdom: any) {
    ring(vdom, this.attrs.post.user?.());
  });
  // The XP on the whole post too: on phones core shows a second avatar in the header.
  extend('flarum/forum/components/CommentPost', 'elementAttrs', function (this: any, attrs: Record<string, any>) {
    const s = cfg()?.cards && standing(this.attrs.post.user?.());
    if (s) attrs.style = { ...(attrs.style || {}), '--dusk-xp': s.pct + '%' };
    if (s) attrs['data-dusk-level'] = s.level;
  });
  // On a profile the avatar may be the avatar editor, so it is wrapped rather than tagged.
  override('flarum/forum/components/UserCard', 'avatar', function (this: any, original: () => any) {
    const vdom = original();
    if (!String(this.attrs.className || '').includes('UserHero')) return vdom;
    const wrap: any = <span className="DuskAvatar-wrap">{vdom}</span>;
    ring(wrap, this.attrs.user);
    // Its pill sits on the avatar inside (CSS), not on the wrapper.
    wrap.attrs.className = 'DuskAvatar-wrap';
    return wrap;
  });

  // Profiles: the member's sky behind the card, and XP to the next level.
  extend('flarum/forum/components/UserCard', 'view', function (this: any, vdom: any) {
    if (!String(this.attrs.className || '').includes('UserHero') || !vdom?.children) return;
    const own = this.attrs.user?.attribute?.('duskSky');
    vdom.attrs.className += ' DuskCard';
    vdom.children.unshift(
      <Sky uid={'card' + this.attrs.user.id()} scene={cfg()?.profileSky && isScene(own) ? own : currentScene()} className="DuskSky--card" />
    );
  });

  extend('flarum/forum/components/UserCard', 'contentItems', function (this: any, items: ItemList<any>) {
    if (cfg()?.cards && standing(this.attrs.user)) items.add('duskXp', <XpPanel user={this.attrs.user} />, -20);
  });

  // The rank road above a member's posts.
  override('flarum/forum/components/PostsUserPage', 'content', function (this: any, original: () => any) {
    return [this.user && cfg()?.cards && standing(this.user) ? <RankRoad user={this.user} /> : null, original()];
  });

  // The paint shop button in the header.
  extend('flarum/forum/components/HeaderSecondary', 'items', function (items: ItemList<any>) {
    if (!cfg()?.paint) return;
    items.add(
      'duskPaint',
      <Button
        className="Button Button--icon Button--link DuskPaintButton"
        icon="fas fa-spray-can-sparkles"
        aria-label={String(t('paint.open'))}
        title={String(t('paint.open'))}
        onclick={() => app.modal.show(() => import('./components/PaintShopModal'))}
      />,
      15
    );
  });
});

let hud = false;

/** The phone bar, once, unless a Mobile Tab extension already gives the forum one. */
function mountHud() {
  const tabs = ['ernestdefoe-mobile-tab', 'acpl-mobile-tab', 'resofire-mobile-tab'];
  if (hud || !cfg()?.hud || tabs.some((id) => id in (flarum as any).extensions)) return;
  hud = true;
  const root = document.createElement('div');
  root.className = 'DuskHud-root';
  document.body.appendChild(root);
  document.documentElement.setAttribute('data-dusk-hud', 'on');
  m.mount(root, HudBar);
}

export { default as extend } from './extend';

import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import Icon from 'flarum/common/components/Icon';
import Avatar from 'flarum/common/components/Avatar';
import { startDiscussion, t } from '../util';

/** The phone's bottom bar (CSS shows it under 768px). Mounted once, outside the page. */
export default class HudBar extends Component {
  view() {
    const user = app.session.user;
    const route = app.current.get('routeName');
    const unread = user ? user.unreadNotificationCount?.() || 0 : 0;
    const tags = 'flarum-tags' in (flarum as any).extensions;
    const hidden = app.composer.isVisible?.() && app.composer.position !== 'minimized';

    return (
      <nav className={'DuskHud' + (hidden ? ' is-hidden' : '')} aria-label={String(t('hud.label'))}>
        <Link href={app.route('index')} className={'DuskHud-item' + (route === 'index' ? ' is-active' : '')}>
          <Icon name="fas fa-house" />
          <span>{t('hud.home')}</span>
        </Link>
        {tags ? (
          <Link href={app.route('tags')} className={'DuskHud-item' + (route === 'tags' ? ' is-active' : '')}>
            <Icon name="fas fa-tags" />
            <span>{t('hud.tags')}</span>
          </Link>
        ) : null}
        <button
          type="button"
          className="DuskHud-new"
          onclick={startDiscussion}
          aria-label={String(app.translator.trans('core.forum.index.start_discussion_button'))}
        >
          <Icon name="fas fa-plus" />
        </button>
        {user ? (
          <Link href={app.route('notifications')} className={'DuskHud-item' + (route === 'notifications' ? ' is-active' : '')}>
            <Icon name="fas fa-bell" />
            <span>{t('hud.alerts')}</span>
            {unread ? <span className="DuskHud-dot" aria-label={String(t('hud.unread', { count: unread }))} /> : null}
          </Link>
        ) : null}
        {user ? (
          <Link
            href={app.route.user(user)}
            className={'DuskHud-item' + (route?.startsWith('user') && app.current.get('user') === user ? ' is-active' : '')}
          >
            <Avatar user={user} className="DuskHud-avatar" />
            <span>{t('hud.me')}</span>
          </Link>
        ) : (
          <button type="button" className="DuskHud-item" onclick={() => app.modal.show(() => import('flarum/forum/components/LogInModal'))}>
            <Icon name="fas fa-right-to-bracket" />
            <span>{app.translator.trans('core.forum.header.log_in_link')}</span>
          </button>
        )}
      </nav>
    );
  }
}

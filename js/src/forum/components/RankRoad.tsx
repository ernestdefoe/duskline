import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import { rankName, standing, t } from '../util';

/** Three ranks behind, the current one, three ahead: Renown's ranks as a road. */
export default class RankRoad extends Component<{ user: any }> {
  view() {
    const user = this.attrs.user;
    const s = standing(user);
    if (!s) return null;
    const first = Math.max(1, Math.min(s.rank - 3, 20 - 6));
    const ranks = Array.from({ length: Math.min(7, 20) }, (_, i) => first + i);
    const done = ranks.indexOf(s.rank);
    const nextRankLevel = s.rank < 20 ? s.rank * 5 + 1 : null;
    let renownHref: string | null = null;
    try {
      renownHref = app.route('user.renown', { username: user.slug() });
    } catch {
      // Renown without its profile tab.
    }

    return (
      <section className="DuskRoad">
        <div className="DuskRoad-head">
          <h3 className="DuskRoad-title">{t('road.title')}</h3>
          <span className="DuskRoad-note">
            {nextRankLevel ? t('road.to_next', { count: nextRankLevel - s.level, rank: rankName(s.rank + 1) }) : t('road.top')}
          </span>
          {renownHref ? (
            <Link className="DuskRoad-all" href={renownHref}>
              {t('road.all')}
            </Link>
          ) : null}
        </div>
        <ol className="DuskRoad-track" style={{ '--done': done / (ranks.length - 1) }}>
          {ranks.map((rank) => (
            <li
              className={'DuskRoad-stop' + (rank < s.rank ? ' is-done' : rank === s.rank ? ' is-current' : '')}
              aria-current={rank === s.rank ? 'step' : undefined}
            >
              <i aria-hidden="true" />
              <span>{rankName(rank)}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }
}

import dayjs from 'dayjs';
import { Flame } from 'lucide-react';
import { PanelTitle, Progress } from './components';
import { dayIntake, macroSplit, macros, weekIntake, weekSummary } from './nutritionStats';
import './nutritionPanels.css';

const number = value => Number(value || 0).toLocaleString();
const macroLabel = { protein: 'Protein', carbs: 'Carbs', fat: 'Fat' };

export function MacroCards({ meals, burned = 0, targets }) {
  const intake = dayIntake(meals);
  const split = macroSplit(intake);
  const remaining = targets.calories - intake.calories;
  return <div className="nutrition-overview">
    <section className="panel calorie-panel">
      <span className="eyebrow">DAILY ENERGY</span>
      <div className="calorie-total">{number(Math.round(intake.calories))}<span>kcal logged</span></div>
      <Progress value={intake.calories} goal={targets.calories} className={intake.calories > targets.calories * 1.1 ? 'orange' : ''} />
      <p>{targets.calories ? remaining >= 0 ? `${number(Math.round(remaining))} kcal remaining in your target` : `${number(Math.round(-remaining))} kcal over your target` : 'Set a food target in My profile to track against it.'}{burned > 0 && <span className="energy-out"><Flame size={13} />{number(Math.round(burned))} kcal from workouts today · net {number(Math.round(intake.calories - burned))}</span>}</p>
      {intake.macrosMissing > 0 && <p className="fine-print">{intake.macrosMissing} of {intake.meals} meals have no macros recorded, so the cards below are a floor.</p>}
    </section>
    {macros.map(key => <section className={`panel macro ${key}`} key={key}>
      <span className="macro-dot" />
      <h3>{macroLabel[key]}</h3>
      <strong>{Math.round(intake[key] * 10) / 10}<span>g</span></strong>
      <Progress value={intake[key]} goal={targets[key]} className={key === 'carbs' ? 'orange' : key === 'fat' ? 'purple' : ''} />
      <p>{targets[key] ? `of ${targets[key]} g${targets.derived[key] ? '' : ' (your target)'}${split ? ` · ${split[key]}% of energy` : ''}` : 'Set a food target to see a goal'}</p>
    </section>)}
  </div>;
}

export function NutritionWeek({ data, date, onPickDate }) {
  const week = weekIntake(data, date);
  const start = dayjs(week.days[0].date), end = dayjs(week.days[6].date);
  const targetLine = week.targets.calories ? Math.min(100, week.targets.calories / week.max * 100) : null;
  return <section className="panel nutrition-week">
    <PanelTitle title="This week’s intake"><span className="muted">{start.format('D MMM')} – {end.format('D MMM')}</span></PanelTitle>
    <p className="muted week-summary">{weekSummary(week)}</p>
    <div className="intake-chart" role="img" aria-label={weekSummary(week)}>
      {targetLine !== null && <div className="intake-target" style={{ bottom: `${targetLine}%` }}><span>{number(week.targets.calories)} kcal target</span></div>}
      {week.days.map(day => <button type="button" key={day.date} className={`intake-day status-${day.status} ${day.isToday ? 'is-today' : ''} ${day.date === date ? 'is-selected' : ''} ${day.future ? 'future' : ''}`} disabled={day.future} onClick={() => onPickDate?.(day.date)} title={day.logged ? `${day.day}: ${number(day.calories)} kcal eaten${day.burned ? `, ${number(day.burned)} kcal from workouts` : ''}` : `${day.day}: nothing logged`}>
        <span className="intake-bar-space">
          {day.burned > 0 && <span className="intake-burned" style={{ height: `${Math.min(100, day.burned / week.max * 100)}%` }} aria-hidden="true" />}
          <span className="intake-bar" style={{ height: `${day.logged ? Math.max(3, day.calories / week.max * 100) : 0}%` }}>{day.logged && <span className="intake-value">{number(Math.round(day.calories))}</span>}</span>
        </span>
        <span className="intake-label">{day.day}</span>
      </button>)}
    </div>
    <div className="intake-legend"><span><i className="swatch on" />within target</span><span><i className="swatch over" />over</span><span><i className="swatch under" />under</span><span><i className="swatch burned" />workout calories</span><span className="muted">Tap a day to open its diary.</span></div>
    {week.loggedDays > 0 && <div className="intake-averages">{macros.map(key => <span key={key}><strong>{week.average[key]} g</strong> {macroLabel[key].toLowerCase()} / day{week.targets[key] ? ` · target ${week.targets[key]} g` : ''}</span>)}{week.total.burned > 0 && <span><strong>{number(week.total.burned)} kcal</strong> burned in workouts this week</span>}</div>}
  </section>;
}

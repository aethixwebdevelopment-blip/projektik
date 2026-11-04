import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp,
  Clock3, Dumbbell, Footprints, Heart, House, Info, ListChecks, Pause, Play,
  Settings2, ShieldCheck, Signal, SkipForward, Sparkles, Target, Timer, UserRound, Wifi,
  Waves, X,
} from 'lucide-react';
import { demoExercises } from '../data/demo-exercises';
import { demoProfile } from '../data/demo-profiles';
import { checkEligibility } from '../domain/eligibility';
import { buildWorkout, explainSwap, findSwaps } from '../domain/workout-generator';
import type { CompletedSession, Exercise, FeedbackRecord, Goal, MovementProfile, SessionContext } from '../domain/types';
import { clearDemoData, loadFeedback, loadHistory, loadProfile, saveFeedback, saveProfile, saveSession } from '../services/persistence';

type Screen = 'home' | 'guide' | 'profile' | 'plan' | 'daily' | 'preview' | 'detail' | 'swap' | 'active' | 'feedback' | 'history' | 'settings';
type Tab = 'home' | 'training' | 'history' | 'settings';
const goalNames: Record<Goal, string> = { strength: 'Sila', cardio: 'Kondícia', mobility: 'Mobilita' };
const goalOptions: { id: Goal; label: string; icon: typeof Dumbbell; detail: string }[] = [
  { id: 'strength', label: 'Sila', icon: Dumbbell, detail: 'Všeobecné posilnenie' },
  { id: 'cardio', label: 'Kondícia', icon: Heart, detail: 'Pohyb vo vlastnom tempe' },
  { id: 'mobility', label: 'Mobilita', icon: Waves, detail: 'Pohodlný rozsah pohybu' },
];
const movementOptions = [
  ['tlak-rukou', 'Tlačiť rukou'], ['tah-rukou', 'Ťahať rukou'],
  ['otocenie-trupu', 'Otočiť trup'], ['dosah-rukou', 'Dosiahnuť rukou'],
  ['pohyb-nohou', 'Pohybovať nohou'],
] as const;
const capabilityOptions = [
  ['ruka-lava', 'Ľavá ruka'], ['ruka-prava', 'Pravá ruka'],
  ['noha-lava', 'Ľavá noha'], ['noha-prava', 'Pravá noha'], ['kontrola-trupu', 'Kontrola trupu'],
] as const;
const positionOptions = [['v-sede', 'V sede'], ['v-stoje', 'V stoji'], ['na-podlozke', 'Na podložke']] as const;
const capabilityLabel: Record<string, string> = { available: 'Dostupná', limited: 'Obmedzená', unavailable: 'Nedostupná', unknown: 'Neviem / neuvádzam' };
const responseNames: Record<FeedbackRecord['response'], string> = {
  suitable: 'Vhodné', 'too-hard': 'Príliš náročné', 'too-easy': 'Príliš ľahké', uncomfortable: 'Nepríjemné', 'cannot-do': 'Nedokážem vykonať', another: 'Chcem inú možnosť',
};

function readContext(): SessionContext {
  return { goal: 'strength', environment: 'doma', equipment: ['odporova-guma'], space: 'small', durationMinutes: 20, preferredPosition: 'v-sede', dailyRestrictedMovements: [], demoMode: true };
}

export default function App() {
  const [profile, setProfile] = useState<MovementProfile>(loadProfile);
  const [screen, setScreen] = useState<Screen>('home');
  const [routeHistory, setRouteHistory] = useState<Screen[]>([]);
  const [tab, setTab] = useState<Tab>('home');
  const [context, setContext] = useState<SessionContext>(readContext);
  const [workout, setWorkout] = useState<Exercise[]>([]);
  const [workoutExplanation, setWorkoutExplanation] = useState('');
  const [source, setSource] = useState<Exercise | null>(null);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [feedbackExercise, setFeedbackExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<CompletedSession[]>(loadHistory);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>(loadFeedback);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [stopPrompt, setStopPrompt] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [tabNotice, setTabNotice] = useState('');

  const current = workout[activeIndex] ?? null;
  const candidateSwaps = useMemo(() => source ? findSwaps(demoExercises, profile, context, source, feedback, workout.filter((item) => item.id !== source.id).map((item) => item.id)) : [], [source, profile, context, feedback, workout]);
  const showScreen = (next: Screen, resetHistory = false) => {
    if (next !== screen) setRouteHistory((routes) => resetHistory ? [] : [...routes, screen]);
    setScreen(next); setTabNotice(''); document.querySelector('.app-content')?.scrollTo({ top: 0 });
  };
  const goBack = () => {
    const previous = routeHistory.at(-1) ?? 'home';
    if (previous === 'home' || previous === 'history' || previous === 'settings') setTab(previous);
    else if (['plan', 'daily', 'preview', 'detail', 'swap', 'active', 'feedback'].includes(previous)) setTab('training');
    setRouteHistory((routes) => routes.slice(0, -1)); setScreen(previous); setTabNotice('');
    document.querySelector('.app-content')?.scrollTo({ top: 0 });
  };
  const showPreviewAndCollapse = () => {
    setRouteHistory((routes) => { const previewIndex = routes.lastIndexOf('preview'); return previewIndex >= 0 ? routes.slice(0, previewIndex) : routes; });
    setScreen('preview'); setTabNotice(''); document.querySelector('.app-content')?.scrollTo({ top: 0 });
  };
  useEffect(() => { document.querySelector<HTMLElement>('.app-content')?.focus({ preventScroll: true }); }, [screen]);
  const commitProfile = (next: MovementProfile) => { const saved = { ...next, updatedAt: new Date().toISOString() }; setProfile(saved); const persisted = saveProfile(saved); setSavedNotice(persisted ? 'Profil sa uložil v tomto zariadení.' : 'Prehliadač nepovolil uložiť profil. Zmena platí iba do zatvorenia stránky.'); window.setTimeout(() => setSavedNotice(''), 3600); return persisted; };
  const startPlan = (resetHistory = false) => { setTab('training'); setContext((old) => ({ ...old, equipment: [...profile.equipmentAvailable], environment: profile.environments[0] ?? 'doma', durationMinutes: profile.preferredDurationMinutes })); showScreen('plan', resetHistory); };
  const generate = () => { const result = buildWorkout(demoExercises, profile, context, feedback); setWorkout(result.exercises); setWorkoutExplanation(result.explanation); setActiveIndex(0); setCompletedExerciseIds([]); showScreen('preview'); };
  const openSwap = (exercise: Exercise) => { setSource(exercise); setFeedbackExercise(exercise); showScreen('swap'); };
  const applySwap = (candidate: Exercise) => {
    const index = workout.findIndex((item) => item.id === source?.id);
    if (index < 0) { setTabNotice('Tento cvik už nie je v aktuálnom návrhu. Vráť sa k tréningu a skús inú možnosť.'); goBack(); return; }
    setWorkout((items) => items.map((item, i) => i === index ? candidate : item));
    setWorkoutExplanation('Vybraný cvik nahradil pôvodný. Alternatíva prešla rovnakými pravidlami vhodnosti; ostatné cviky zostali v pôvodnom poradí.');
    setSource(null); showPreviewAndCollapse(); setTab('training');
  };
  const beginWorkout = () => { setActiveIndex(0); setCompletedExerciseIds([]); setPaused(false); setSessionStarted(true); showScreen('active'); };
  const advanceWorkout = (skipCurrent: boolean) => {
    const done = skipCurrent || !current ? completedExerciseIds : [...completedExerciseIds, current.id];
    if (activeIndex + 1 < workout.length) { setCompletedExerciseIds(done); setActiveIndex((index) => index + 1); return; }
    if (!done.length) { setSessionStarted(false); setPaused(false); showScreen('home', true); setTab('home'); setTabNotice('Preskočil/a si všetky cviky. História sa nezmenila.'); return; }
    setCompletedExerciseIds(done); setStopPrompt(false);
    setFeedbackExercise(demoExercises.find((item) => item.id === done.at(-1)) ?? null); showScreen('feedback');
  };
  const recordFeedback = (response: FeedbackRecord['response']) => {
    const subject = feedbackExercise ?? current;
    const record: FeedbackRecord = { exerciseId: subject?.id ?? '', response, createdAt: new Date().toISOString() };
    const feedbackPersisted = saveFeedback(record); setFeedback((items) => [...items, record]);
    if (!sessionStarted) { setFeedbackExercise(null); setSource(null); showPreviewAndCollapse(); setTab('training'); setTabNotice(feedbackPersisted ? `Spätná väzba uložená: ${responseNames[response].toLowerCase()}. Bezpečnostné pravidlá sa nemenia.` : 'Spätná väzba platí iba do zatvorenia stránky; prehliadač ju nepovolil uložiť.'); return; }
    const session: CompletedSession = { id: crypto.randomUUID(), date: new Date().toISOString(), goal: context.goal, exerciseIds: completedExerciseIds, durationMinutes: Math.max(1, completedExerciseIds.length * 4), feedback: [record] };
    const sessionPersisted = saveSession(session); setHistory((items) => [session, ...items]); setSessionStarted(false); setFeedbackExercise(null); showScreen('home', true); setTab('home');
    setTabNotice(sessionPersisted ? `Tréning je dokončený. Ďakujeme za spätnú väzbu: ${responseNames[response].toLowerCase()}.` : 'Tréning je dokončený, ale prehliadač nepovolil uložiť ho do histórie.');
  };
  const finishWithoutFeedback = () => {
    if (!sessionStarted) { setFeedbackExercise(null); setSource(null); showPreviewAndCollapse(); setTab('training'); setTabNotice('Spätnú väzbu si preskočil/a. História sa nezmenila.'); return; }
    const session: CompletedSession = { id: crypto.randomUUID(), date: new Date().toISOString(), goal: context.goal, exerciseIds: completedExerciseIds, durationMinutes: Math.max(1, completedExerciseIds.length * 4), feedback: [] };
    const sessionPersisted = saveSession(session); setHistory((items) => [session, ...items]); setSessionStarted(false); setFeedbackExercise(null); showScreen('home', true); setTab('home'); setTabNotice(sessionPersisted ? 'Tréning je uložený. Spätnú väzbu môžeš doplniť pri ďalšej ukážke.' : 'Tréning je dokončený, ale prehliadač nepovolil uložiť ho do histórie.');
  };
  const stopSession = () => { setSessionStarted(false); setPaused(false); setStopPrompt(false); setCompletedExerciseIds([]); setFeedbackExercise(null); showScreen('home', true); setTab('home'); setTabNotice('Tréning bol zastavený. Nedokončenú ukážku sme neuložili do histórie.'); };
  const navigateTab = (next: Tab) => {
    setTab(next);
    if (next === 'home') showScreen('home', true);
    if (next === 'training') startPlan(true);
    if (next === 'history') showScreen('history', true);
    if (next === 'settings') showScreen('settings', true);
  };

  return <div className={`stage ${profile.accessibility.largeText ? 'large-text' : ''} ${profile.accessibility.highContrast ? 'high-contrast' : ''} ${profile.accessibility.reducedMotion ? 'reduce-motion' : ''} ${profile.accessibility.reducedTransparency ? 'reduce-transparency' : ''}`}>
    <a className="skip-link" href="#phone-main">Preskočiť na obsah aplikácie</a>
    <section className="story" aria-label="MOVE4ALL">
      <a className="brand-lockup" href="#home" onClick={(event) => { event.preventDefault(); navigateTab('home'); }} aria-label="MOVE4ALL, domov">
        <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M7 28.5 17.5 10l5 9 10.5-6"/><path d="m26.5 13 6.5 0-1.5 6.5"/><circle cx="7" cy="29" r="2.5"/><circle cx="17.5" cy="10" r="2.5"/></svg></span>
        <span>MOVE<span className="brand-four">4</span>ALL</span>
      </a>
      <div className="story-copy">
        <span className="story-kicker"><span className="live-dot" /> POHYB PRE ĽUDÍ SO ZDRAVOTNÝM POSTIHNUTÍM</span>
        <h1>Pohyb sa<br />prispôsobí <em>tebe.</em></h1>
        <p>Prístupný tréning pre ľudí so zdravotným postihnutím. Nastav si ho podľa svojich pohybových možností a tempa.</p>
        <button className="story-link" onClick={() => startPlan()}>Pozrieť demo tréning <ArrowRight size={17} aria-hidden="true" /></button>
      </div>
    </section>

    <div className="device-wrap">
      <div className="device-frame" aria-label="Ukážka aplikácie na iPhone 17 Pro">
        <div className="device-screen">
          <div className="dynamic-island" aria-hidden="true"><span /></div>
          <div className="status-row" aria-label="Stav zariadenia"><span>9:41</span><span className="status-icons" aria-hidden="true"><Signal size={14} /><Wifi size={13} /><span className="battery" /></span></div>
          <div className="app-topline">
            {screen !== 'active' && screen !== 'home' && screen !== 'history' && screen !== 'settings' ? <button className="icon-button back-button" aria-label="Späť na predchádzajúcu obrazovku" onClick={goBack}><ArrowLeft size={19} /></button> : <a className="app-brand" href="#home" onClick={(event) => { event.preventDefault(); if (screen === 'active') setStopPrompt(true); else navigateTab('home'); }} aria-label={screen === 'active' ? 'Otvoriť možnosti tréningu' : 'MOVE4ALL, domov'}><span className="app-brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M7 28.5 17.5 10l5 9 10.5-6"/><path d="m26.5 13 6.5 0-1.5 6.5"/><circle cx="7" cy="29" r="2.5"/><circle cx="17.5" cy="10" r="2.5"/></svg></span><span>MOVE<span className="brand-four">4</span>ALL</span></a>}
            {screen === 'active' && <span className="app-top-meta">{paused ? 'POZASTAVENÉ' : 'PRÁVE PREBIEHA'}</span>}
            <button className="icon-button top-settings" aria-label={screen === 'active' ? 'Zobraziť možnosti ukončenia tréningu' : 'Otvoriť nastavenia prístupnosti'} onClick={() => { if (screen === 'active') setStopPrompt(true); else { setTab('settings'); showScreen('settings'); } }}>{screen === 'active' ? <X size={18} /> : <Settings2 size={18} />}</button>
          </div>

          {tabNotice && <div className="inline-notice" role="status"><Check size={16} />{tabNotice}<button className="notice-close" onClick={() => setTabNotice('')} aria-label="Zavrieť oznámenie"><X size={16} /></button></div>}

          <div className="app-content" id="phone-main" role="main" tabIndex={-1}>
            {screen === 'home' && <HomeScreen profile={profile} history={history} onStart={startPlan} onProfile={() => showScreen('profile')} onGuide={() => showScreen('guide')} onHistory={() => navigateTab('history')} />}
            {screen === 'guide' && <GuideScreen onContinue={() => showScreen('profile')} />}
            {screen === 'profile' && <ProfileScreen profile={profile} onSave={(next) => { const persisted = commitProfile(next); showScreen('home', true); setTab('home'); setTabNotice(persisted ? 'Pohybový profil je uložený.' : 'Zmeny profilu sa po zatvorení stránky neuchovajú, lebo ich prehliadač nepovolil uložiť.'); }} />}
            {screen === 'plan' && <PlanScreen context={context} profile={profile} onChange={setContext} onContinue={() => showScreen('daily')} />}
            {screen === 'daily' && <DailyScreen context={context} onChange={setContext} onGenerate={generate} onStop={() => { showScreen('home', true); setTab('home'); setTabNotice('Tréning sa nezačal. Tvoje nastavenia profilu zostali bez zmeny.'); }} />}
            {screen === 'preview' && <PreviewScreen workout={workout} explanation={workoutExplanation} context={context} onStart={beginWorkout} onDetail={(item) => { setDetail(item); showScreen('detail'); }} onSwap={openSwap} onEdit={() => showScreen('plan')} />}
            {screen === 'detail' && detail && <DetailScreen exercise={detail} onSwap={() => openSwap(detail)} />}
            {screen === 'swap' && source && <SwapScreen source={source} candidates={candidateSwaps} profile={profile} context={context} onPick={applySwap} onFeedback={() => { setFeedbackExercise(source); showScreen('feedback'); }} />}
            {screen === 'active' && current && <ActiveScreen exercise={current} index={activeIndex} total={workout.length} paused={paused} stopPrompt={stopPrompt} onPause={() => setPaused((value) => !value)} onNext={() => advanceWorkout(false)} onSkip={() => advanceWorkout(true)} onStop={() => setStopPrompt(true)} onConfirmStop={stopSession} onCancelStop={() => setStopPrompt(false)} />}
            {screen === 'feedback' && <FeedbackScreen exercise={feedbackExercise ?? current ?? detail} onSubmit={recordFeedback} onSkip={finishWithoutFeedback} />}
            {screen === 'history' && <HistoryScreen sessions={history} />}
            {screen === 'settings' && <SettingsScreen profile={profile} savedNotice={savedNotice} onSave={commitProfile} onEditProfile={() => showScreen('profile')} onGuide={() => showScreen('guide')} onClear={() => { const cleared = clearDemoData(); setProfile(demoProfile); setHistory([]); setFeedback([]); setWorkout([]); setWorkoutExplanation(''); setCompletedExerciseIds([]); setSessionStarted(false); setPaused(false); setContext(readContext()); setTabNotice(cleared ? 'Lokálne demo dáta boli vymazané.' : 'Prehliadač nepovolil vymazať všetky lokálne demo dáta.'); }} />}
          </div>

          {screen !== 'active' && <nav className="bottom-nav" aria-label="Hlavná navigácia">
            <TabButton active={tab === 'home'} label="Denník" icon={ListChecks} onClick={() => navigateTab('home')} />
            <TabButton active={tab === 'training'} label="Tréning" icon={Activity} onClick={() => navigateTab('training')} />
            <TabButton active={tab === 'history'} label="História" icon={Clock3} onClick={() => navigateTab('history')} />
            <TabButton active={tab === 'settings'} label="Profil" icon={UserRound} onClick={() => navigateTab('settings')} />
          </nav>}
          {screen === 'active' && <div className="home-indicator" aria-hidden="true" />}
        </div>
      </div>
    </div>
    <div className="ambient-orb orb-one" aria-hidden="true" /><div className="ambient-orb orb-two" aria-hidden="true" />
  </div>;
}

function DemoBadge({ children = 'DEMO' }: { children?: string }) { return <span className="demo-badge"><span className="demo-dot" />{children}</span>; }
function SectionTitle({ title, description, eyebrow }: { title: string; description?: string; eyebrow?: string }) {
  return <div className="section-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>;
}
function PrimaryButton({ children, onClick, disabled, icon = true, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; icon?: boolean; type?: 'button' | 'submit' }) {
  return <button type={type} className="primary-button" onClick={onClick} disabled={disabled}>{children}{icon && <ArrowRight size={18} aria-hidden="true" />}</button>;
}
function DemoNotice() { return <div className="demo-notice"><Info size={17} aria-hidden="true" /><p><strong>Ukážkový obsah — nie odborne schválený tréning.</strong><br />MOVE4ALL nie je zdravotnícka pomôcka.</p></div>; }
function TabButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: typeof Activity; onClick: () => void }) {
  return <button className={`nav-tab ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClick}><span className="nav-icon"><Icon size={19} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" /></span><span>{label}</span></button>;
}

function HomeScreen({ profile, history, onStart, onProfile, onGuide, onHistory }: { profile: MovementProfile; history: CompletedSession[]; onStart: () => void; onProfile: () => void; onGuide: () => void; onHistory: () => void }) {
  return <div className="screen-stack home-screen">
    <div className="home-title-row"><SectionTitle title="Denník" /><button className="profile-orb" onClick={onProfile} aria-label="Upraviť pohybový profil"><UserRound size={20} /><span /></button></div>
    <div className="today-line"><span>Dnes · {new Date().toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span className="today-status"><span className="live-dot" /> Tvoj rytmus</span></div>
    <div className="daily-cards">
      <div className="metric-card white-card"><div className="metric-card-top"><span>Tréning</span><Activity size={17} aria-hidden="true" /></div><div className="card-rule"><span /></div><strong className="metric-label">Podľa teba</strong><span className="metric-sub">Cieľ, čas aj prostredie</span></div>
      <div className="metric-card white-card"><div className="metric-card-top"><span>Tvoj profil</span><UserRound size={17} aria-hidden="true" /></div><div className="card-rule"><span /></div><strong className="metric-label">{profile.supportedPositions.includes('v-sede') ? 'V sede' : 'Upraviteľný'}</strong><span className="metric-sub">Fiktívny ukážkový profil</span></div>
      <button className="metric-card white-card history-card" onClick={onHistory}><div className="metric-card-top"><span>Dokončené</span><Clock3 size={17} aria-hidden="true" /></div><div className="card-rule"><span /></div><strong className="metric-value">{history.length.toString().padStart(2, '0')}</strong><span className="metric-sub">ukážkových tréningov</span></button>
      <div className="metric-card white-card"><div className="metric-card-top"><span>Dnešné možnosti</span><Waves size={17} aria-hidden="true" /></div><div className="card-rule"><span /></div><strong className="metric-label">Menia sa?</strong><span className="metric-sub">Pred každým tréningom sa spýtame</span></div>
    </div>
    <DemoNotice />
    <section className="home-workout">
      <div className="home-workout-heading"><div><span className="eyebrow">TVORÍME PODĽA TVOJICH MOŽNOSTÍ</span><h2>Ďalší tréning</h2></div><span className="time-chip"><Clock3 size={14} /> {profile.preferredDurationMinutes} min</span></div>
      <div className="home-workout-card">
        <div className="workout-art" aria-hidden="true"><span className="art-line line-a"/><span className="art-line line-b"/><span className="art-node node-a"/><span className="art-node node-b"/><span className="art-node node-c"/><span className="art-label">M / 4</span></div>
        <div className="workout-card-copy"><DemoBadge /><h3>Začni po svojom</h3><p>Najprv si vyber cieľ. Potom skontrolujeme, čo ti dnes vyhovuje.</p></div>
        <button className="circle-arrow" onClick={onStart} aria-label="Vytvoriť tréning"><ArrowRight size={20} /></button>
      </div>
      <button className="text-link" onClick={onGuide}><CircleHelp size={16} /> Ako funguje MOVE4ALL?</button>
    </section>
  </div>;
}

function GuideScreen({ onContinue }: { onContinue: () => void }) {
  return <div className="screen-stack"><SectionTitle eyebrow="VITAJ V MOVE4ALL" title="Pohyb, ktorý ráta s tebou." description="MOVE4ALL je určená ľuďom so zdravotným postihnutím. Svoje možnosti si nastavuješ ty; na diagnózu sa nepýtame." /><DemoNotice />
    <div className="guide-list"><GuideItem icon={UserRound} title="Ty určuješ svoje možnosti" text="Označ pohyby, polohy a pomôcky, ktoré chceš použiť."/><GuideItem icon={Sparkles} title="Dnes sa môžeš cítiť inak" text="Denná kontrola upraví len tento tréning, nie tvoj uložený profil."/><GuideItem icon={ShieldCheck} title="Vieš, prečo sa cvik objavil" text="Náhrada musí prejsť pravidlami vhodnosti. Ak vhodná nie je, povieme to."/></div>
    <p className="privacy-line"><ShieldCheck size={15} /> Údaje zostávajú v tomto prehliadači.</p>
    <PrimaryButton onClick={onContinue}>Vytvoriť ukážkový profil</PrimaryButton>
  </div>;
}
function GuideItem({ icon: Icon, title, text }: { icon: typeof Activity; title: string; text: string }) { return <div className="guide-item"><span className="guide-icon"><Icon size={18} /></span><div><strong>{title}</strong><p>{text}</p></div></div>; }

function ProfileScreen({ profile, onSave }: { profile: MovementProfile; onSave: (profile: MovementProfile) => void }) {
  const [draft, setDraft] = useState<MovementProfile>(() => structuredClone(profile));
  const toggle = (key: 'availableMovements' | 'restrictedMovements' | 'supportedPositions' | 'equipmentAvailable', value: string) => setDraft((old) => {
    const list = old[key]; return { ...old, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
  });
  return <form className="screen-stack" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
    <SectionTitle eyebrow="TVOJE POHYBOVÉ MOŽNOSTI" title="Čo ti vyhovuje?" description="Vyber si len to, čo chceš uviesť. Neviem je plnohodnotná odpoveď." />
    <FieldLabel title="Meno pre tento profil"><input className="text-input" value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} aria-label="Meno pre tento profil" /></FieldLabel>
    <fieldset className="choice-fieldset"><legend>Aké pohyby chceš zahrnúť?</legend><p className="field-helper">Neoznačená schopnosť sa nepovažuje za potvrdenú.</p><div className="check-list">{movementOptions.map(([id, title]) => <CheckRow key={id} label={title} checked={draft.availableMovements.includes(id)} onChange={() => toggle('availableMovements', id)} />)}</div></fieldset>
    <fieldset className="choice-fieldset"><legend>Ktorý pohyb chceš obmedziť?</legend><p className="field-helper">Obmedzenie má vždy prednosť pred bodovaním.</p><div className="check-list">{movementOptions.map(([id, title]) => <CheckRow key={id} label={title} checked={draft.restrictedMovements.includes(id)} onChange={() => toggle('restrictedMovements', id)} />)}</div></fieldset>
    <fieldset className="choice-fieldset"><legend>Schopnosti (nepovinné)</legend><p className="field-helper">Môžeš vybrať „Neviem / neuvádzam“.</p><div className="capability-list">{capabilityOptions.map(([id, label]) => <label className="capability-row" key={id}><span>{label}</span><select aria-label={`Schopnosť: ${label}`} value={draft.limbCapabilities[id] ?? 'unknown'} onChange={(event) => setDraft({ ...draft, limbCapabilities: { ...draft.limbCapabilities, [id]: event.target.value as MovementProfile['limbCapabilities'][string] } })}>{Object.entries(capabilityLabel).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}</div></fieldset>
    <fieldset className="choice-fieldset"><legend>Poloha, ktorá ti vyhovuje</legend><div className="check-list">{positionOptions.map(([id, label]) => <CheckRow key={id} label={label} checked={draft.supportedPositions.includes(id)} onChange={() => toggle('supportedPositions', id)} />)}</div></fieldset>
    <fieldset className="choice-fieldset"><legend>Pomôcky a miesto</legend><div className="check-list"><CheckRow label="Odporová guma" checked={draft.equipmentAvailable.includes('odporova-guma')} onChange={() => toggle('equipmentAvailable', 'odporova-guma')} /><CheckRow label="Doma" checked={draft.environments.includes('doma')} onChange={() => setDraft({ ...draft, environments: draft.environments.includes('doma') ? draft.environments.filter((x) => x !== 'doma') : [...draft.environments, 'doma'] })} /><CheckRow label="Fitko" checked={draft.environments.includes('fitko')} onChange={() => setDraft({ ...draft, environments: draft.environments.includes('fitko') ? draft.environments.filter((x) => x !== 'fitko') : [...draft.environments, 'fitko'] })} /></div></fieldset>
    <label className="range-label">Zvyčajný čas <strong>{draft.preferredDurationMinutes} min</strong><input type="range" min="10" max="40" step="5" value={draft.preferredDurationMinutes} onChange={(event) => setDraft({ ...draft, preferredDurationMinutes: Number(event.target.value) })} /></label>
    <DemoNotice /><PrimaryButton type="submit">Uložiť pohybový profil</PrimaryButton>
  </form>;
}
function FieldLabel({ title, children }: { title: string; children: React.ReactNode }) { return <label className="field-label">{title}{children}</label>; }
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) { return <label className={`check-row ${checked ? 'checked' : ''}`}><input type="checkbox" checked={checked} onChange={onChange} /><span className="fake-check"><Check size={14} /></span><span>{label}</span></label>; }

function PlanScreen({ context, profile, onChange, onContinue }: { context: SessionContext; profile: MovementProfile; onChange: (context: SessionContext) => void; onContinue: () => void }) {
  const update = (partial: Partial<SessionContext>) => onChange({ ...context, ...partial });
  return <div className="screen-stack"><SectionTitle eyebrow="TVORBA TRÉNINGU" title="Čo ti dnes vyhovuje?" description="Nastavenia upravíš pred každým tréningom." />
    <fieldset className="choice-fieldset"><legend>Vyber všeobecný cieľ</legend><div className="goal-options">{goalOptions.map(({ id, label, icon: Icon, detail }) => <button key={id} className={`goal-option ${context.goal === id ? 'selected' : ''}`} aria-pressed={context.goal === id} onClick={() => update({ goal: id })}><Icon size={20} /><span><strong>{label}</strong><small>{detail}</small></span><span className="radio-dot" /></button>)}</div></fieldset>
    <fieldset className="choice-fieldset"><legend>Kde budeš cvičiť?</legend><div className="segmented-options">{[['doma', 'Doma'], ['fitko', 'Fitko'], ['vonku', 'Vonku']].map(([id, label]) => <button key={id} aria-pressed={context.environment === id} className={context.environment === id ? 'selected' : ''} onClick={() => update({ environment: id, equipment: id === 'doma' ? profile.equipmentAvailable : [] })}>{id === 'doma' ? <House size={17} /> : id === 'fitko' ? <Dumbbell size={17} /> : <Footprints size={17} />}{label}</button>)}</div></fieldset>
    <fieldset className="choice-fieldset"><legend>Aký veľký priestor máš?</legend><div className="segmented-options">{[['small', 'Malý'], ['medium', 'Stredný'], ['large', 'Voľný']].map(([id, label]) => <button key={id} aria-pressed={context.space === id} className={context.space === id ? 'selected' : ''} onClick={() => update({ space: id as SessionContext['space'] })}>{label}</button>)}</div></fieldset>
    <fieldset className="choice-fieldset"><legend>Dostupné pomôcky</legend><div className="check-list">{profile.equipmentAvailable.length ? profile.equipmentAvailable.map((item) => <CheckRow key={item} label={item === 'odporova-guma' ? 'Odporová guma' : item} checked={context.equipment.includes(item)} onChange={() => update({ equipment: context.equipment.includes(item) ? context.equipment.filter((x) => x !== item) : [...context.equipment, item] })} />) : <p className="field-helper">V profile nemáš uložené pomôcky.</p>}</div></fieldset>
    <label className="range-label">Koľko času máš? <strong>{context.durationMinutes} min</strong><input type="range" min="10" max="40" step="5" value={context.durationMinutes} onChange={(event) => update({ durationMinutes: Number(event.target.value) })} /></label>
    <PrimaryButton onClick={onContinue}>Pokračovať na dennú kontrolu</PrimaryButton>
  </div>;
}

function DailyScreen({ context, onChange, onGenerate, onStop }: { context: SessionContext; onChange: (context: SessionContext) => void; onGenerate: () => void; onStop: () => void }) {
  const same = context.dailyRestrictedMovements.length === 0 && context.dailyDifficultyCap !== 1;
  return <div className="screen-stack"><SectionTitle eyebrow="DAILY ADAPT" title="Ako sa dnes cítiš?" description="Tvoje odpovede upravia iba tento tréning. Uložený profil sa nezmení." />
    <div className="daily-question"><strong>Sú tvoje možnosti dnes rovnaké ako obvykle?</strong><div className="choice-pills"><button aria-pressed={same} className={same ? 'selected' : ''} onClick={() => onChange({ ...context, dailyRestrictedMovements: [], dailyDifficultyCap: undefined })}>Áno, rovnaké</button><button aria-pressed={!same} className={!same ? 'selected' : ''} onClick={() => onChange({ ...context, dailyDifficultyCap: 1 })}>Chcem jemnejšie tempo</button></div></div>
    <fieldset className="choice-fieldset"><legend>Je nejaký pohyb dnes nedostupný?</legend><p className="field-helper">Môžeš vybrať viac možností alebo nič.</p><div className="check-list">{movementOptions.slice(0, 4).map(([id, label]) => <CheckRow key={id} label={label} checked={context.dailyRestrictedMovements.includes(id)} onChange={() => onChange({ ...context, dailyRestrictedMovements: context.dailyRestrictedMovements.includes(id) ? context.dailyRestrictedMovements.filter((item) => item !== id) : [...context.dailyRestrictedMovements, id] })} />)}</div></fieldset>
    <div className="gentle-callout"><Heart size={18} /><p>Ak cítiš nepríjemný alebo nezvyčajný pocit, tréning prerušíš. Ak pretrváva, obráť sa na odborníka.</p></div>
    <DemoNotice /><PrimaryButton onClick={onGenerate}>Zobraziť návrh tréningu</PrimaryButton><button className="secondary-button" onClick={onStop}>Dnes nezačínať</button>
  </div>;
}

function PreviewScreen({ workout, explanation, context, onStart, onDetail, onSwap, onEdit }: { workout: Exercise[]; explanation: string; context: SessionContext; onStart: () => void; onDetail: (item: Exercise) => void; onSwap: (item: Exercise) => void; onEdit: () => void }) {
  const duration = workout.length ? `približne ${Math.min(context.durationMinutes, workout.length * 4)} min` : 'bez vhodnej ukážky';
  return <div className="screen-stack"><SectionTitle eyebrow="TVOJ NÁVRH" title="Tréning na mieru" description={`${goalNames[context.goal]} · ${context.environment === 'doma' ? 'Doma' : context.environment === 'fitko' ? 'Fitko' : 'Vonku'} · ${duration}`} />
    <DemoNotice /><p className="why-line"><Sparkles size={17} />{explanation}</p>
    {workout.length === 0 ? <div className="empty-state"><span className="empty-icon"><CircleHelp /></span><h2>Vhodný návrh sa nenašiel</h2><p>Skús upraviť cieľ, pomôcky alebo dnešné podmienky. Môžeš zmeniť aj pohybový profil; sám sa tým nezmení.</p><button className="secondary-button" onClick={onEdit}>Upraviť nastavenia</button></div> : <div className="exercise-list">{workout.map((item, index) => <ExerciseCard key={item.id} exercise={item} index={index} onDetail={() => onDetail(item)} onSwap={() => onSwap(item)} />)}</div>}
    {workout.length > 0 && <><button className="secondary-button" onClick={onEdit}>Upraviť cieľ a podmienky</button><PrimaryButton onClick={onStart}>Spustiť ukážkový tréning</PrimaryButton></>}
  </div>;
}
function ExerciseCard({ exercise, index, onDetail, onSwap }: { exercise: Exercise; index: number; onDetail: () => void; onSwap: () => void }) {
  const goal = exercise.goals[0] ? goalNames[exercise.goals[0]] : 'Pohyb';
  return <article className="exercise-card"><div className="exercise-head"><span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><DemoBadge /><span className="exercise-position">{exercise.supportedPositions.map((position) => position === 'v-sede' ? 'V sede' : position).join(', ')}</span></div><button className="exercise-title-button" onClick={onDetail}><span><h2>{exercise.title}</h2><p>{exercise.description}</p></span><ChevronRight size={20} /></button><div className="exercise-meta"><span><Target size={14} />{goal}</span><span><Timer size={14} />Ukážka · 4 min</span></div><div className="exercise-actions"><button onClick={onDetail}>Detail cviku</button><button onClick={onSwap}>Smart Swap <ArrowRight size={15} /></button></div></article>;
}

function DetailScreen({ exercise, onSwap }: { exercise: Exercise; onSwap: () => void }) {
  return <div className="screen-stack"><SectionTitle eyebrow="DETAIL CVIKU" title={exercise.title} description={exercise.description} /><DemoBadge />
    <div className="media-placeholder" role="img" aria-label="Video ukážka zatiaľ nie je k dispozícii. Textový návod je uvedený nižšie."><div className="media-orbit"><span className="orbit-point" /></div><span>VIDEO ZATIAĽ NIE JE K DISPOZÍCII</span><small>Textový návod nižšie je plnohodnotnou alternatívou.</small></div>
    <section className="instruction-section"><h2>Ako to funguje</h2><ol>{exercise.instructions.map((line, index) => <li key={line}><span>{index + 1}</span><p>{line}</p></li>)}</ol></section>
    <section className="detail-facts"><span><strong>Poloha</strong>{exercise.supportedPositions.map((p) => p.replace('v-sede', 'V sede')).join(', ')}</span><span><strong>Pomôcky</strong>{exercise.requiredEquipment.length ? exercise.requiredEquipment.map((x) => x === 'odporova-guma' ? 'Odporová guma' : x).join(', ') : 'Žiadne'}</span><span><strong>Priestor</strong>{exercise.spaceRequirement === 'small' ? 'Malý' : exercise.spaceRequirement === 'medium' ? 'Stredný' : 'Voľný'}</span></section>
    <div className="safety-note"><Info size={17} /><p>{exercise.safetyNotes.join(' ')}</p></div>
    <PrimaryButton onClick={onSwap}>Chcem inú možnosť</PrimaryButton>
  </div>;
}

function SwapScreen({ source, candidates, profile, context, onPick, onFeedback }: { source: Exercise; candidates: Exercise[]; profile: MovementProfile; context: SessionContext; onPick: (candidate: Exercise) => void; onFeedback: () => void }) {
  return <div className="screen-stack"><SectionTitle eyebrow="SMART SWAP" title="Nájdi inú možnosť" description={`Náhrada za: ${source.title}`} /><DemoNotice />
    <div className="why-line"><Sparkles size={17} />Najprv sme použili rovnaké pravidlá vhodnosti. Až potom sme zoradili zvyšné ukážkové možnosti.</div>
    {candidates.length === 0 ? <div className="empty-state"><span className="empty-icon"><ShieldCheck /></span><h2>Momentálne nemáme vhodnú alternatívu</h2><p>Žiadny ďalší ukážkový cvik so zhodným cieľom neprešiel kontrolou pre tvoje aktuálne podmienky.</p><p className="quiet-small">Nevytvorili sme náhradu odhadom.</p></div> : <div className="swap-list">{candidates.map((item) => { const check = checkEligibility(item, profile, context); return <article className="swap-card" key={item.id}><div className="swap-heading"><DemoBadge /><span className="safe-label"><Check size={14} /> Prešiel pravidlami</span></div><h2>{item.title}</h2><p>{explainSwap(item, source, profile, context)}</p><button className="secondary-button" onClick={() => onPick(item)}>Vybrať túto možnosť <ArrowRight size={16} /></button><span className="sr-only">Kontrola: {check.eligible ? 'vhodný pre tento demo profil a zadané podmienky' : check.reasons.join(', ')}</span></article>; })}</div>}
    <button className="text-link" onClick={onFeedback}>Táto možnosť mi nevyhovuje</button>
  </div>;
}

function ActiveScreen({ exercise, index, total, paused, stopPrompt, onPause, onNext, onSkip, onStop, onConfirmStop, onCancelStop }: { exercise: Exercise; index: number; total: number; paused: boolean; stopPrompt: boolean; onPause: () => void; onNext: () => void; onSkip: () => void; onStop: () => void; onConfirmStop: () => void; onCancelStop: () => void }) {
  return <div className="screen-stack active-screen"><SectionTitle eyebrow="UKÁŽKOVÝ TRÉNING" title={paused ? 'Tréning je pozastavený' : 'Tvoj pohyb. Tvoje tempo.'} description={`Cvik ${index + 1} z ${total} · približne 4 min na ukážku`} />
    <div className="active-progress" aria-label={`Postup, cvik ${index + 1} z ${total}`}><span style={{ transform: `scaleX(${(index + 1) / total})` }} /></div><DemoBadge /><article className="exercise-card active-exercise"><div className="exercise-head"><span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><span className="exercise-position">{exercise.supportedPositions.map((position) => position === 'v-sede' ? 'V sede' : position).join(', ')}</span></div><h2>{exercise.title}</h2><p>{exercise.description}</p><div className="active-instructions"><strong>Ukážkový postup</strong>{exercise.instructions.map((line, i) => <p key={line}><span>{i + 1}</span>{line}</p>)}</div><p className="quiet-small">{paused ? 'Pokračuj, keď ti to bude vyhovovať.' : 'Pokojne si urob prestávku. Môžeš kedykoľvek skončiť.'}</p></article>
    <div className="active-controls"><button className="pause-button" onClick={onPause} aria-label={paused ? 'Pokračovať v tréningu' : 'Pozastaviť tréning'}>{paused ? <Play size={20} /> : <Pause size={20} />}</button><button className="next-button" onClick={onNext} disabled={paused}>{index + 1 === total ? 'Dokončiť tréning' : 'Ďalší cvik'} <ArrowRight size={18} /></button><button className="skip-button" onClick={onSkip} disabled={paused}><SkipForward size={16} /> Preskočiť cvik</button></div>
    <button className="stop-link" onClick={onStop}>Zastaviť tréning</button>
    {stopPrompt && <div className="inline-confirm" role="alert"><strong>Chceš zastaviť teraz?</strong><p>Tréning sa neuloží ako dokončený.</p><div><button className="danger-button" onClick={onConfirmStop}>Zastaviť</button><button className="secondary-button" onClick={onCancelStop}>Pokračovať</button></div></div>}
  </div>;
}

function FeedbackScreen({ exercise, onSubmit, onSkip }: { exercise: Exercise | null; onSubmit: (response: FeedbackRecord['response']) => void; onSkip: () => void }) {
  const options: { key: FeedbackRecord['response']; label: string }[] = [
    { key: 'suitable', label: 'Vhodné' }, { key: 'too-hard', label: 'Príliš náročné' }, { key: 'too-easy', label: 'Príliš ľahké' },
    { key: 'uncomfortable', label: 'Nepríjemné' }, { key: 'cannot-do', label: 'Nedokážem vykonať' }, { key: 'another', label: 'Chcem inú možnosť' },
  ];
  return <div className="screen-stack"><SectionTitle eyebrow="TVOJ NÁZOR" title="Ako ti to vyhovovalo?" description={exercise ? `Tvoja odpoveď sa týka ukážky „${exercise.title}“.` : 'Spätná väzba nám pomáha zoradiť ďalšie návrhy.'} /><DemoNotice />
    <div className="feedback-options">{options.map(({ key, label }) => <button className="feedback-option" key={key} onClick={() => onSubmit(key)}><span>{label}</span><ChevronRight size={17} /></button>)}</div>
    <p className="field-helper">Tvoja odpoveď nemení bezpečnostné pravidlá ani pôvodný profil.</p><button className="text-link" onClick={onSkip}>Preskočiť spätnú väzbu</button>
  </div>;
}

function HistoryScreen({ sessions }: { sessions: CompletedSession[] }) {
  return <div className="screen-stack"><SectionTitle eyebrow="TVOJ ZÁZNAM" title="História" description="Zobrazuje iba tréningy, ktoré si dokončil/a v tomto zariadení." />
    <div className="history-summary"><span className="history-count">{String(sessions.length).padStart(2, '0')}</span><span>uložených ukážkových tréningov</span></div>
    {sessions.length === 0 ? <div className="empty-state"><span className="empty-icon"><Clock3 /></span><h2>Zatiaľ tu nič nie je</h2><p>Keď dokončíš ukážkový tréning, objaví sa tu dátum, cieľ a tvoja spätná väzba.</p></div> : <div className="history-list">{sessions.map((session) => <article className="history-row" key={session.id}><div className="history-date"><strong>{new Date(session.date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })}</strong><span>{new Date(session.date).toLocaleDateString('sk-SK', { weekday: 'long' })}</span></div><div><DemoBadge /><h2>{goalNames[session.goal]} · demo</h2><p>{session.exerciseIds.length} ukážok · približne {session.durationMinutes} min</p>{session.feedback.map((item, index) => <small key={index}>Spätná väzba: {responseNames[item.response]}</small>)}</div><Check size={18} className="history-check" /></article>)}</div>}
    <p className="field-helper">Progres zobrazuje iba tvoje vlastné dokončené tréningy. Porovnávanie s inými ľuďmi tu nie je.</p>
  </div>;
}

function SettingsScreen({ profile, savedNotice, onSave, onEditProfile, onGuide, onClear }: { profile: MovementProfile; savedNotice: string; onSave: (profile: MovementProfile) => void; onEditProfile: () => void; onGuide: () => void; onClear: () => void }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const setting = (key: keyof MovementProfile['accessibility'], title: string, description: string) => <label className="setting-row" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" role="switch" checked={profile.accessibility[key]} onChange={(event) => onSave({ ...profile, accessibility: { ...profile.accessibility, [key]: event.target.checked } })} /></label>;
  return <div className="screen-stack"><SectionTitle eyebrow="TVOJE NASTAVENIA" title="Prispôsob si zážitok" description="Toto nastavenie sa uloží iba v tomto prehliadači." />
    <div className="settings-profile"><div className="profile-monogram">{profile.displayName.trim().slice(0, 1).toUpperCase() || 'M'}</div><div><strong>{profile.displayName || 'Tvoj profil'}</strong><small>Fiktívny ukážkový profil</small></div><button className="icon-button" onClick={onEditProfile} aria-label="Upraviť pohybový profil"><ArrowRight size={18} /></button></div>
    <section className="settings-section"><h2>Prístupnosť</h2>{setting('largeText', 'Väčšie písmo', 'Zväčší text a nechá ho zalomiť.')}{setting('highContrast', 'Vyšší kontrast', 'Zvýrazní deliace čiary a text.')}{setting('reducedMotion', 'Obmedziť pohyb', 'Vypne ozdobné animácie.')}{setting('reducedTransparency', 'Obmedziť priehľadnosť', 'Sklenené ovládanie nahradí nepriehľadným.')}<p className="field-helper">Hlasové pokyny a video v tejto ukážke nie sú dostupné. Textový návod zostáva vždy zobrazený.</p></section>
    <section className="settings-section"><h2>Súkromie a pomoc</h2><p className="settings-copy"><ShieldCheck size={17} /> Demo údaje sa ukladajú iba lokálne. Nepoužívame skutočné zdravotné údaje ani externé API.</p><button className="secondary-button" onClick={onGuide}>Ako funguje MOVE4ALL?</button></section>
    <section className="settings-section destructive-section"><h2>Demo údaje</h2><p>Vymaž uložený profil, históriu a spätnú väzbu z tohto prehliadača.</p>{confirmClear ? <div className="inline-confirm"><strong>Vymazať všetky lokálne demo dáta?</strong><div><button className="danger-button" onClick={() => { onClear(); setConfirmClear(false); }}>Áno, vymazať</button><button className="secondary-button" onClick={() => setConfirmClear(false)}>Zrušiť</button></div></div> : <button className="danger-outline" onClick={() => setConfirmClear(true)}>Vymazať lokálne demo dáta</button>}</section>
    {savedNotice && <p className="saved-feedback" role="status"><Check size={16} />{savedNotice}</p>}
    <p className="legal-note">MOVE4ALL je všeobecná ukážka fitness aplikácie. Neurčuje diagnózu a nenahrádza odbornú pomoc.</p>
  </div>;
}

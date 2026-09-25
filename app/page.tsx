'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localizeError, localizeQuestion, messages, type Locale, type MessageKey } from './i18n';
import { AVATARS, DEFAULT_AVATAR } from '@/lib/avatars';

type Player = { id: string; name: string; score: number; avatar?: string };
type Game = {
  code: string; host: string; players: Player[]; phase: string; round: number; total: number;
  spotlight: string; question: { q: string; a: string[] }; answer: number | null;
  hasAnswered: boolean; guessed: string[]; myGuess: number | null; earned: Record<string, number>;
  winner: string | null; chosen: string | null; miniKind: string | null;
  miniIndex: number | null; miniDone: boolean;
};
type Session = { code: string; token: string; me: string };
const storeKey = 'inside-joke-session';
const languageKey = 'inside-joke-language';
const avatarKey = 'inside-joke-avatar';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [savedSession, setSavedSession] = useState<Session | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [invitedRoom, setInvitedRoom] = useState('');
  const [entryMode, setEntryMode] = useState<'create' | 'join'>('create');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState<Locale>('en');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const t = (key: MessageKey) => messages[locale][key];

  const refresh = useCallback(async (s: Session) => {
    try {
      const r = await fetch(`/api/game?code=${encodeURIComponent(s.code)}&token=${encodeURIComponent(s.token)}`, { cache: 'no-store' });
      const d = await r.json() as { game: Game; error?: string };
      if (r.ok) { setGame(d.game); setError(''); }
      else if (r.status === 403 || r.status === 404) {
        setSession(null); setSavedSession(null); setGame(null); localStorage.removeItem(storeKey);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(languageKey);
    const initial: Locale = savedLanguage === 'es' || (!savedLanguage && navigator.language.toLowerCase().startsWith('es')) ? 'es' : 'en';
    setLocale(initial);
    document.documentElement.lang = initial;
    document.title = initial === 'es' ? 'Inside Joke — Juego entre amigos' : 'Inside Joke — Party Game';
    const savedAvatar = localStorage.getItem(avatarKey);
    if (savedAvatar && AVATARS.some(item => item === savedAvatar)) setAvatar(savedAvatar);
    const saved = localStorage.getItem(storeKey);
    if (saved) {
      try { const s = JSON.parse(saved) as Session; if (s.code && s.token && s.me) setSavedSession(s); else localStorage.removeItem(storeKey); }
      catch { localStorage.removeItem(storeKey); }
    }
    const code = new URLSearchParams(location.search).get('room')?.trim().toUpperCase() || '';
    if (/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/.test(code)) {
      setRoomCode(code);
      setInvitedRoom(code);
      setEntryMode('join');
    }
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => refresh(session), 1500);
    return () => clearInterval(timer);
  }, [session, refresh]);

  function changeLanguage(value: Locale) {
    setLocale(value);
    localStorage.setItem(languageKey, value);
    document.documentElement.lang = value;
    document.title = value === 'es' ? 'Inside Joke — Juego entre amigos' : 'Inside Joke — Party Game';
  }

  function chooseAvatar(value: string) {
    setAvatar(value);
    localStorage.setItem(avatarKey, value);
  }

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if ((action === 'create' || action === 'join') && !name.trim()) {
      setError('Enter your name');
      document.getElementById('name')?.focus();
      return;
    }
    if (action === 'join' && roomCode.length !== 5) {
      setError('Enter a five-character code');
      document.getElementById('code')?.focus();
      return;
    }
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/game', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, code: session?.code || roomCode.trim().toUpperCase(), token: session?.token || (action === 'join' && savedSession?.code === roomCode ? savedSession.token : undefined), name: name.trim(), avatar, ...extra }),
      });
      const d = await r.json() as { game: Game; code: string; token: string; me: string; error?: string };
      if (!r.ok) throw new Error(d.error || 'Please try again');
      if (action === 'create' || action === 'join') {
        const s = { code: d.code, token: d.token, me: d.me };
        setSession(s);
        setSavedSession(s);
        setInvitedRoom('');
        localStorage.setItem(storeKey, JSON.stringify(s));
        history.replaceState(null, '', `/?room=${d.code}`);
      }
      setGame(d.game);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again'); }
    finally { setBusy(false); }
  }

  const me = game?.players.find(x => x.id === session?.me);
  const spot = game?.players.find(x => x.id === game.spotlight);
  const chosen = game?.players.find(x => x.id === game.chosen);
  const winner = game?.players.find(x => x.id === game.winner);
  const finalWinners = game?.phase === 'finished' ? game.players.filter(x => x.score === Math.max(...game.players.map(p => p.score))) : [];
  const isSpot = me?.id === spot?.id;
  const isChosen = me?.id === chosen?.id;
  const question = game ? localizeQuestion(game.question, locale) : null;
  const showError = error && <p className="error" role="alert">{localizeError(error, locale)}</p>;

  return <div className="shell">
    <header className={session && game ? 'top' : 'top cover-top'}>
      {session && game && <div className="brand"><img className="brand-logo" src="/inside-joke-logo.webp" alt="Inside Joke" /></div>}
      <div className="top-actions">
        <span className="pill">{t('tagline')}</span>
        <div className="language-switch" role="group" aria-label={locale === 'es' ? 'Idioma' : 'Language'}>
          <button type="button" lang="es" aria-pressed={locale === 'es'} className={locale === 'es' ? 'active' : ''} onClick={() => changeLanguage('es')}>Español</button>
          <button type="button" lang="en" aria-pressed={locale === 'en'} className={locale === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>English</button>
        </div>
      </div>
    </header>

    {!session || !game ? <div className="landing">
      <section className="intro">
        <img className="cover-art" src="/inside-joke-cover.webp" alt={t('coverAlt')} />
        <div className="eyebrow">{t('friendTest')}</div>
        <h1>{t('headline')}</h1>
        <p>{t('intro')}</p>
        <div className="intro-meta"><span>{t('playersRange')}</span><span>{t('ownDevice')}</span></div>
      </section>
      <div className="joinbox">
        <div className="form-kicker">{t('startPlaying')}</div>
        {!invitedRoom && <div className="entry-modes" role="group" aria-label={t('entryMethod')}>
          <button type="button" className={entryMode === 'create' ? 'entry-mode selected' : 'entry-mode'} aria-pressed={entryMode === 'create'} onClick={() => { setEntryMode('create'); setError(''); }}>{t('hostMode')}</button>
          <button type="button" className={entryMode === 'join' ? 'entry-mode selected' : 'entry-mode'} aria-pressed={entryMode === 'join'} onClick={() => { setEntryMode('join'); setError(''); }}>{t('joinMode')}</button>
        </div>}
        <h2>{invitedRoom ? t('invitedToRoom') : entryMode === 'join' ? t('joinWithCode') : t('createRoom')}</h2>
        {invitedRoom && <div className="invite-code">{invitedRoom}</div>}
        {savedSession && (!invitedRoom || invitedRoom === savedSession.code) && <Button className="btn ghost resume-room" onClick={() => {
          setSession(savedSession);
          history.replaceState(null, '', `/?room=${savedSession.code}`);
          refresh(savedSession);
        }}>{t('resumeRoom')} {savedSession.code}</Button>}
        <label className="field" htmlFor="name">{t('yourName')}</label>
        <Input id="name" className="input" maxLength={24} value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')}/>
        <fieldset className="avatar-picker">
          <legend className="field">{t('chooseAvatar')}</legend>
          <div className="avatar-choices">{AVATARS.map((choice, index) => <button key={choice} type="button" className={avatar === choice ? 'avatar-choice selected' : 'avatar-choice'} aria-pressed={avatar === choice} aria-label={`${t('avatar')} ${index + 1}: ${choice}`} onClick={() => chooseAvatar(choice)}>{choice}</button>)}</div>
        </fieldset>
        {entryMode === 'join' && <><label className="field" htmlFor="code">{t('roomCodeJoin')}</label>
        <Input id="code" className="input" maxLength={5} autoCapitalize="characters" value={roomCode} onChange={e => {
          const nextCode = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '');
          setRoomCode(nextCode);
          if (invitedRoom && nextCode !== invitedRoom) setInvitedRoom('');
        }} placeholder="ABCDE"/></>}
        {entryMode === 'join' ? <Button className="btn invite-join" disabled={busy} onClick={() => act('join')}>{t('joinRoom')}{roomCode.length === 5 ? ` ${roomCode}` : ''}</Button>
          : <Button className="btn invite-join" disabled={busy} onClick={() => act('create')}>{t('createRoom')}</Button>}
        {showError}
        <p className="hint">{entryMode === 'join' ? t('joinHint') : t('hostShares')}</p>
      </div>
    </div> : <>
      <div className="roomhead">
        <div><div className="eyebrow">{t('roomCode')}</div><div className="code">{game.code}</div></div>
        <div className="roomhead-actions"><Button className="btn alt" onClick={() => {
          setSavedSession(session);
          setSession(null);
          setGame(null);
          setInvitedRoom('');
          setEntryMode('create');
          history.replaceState(null, '', '/');
        }}>{t('viewHome')}</Button><Button className="btn ghost" onClick={async () => {
          try {
            await navigator.clipboard.writeText(game.code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2200);
          } catch {}
        }}>{copiedCode ? t('copiedCode') : t('copyCode')}</Button><Button className="btn ghost" onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${location.origin}/?room=${game.code}&v=${Date.now()}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          } catch {}
        }}>{copied ? t('copiedLink') : t('copyLink')}</Button></div>
      </div>
      <div className="grid">
        <main className={`panel stage phase-${game.phase}`}>
          <div className="status">{game.phase === 'lobby' ? t('waitingFriends') : game.phase === 'finished' ? t('gameOver') : `${t('round')} ${game.round + 1} ${t('of')} ${game.total}`}</div>
          {game.phase !== 'lobby' && game.phase !== 'finished' && <div className="round-meter" role="progressbar" aria-label={t('gameProgress')} aria-valuenow={game.round + 1} aria-valuemin={1} aria-valuemax={game.total}><span style={{ width: `${((game.round + 1) / game.total) * 100}%` }}/></div>}

          {game.phase === 'lobby' && <>
            <h1>{t('gather')}</h1>
            <p>{t('shareCode')} <strong>{game.code}</strong>. {t('needTwo')}</p>
            <div className="notice">{game.players.length} {t('of')} 8 {t('joined')}</div>
            <div className="lobby-players" aria-label={t('scoreboard')}>
              {game.players.map(p => <div className="lobby-player" key={p.id}><span className="lobby-avatar" aria-hidden="true">{p.avatar ?? DEFAULT_AVATAR}</span><span>{p.name}</span></div>)}
            </div>
            <div className="round-settings">
              <label className="field" htmlFor={session.me === game.host ? 'total-rounds' : undefined}>{t('totalRounds')}</label>
              {session.me === game.host ? <select id="total-rounds" className="round-select" value={game.total} disabled={busy} onChange={e => act('setRounds', { value: Number(e.target.value) })}>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(count => <option key={count} value={count}>{count}</option>)}
              </select> : <strong>{game.total}</strong>}
            </div>
            {session.me === game.host ? <Button className="btn" disabled={busy || game.players.length < 2} onClick={() => act('start')}>{t('startGame')}</Button> : <p>{t('waitHost')}</p>}
          </>}

          {game.phase === 'answer' && question && <>
            <p className="eyebrow role-label"><span className="avatar emoji" aria-hidden="true">{spot?.avatar ?? DEFAULT_AVATAR}</span>{isSpot ? t('yourSpotlight') : `${spot?.name} ${t('spotlight')}`}</p>
            <h1>{question.q}</h1>
            {isSpot ? <>
              <p>{t('choosePrivate')}</p>
              <div className="options">{question.a.map((o, i) => <Button key={i} className="option" disabled={busy} onClick={() => act('answer', { value: i })}><span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span>{o}</span></Button>)}</div>
            </> : <p>{t('waitAnswer')} {spot?.name} {t('chooseAnswer')}</p>}
          </>}

          {game.phase === 'guess' && question && <>
            <p className="eyebrow role-label"><span className="avatar emoji" aria-hidden="true">{spot?.avatar ?? DEFAULT_AVATAR}</span>{t('guessTime')} · {spot?.name}</p>
            <h1>{question.q}</h1>
            {isSpot ? <p>{t('answerLocked')} {game.guessed.length} {t('of')} {game.players.length - 1} {t('friendsGuessed')}</p>
              : game.myGuess !== null ? <div className="notice">{t('guessLocked')} <strong>{question.a[game.myGuess]}</strong><p>{game.guessed.length} {t('of')} {game.players.length - 1} {t('guessesIn')}</p></div>
                : <><p>{locale === 'es' ? `¿Qué eligió ${spot?.name}?` : `What did ${spot?.name} choose?`}</p>
                  <div className="options">{question.a.map((o, i) => <Button key={i} className="option" disabled={busy} onClick={() => act('guess', { value: i })}><span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span>{o}</span></Button>)}</div></>}
          </>}

          {game.phase === 'reveal' && question && <>
            <p className="eyebrow role-label"><span className="avatar emoji" aria-hidden="true">{spot?.avatar ?? DEFAULT_AVATAR}</span>{t('reveal')}</p>
            <h1>{spot?.name} {t('chose')}</h1>
            <h2 className="winner">{question.a[game.answer ?? 0]}</h2>
            <div className="notice">{winner?.name} {t('winsRound')} {chosen?.name} {t('nextChoice')}</div>
            <div className="scorelist">{game.players.map(p => <div className="person" key={p.id}><span className="avatar emoji" aria-hidden="true">{p.avatar ?? DEFAULT_AVATAR}</span>{p.name}<span className="points">+{game.earned[p.id] || 0}</span></div>)}</div>
            <Button className="btn" disabled={busy} onClick={() => act('revealNext')}>{t('continue')}</Button>
          </>}

          {game.phase === 'choice' && <>
            <p className="eyebrow role-label"><span className="avatar emoji" aria-hidden="true">{chosen?.avatar ?? DEFAULT_AVATAR}</span>{t('yourCall')} {chosen?.name}</p>
            <h1>{t('regularOrBonus')}</h1>
            <p>{chosen?.name} {t('chosenRandom')}</p>
            {isChosen ? <div className="options">
              <Button className="btn" disabled={busy} onClick={() => act('choose', { value: 'mini' })}>{t('tryMini')}</Button>
              <Button className="btn alt" disabled={busy} onClick={() => act('choose', { value: 'regular' })}>{t('regular')}</Button>
            </div> : <p>{t('waitDecision')} {chosen?.name} {t('decide')}</p>}
          </>}

          {game.phase === 'mini' && <>
            <p className="eyebrow role-label"><span className="avatar emoji" aria-hidden="true">{chosen?.avatar ?? DEFAULT_AVATAR}</span>{t('bonus')} · {chosen?.name}</p>
            {game.miniKind === 'puzzle' ? <>
              <h1>{t('quickPuzzle')}</h1><p>{t('numberNext')}</p>
              {isChosen && !game.miniDone ? <div className="options">{['18', '24', '32', '64'].map((v, i) => <Button className="option" key={v} disabled={busy} onClick={() => act('miniAnswer', { value: i })}>{v}</Button>)}</div>
                : <p>{game.miniDone ? t('challengeFinished') : t('waitMiniAnswer')}</p>}
            </> : <>
              <h1>{t('hiddenStar')}</h1>
              <p>{t('tapStar')} {chosen?.name} {t('canAnswer')}</p>
              <div className="mini-grid">{Array.from({ length: 25 }, (_, i) => <Button key={i} className="tile" disabled={!isChosen || game.miniDone || busy} aria-label={`${t('tile')} ${i + 1}`} onClick={() => act('miniAnswer', { value: i })}>{i === game.miniIndex ? '✦' : ['✿', '◆', '●', '✚'][i % 4]}</Button>)}</div>
              {!isChosen && <p>{t('followSearch')} {chosen?.name} {t('searches')}</p>}
            </>}
            {game.miniDone && <><div className="notice">{t('challengeComplete')}</div><Button className="btn" disabled={busy} onClick={() => act('miniNext')}>{t('nextRound')}</Button></>}
          </>}

          {game.phase === 'finished' && <>
            <p className="eyebrow">{t('finalScores')}</p>
            <h1>{t('wrap')}</h1>
            <div className="victory" aria-label={finalWinners.map(p => p.name).join(' & ')}>
              <div className="victory-avatars">{finalWinners.map(p => <span className="victory-avatar" key={p.id} aria-hidden="true">{p.avatar ?? DEFAULT_AVATAR}</span>)}</div>
              <p className="victory-message">{finalWinners.length === 1 ? t('congratulations') : t('congratulationsTie')}</p>
              <h2 className="winner">{locale === 'es' ? '¡' : ''}{finalWinners.map(p => p.name).join(' & ')} {finalWinners.length === 1 ? t('wins') : t('tie')}</h2>
            </div>
            <p>{t('roundsPlayed')}: {game.total}</p>
            <Button className="btn alt" onClick={() => { localStorage.removeItem(storeKey); setSession(null); setSavedSession(null); setGame(null); history.replaceState(null, '', '/'); }}>{t('newRoom')}</Button>
          </>}
          {showError}
        </main>
        <aside className="panel scoreboard">
          <div className="eyebrow">{t('scoreboard')} · {game.players.length} {game.players.length === 1 ? t('player') : t('players')}</div>
          <div className="scorelist">{[...game.players].sort((a, b) => b.score - a.score).map((p, index) => <div className={`person ${index === 0 ? 'leader' : ''}`} key={p.id}><span className="rank" aria-hidden="true">{index + 1}</span><span className="avatar emoji" aria-hidden="true">{p.avatar ?? DEFAULT_AVATAR}</span><span>{p.name}{p.id === session.me ? ` (${t('you')})` : ''}</span><span className="points">{p.score}</span></div>)}</div>
          <hr className="divider"/><p className="small">{t('scoring')}</p>
        </aside>
      </div>
    </>}
  </div>;
}

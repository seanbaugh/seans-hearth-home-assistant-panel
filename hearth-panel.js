/*
  Hearth Panel — a full-screen wall-tablet card for Home Assistant.
  Use in a panel view:  type: custom:hearth-panel  (every option below can be set in the card's YAML)
*/
const HEARTH_VERSION = '1.0.1';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Lexend:wght@400;500&display=swap';

const HEARTH_DEFAULTS = {
  // Nothing here is specific to any home: add your own entities in the card's YAML (see README.md and examples/).
  rooms: [],            // [{ entity: 'light.living_room', name: 'Living room' }]  lights or light groups; count: false leaves one out of the "lit" count
  scenes: [],           // [{ entity: 'scene.evening', name: 'Evening', confirm: true }]  scenes or scripts; confirm: true needs a second tap
  media: 'auto',        // 'auto' watches every media player; or give a list of entity IDs
  media_ignore: [],     // players the Now playing card should never show (you can also hide them from its sheet)
  weather: 'auto',      // a weather entity ID, or 'auto' for the first one found
  camera: null,         // door camera, e.g. 'camera.front_door'
  doorbell: null,       // event entity that fires when the doorbell rings
  motion: null,         // event entity that fires on motion
  motion_switch: null,  // optional switch that turns motion alerts on or off
  doorbell_battery: null,
  calendars: [],        // ['calendar.family']
  // Optional turntable card (read only): input_text entities holding the current record
  vinyl: null,          // { album: 'input_text.record_album', artist: 'input_text.record_artist', cover: 'input_text.record_cover_url' }
  // Optional Apple TV remote card
  tv: null,             // { name: 'Apple TV', room: 'Living room', player: 'media_player.x', remote: 'remote.x', apps: ['Netflix', 'YouTube'] }
  // Optional text commands sent to an Echo through the Alexa Devices integration
  alexa: null,          // { name: 'Kitchen', device_id: '…', actions: [{ name: 'News', icon: 'news', command: 'Play the news', group: 'play' }] }
  recent_minutes: 3,
  // Which cards make up the board, in order. { card, tall } makes a card two rows high. Known cards: rooms, media, weather, vinyl, agenda, scenes, door, tv, climate, good
  board: ['rooms', 'media', 'weather', 'agenda', 'scenes'],
  rooms_unit: ['room lit', 'rooms lit'],   // words after the big number on the Lights card
  agenda_mode: 'next',                    // 'tomorrow' shows the first thing on tomorrow's calendar (a bedtime view)
  climate: null,                          // { humidity, temperature, fan: { up, down, power } } (fan buttons call scenes)
  goodnight: null,                        // { entity, name, detail } a big second-tap button for a script or scene
  night: null                             // { mode: 'dim', wake_seconds: 45 } after sunset the screen goes dark with a big clock
};

const HEARTH_PALETTES = [
  { id: 'midnight', name: 'Midnight',
    d: { bg: '#080b11', surf: '#121824', acc: '#38bdf8' }, l: { bg: '#eef3f8', surf: '#ffffff', acc: '#1683c7' } },
  { id: 'ocean', name: 'Ocean',
    d: { bg: '#06121a', surf: '#10283a', text: '#e4f2f7', dim: '#86a5b3', faint: '#55717f', acc: '#22d3ee', amb: ['#22d3ee', '#38bdf8', '#2dd4bf'] },
    l: { bg: '#e8f4f7', surf: '#ffffff', text: '#0b2530', dim: '#4a6a77', faint: '#86a0ab', acc: '#0e7490', amb: ['#22d3ee', '#38bdf8', '#2dd4bf'] } },
  { id: 'forest', name: 'Forest',
    d: { bg: '#08100c', surf: '#14241b', text: '#e6f0e8', dim: '#8aa393', faint: '#566b5e', acc: '#4ade80', amb: ['#4ade80', '#a3e635', '#2dd4bf'] },
    l: { bg: '#edf4ea', surf: '#ffffff', text: '#14231a', dim: '#53695a', faint: '#8da095', acc: '#2f7d3e', amb: ['#4ade80', '#a3e635', '#2dd4bf'] } },
  { id: 'ember', name: 'Ember',
    d: { bg: '#120a08', surf: '#261712', text: '#f6ebe6', dim: '#b09389', faint: '#75605a', acc: '#fb923c', amb: ['#fb923c', '#f43f5e', '#fbbf24'], media: '#f472b6' },
    l: { bg: '#faf0ea', surf: '#ffffff', text: '#2a1510', dim: '#7a5a50', faint: '#ad9188', acc: '#c2410c', amb: ['#fb923c', '#f43f5e', '#fbbf24'], media: '#be3b86' } },
  { id: 'orchid', name: 'Orchid',
    d: { bg: '#0e0914', surf: '#1e1530', text: '#f0e9f7', dim: '#a595b8', faint: '#6b5c7d', acc: '#c084fc', amb: ['#c084fc', '#f472b6', '#818cf8'], media: '#f472b6' },
    l: { bg: '#f5eefa', surf: '#ffffff', text: '#21132e', dim: '#66527a', faint: '#9a88ad', acc: '#7e3fc4', amb: ['#c084fc', '#f472b6', '#818cf8'], media: '#be3b86' } },
  { id: 'sand', name: 'Sand',
    d: { bg: '#100d09', surf: '#231d14', text: '#f3ece0', dim: '#a89c86', faint: '#6e6451', acc: '#e0b872', amb: ['#e0b872', '#fb923c', '#a3a380'] },
    l: { bg: '#f6f0e4', surf: '#fffdf8', text: '#2b2418', dim: '#6f6350', faint: '#a39881', acc: '#8a6212', amb: ['#e0b872', '#fb923c', '#a3a380'] } },
  { id: 'graphite', name: 'Graphite',
    d: { bg: '#0a0a0b', surf: '#1a1a1d', text: '#ececef', dim: '#9a9aa3', faint: '#62626b', acc: '#d4d4d8', amb: ['#a1a1aa', '#71717a', '#d4d4d8'] },
    l: { bg: '#f2f2f3', surf: '#ffffff', text: '#18181b', dim: '#52525b', faint: '#8d8d96', acc: '#3f3f46', amb: ['#a1a1aa', '#71717a', '#d4d4d8'] } }
];
/* A palette re-colours the surfaces, text and accent; Light/Dark still decides which of its two variants shows. Midnight is the built-in look. */
const hPaletteVars = (p, light) => {
  const c = light ? p.l : p.d, [a1, a2, a3] = c.amb || [], mix = (x, n) => `color-mix(in srgb, ${x} ${n}%, transparent)`;
  return `--bg:${c.bg};--card:${mix(c.surf, light ? 64 : 52)};--card-solid:${c.surf};--text:${c.text};--dim:${c.dim};--faint:${c.faint};--sheet:${mix(c.surf, light ? 91 : 85)};`
    + `--amb-1:${mix(a1, light ? 16 : 10)};--amb-2:${mix(a2, light ? 12 : 6)};--amb-3:${mix(a3, light ? 10 : 6)};--home:${c.acc};--g-home:${p.d.acc};`
    + (c.media ? `--media:${c.media};--g-media:${p.d.media};` : '');
};
const hPaletteCss = () => HEARTH_PALETTES.filter(p => p.id !== 'midnight').map(p => `:host([palette="${p.id}"]) {${hPaletteVars(p, false)}}\n:host([palette="${p.id}"][sky="light"]) {${hPaletteVars(p, true)}}`).join('\n');

const HEARTH_CSS = `
:host {
  /* Layout: header strip (clock · alert slot · sky), then a 3×3 grid of frosted cards; detail lives in pop-up sheets */
  color-scheme: dark;
  --bg: #080b11; --card: rgba(24,31,45,.52); --card-solid: #121824; --line: rgba(255,255,255,.07);
  --chip: rgba(255,255,255,.055); --chip-hover: rgba(255,255,255,.09);
  --text: #e8edf5; --dim: #8b95a8; --faint: #5a6477;
  --sheet: rgba(15,20,30,.86); --scrim: rgba(3,5,9,.55);
  --shadow: 0 0 0 transparent; --sheet-shadow: 0 30px 80px -20px rgba(0,0,0,.7);
  --amb-1: rgba(56,189,248,.10); --amb-2: rgba(251,191,36,.055); --amb-3: rgba(167,139,250,.06);
  --halo-o: .95; --backdrop-o: .34;
  --solar: #fbbf24; --ok: #34d399; --home: #38bdf8; --grid: #94a3b8; --lamp: #ffd27a; --media: #a78bfa;
  --amber: #ffb547; --red: #ff5d7a;
  --g-solar: #fbbf24; --g-ok: #34d399; --g-home: #38bdf8; --g-lamp: #ffd27a; --g-media: #a78bfa;
  --font-num: "Lexend", "Avenir Next", "Segoe UI", system-ui, sans-serif;
  --font-ui: "Plus Jakarta Sans", "Avenir Next", "Segoe UI", system-ui, sans-serif;
  --gap: 12px; --big: clamp(40px, 6.4vh, 60px);
  display: block; position: relative; overflow: hidden;
  background: var(--bg); color: var(--text);
  font: 500 15px/1.4 var(--font-ui);
  -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent;
  user-select: none; -webkit-user-select: none;
}
:host([sky="light"]) {
  color-scheme: light;
  --bg: #eef3f8; --card: rgba(255,255,255,.64); --card-solid: #fff; --line: rgba(15,23,42,.07);
  --chip: rgba(15,23,42,.045); --chip-hover: rgba(15,23,42,.08);
  --text: #0f1726; --dim: #586478; --faint: #8e99ab;
  --sheet: rgba(248,251,254,.92); --scrim: rgba(15,23,42,.22);
  --shadow: 0 1px 2px rgba(15,23,42,.04), 0 12px 32px -14px rgba(15,23,42,.14);
  --sheet-shadow: 0 30px 80px -24px rgba(15,23,42,.28);
  --amb-1: rgba(56,189,248,.16); --amb-2: rgba(251,191,36,.12); --amb-3: rgba(167,139,250,.10);
  --halo-o: .6; --backdrop-o: .22;
  --solar: #b7770c; --ok: #0f8a5f; --home: #1683c7; --grid: #64748b; --lamp: #a86a00; --media: #7c5cd6;
  --amber: #b45309; --red: #c53757;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--home); outline-offset: 3px; }
.ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(40% 50% at 8% 12%, var(--amb-2), transparent 70%), radial-gradient(45% 55% at 92% 88%, var(--amb-1), transparent 70%), radial-gradient(35% 40% at 60% 30%, var(--amb-3), transparent 70%); }
:host(.ready), :host(.ready) .card, :host(.ready) .sky, :host(.ready) .btn, :host(.ready) .tile, :host(.ready) .chip { transition: background-color 1.4s ease, border-color .6s ease, color 1.4s ease, box-shadow .6s ease; }
.ico { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.num { font-family: var(--font-num); font-weight: 500; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }

.app { position: relative; z-index: 1; height: 100%; display: grid; grid-template-rows: auto minmax(0,1fr); gap: var(--gap); padding: 14px 16px; }
.top { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); align-items: center; gap: 16px; min-height: 64px; }
.when { display: flex; align-items: baseline; gap: 14px; min-width: 0; }
.clock { font-size: 34px; line-height: 1; white-space: nowrap; }
.clock small { font-size: 14px; color: var(--dim); margin-left: 4px; font-family: var(--font-ui); letter-spacing: 0; }
.date { color: var(--dim); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot { display: flex; justify-content: center; min-width: 0; }
.calm { display: flex; align-items: center; gap: 8px; color: var(--faint); font-size: 14px; }
.calm i { width: 7px; height: 7px; border-radius: 50%; background: var(--ok); opacity: .7; }
.top-actions { justify-self: end; }
.sky, .alert-pill { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 18px 0 14px; border-radius: 20px; border: 1px solid var(--line); background: var(--card); -webkit-backdrop-filter: blur(20px) saturate(140%); backdrop-filter: blur(20px) saturate(140%); box-shadow: var(--shadow); cursor: pointer; text-align: left; }
.sky .ico { width: 24px; height: 24px; }
.sky.is-day .ico { color: var(--solar); } .sky.is-night .ico { color: var(--home); }
.sky b { display: block; font-size: 14px; font-weight: 600; }
.sky small { display: block; font-size: 12px; color: var(--dim); }
.alert-pill { --c: var(--amber); border-color: color-mix(in srgb, var(--c) 55%, transparent); background: color-mix(in srgb, var(--c) 14%, var(--card)); min-height: 60px; padding-right: 14px; max-width: 100%; }
.alert-pill.red { --c: var(--red); animation: urgent 2.8s ease-in-out infinite; }
.alert-pill .ico { color: var(--c); width: 24px; height: 24px; }
.alert-pill > span:first-of-type { color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alert-pill b { color: var(--text); font-weight: 700; }
.alert-pill .more { font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 99px; background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--c); }
.alert-pill .chev { width: 18px; height: 18px; color: var(--dim); }
@keyframes urgent { 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--red) 16%, transparent), var(--shadow); } }

.board { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); grid-template-rows: repeat(3, minmax(0,1fr)); gap: var(--gap); min-height: 0; }
.tall { grid-row: span 2; }
.card { --c: var(--home); --gc: var(--g-home); position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; gap: 6px; min-height: 0; min-width: 0; padding: 16px 18px 18px; border-radius: 26px; border: 1px solid var(--line); background: var(--card); -webkit-backdrop-filter: blur(24px) saturate(140%); backdrop-filter: blur(24px) saturate(140%); box-shadow: var(--shadow); cursor: pointer; }
.card:active { transform: scale(.992); }
.in { display: contents; }
.halo { position: absolute; z-index: -1; top: -45%; right: -30%; width: 85%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--gc) 30%, transparent), transparent 68%); opacity: 0; transition: opacity 1.4s ease; pointer-events: none; }
.card.live .halo { opacity: var(--halo-o); animation: breathe 7s ease-in-out infinite; }
@keyframes breathe { 50% { transform: scale(1.08); } }
.card[data-attn="amber"] { border-color: color-mix(in srgb, var(--amber) 60%, transparent); }
.card[data-attn="red"] { border-color: color-mix(in srgb, var(--red) 70%, transparent); }
.card-head { display: flex; align-items: center; gap: 8px; color: var(--dim); font-size: 13px; font-weight: 600; min-height: 24px; }
.card-head .ico { width: 18px; height: 18px; color: var(--c); }
.card-head .note { margin-left: auto; font-weight: 500; color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.flag { margin-left: auto; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; padding: 3px 9px; border-radius: 99px; color: var(--amber); background: color-mix(in srgb, var(--amber) 16%, transparent); }
.flag.red { color: var(--red); background: color-mix(in srgb, var(--red) 16%, transparent); }
.big { font-size: var(--big); line-height: 1; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.big.word { font-size: calc(var(--big) * .62); line-height: 1.15; }
.big .u { font-size: .4em; margin-left: .18em; color: var(--dim); font-weight: 400; letter-spacing: 0; }
.sub { color: var(--dim); font-size: 13.5px; line-height: 1.35; min-height: 1.35em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.foot { margin-top: auto; }

#cRooms .big { --big: clamp(34px, 5vh, 46px); margin-top: 2px; }
.tiles { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: minmax(56px, 1fr); gap: 6px; margin-top: 4px; overflow-y: auto; scrollbar-width: none; }
.tiles::-webkit-scrollbar { display: none; }
.tile { --c: var(--lamp); min-height: 56px; border-radius: 18px; border: 1px solid var(--line); background: var(--chip); padding: 0 14px; display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer; min-width: 0; }
.tile i { width: 9px; height: 9px; border-radius: 50%; background: var(--faint); flex: none; transition: background-color .4s, box-shadow .4s; }
.tile .tt { min-width: 0; display: flex; flex-direction: column; }
.tile b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile span { font-size: 12px; color: var(--dim); }
.tile.on { background: color-mix(in srgb, var(--c) 15%, transparent); border-color: color-mix(in srgb, var(--c) 40%, transparent); }
.tile.on i { background: var(--gc, var(--g-lamp)); box-shadow: 0 0 10px var(--gc, var(--g-lamp)); }
.tile.na { opacity: .45; cursor: default; }
.tile:active:not(.na) { transform: scale(.97); }

.chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; margin-inline: -2px; }
.chips::-webkit-scrollbar { display: none; }
.chips { -webkit-mask-image: linear-gradient(to right, #000 85%, transparent); mask-image: linear-gradient(to right, #000 85%, transparent); padding-right: 28px; }
.chip { flex: none; min-height: 56px; padding: 0 13px; border-radius: 18px; border: 1px solid var(--line); background: var(--chip); font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; position: relative; overflow: hidden; }
.chip:active { transform: scale(.96); }
.scene-grid { flex: 1; min-height: 0; display: grid; grid-auto-flow: column; grid-template-rows: repeat(2, minmax(56px, 1fr)); grid-auto-columns: max-content; align-content: end; margin-top: 6px; }
.scene-grid .chip { min-height: 56px; }
.sw { display: inline-flex; padding-left: 3px; }
.sw i { width: 11px; height: 11px; border-radius: 50%; margin-left: -4px; box-shadow: 0 0 0 1.5px var(--card-solid); }
.tinted { --c2: var(--c1); --c3: var(--c2); background: linear-gradient(120deg, color-mix(in srgb, var(--c1) 26%, transparent), color-mix(in srgb, var(--c2) 22%, transparent) 60%, color-mix(in srgb, var(--c3) 18%, transparent)); border-color: color-mix(in srgb, var(--c1) 45%, transparent); }
.chip.current, .btn.current { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c1, var(--lamp)) 75%, transparent); }

.np-title { font-size: 22px; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.controls { display: flex; align-items: center; justify-content: center; gap: 14px; }

.snap { flex: 1; min-height: 60px; border-radius: 18px; background: var(--chip) center / cover no-repeat; margin-top: 6px; display: grid; place-items: center; color: var(--faint); }

.btn { --c: var(--home); display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 56px; padding: 0 20px; border-radius: 18px; border: 1px solid var(--line); background: var(--chip); font-weight: 600; font-size: 15px; cursor: pointer; position: relative; overflow: hidden; transition: transform .12s ease; }
.btn:hover { background: var(--chip-hover); }
.btn:active { transform: scale(.96); }
.btn.round { width: 56px; padding: 0; border-radius: 50%; }
.btn.round .ico { width: 24px; height: 24px; }
.btn.lg { min-height: 70px; border-radius: 22px; font-size: 16px; padding: 0 24px; }
.btn.lg.round { width: 70px; border-radius: 50%; padding: 0; }
.btn.primary { background: color-mix(in srgb, var(--c) 20%, transparent); border-color: color-mix(in srgb, var(--c) 50%, transparent); color: var(--c); }
.btn.sel { background: color-mix(in srgb, var(--c) 18%, transparent); border-color: color-mix(in srgb, var(--c) 50%, transparent); }
.confirm.armed { color: var(--amber) !important; background: color-mix(in srgb, var(--amber) 18%, transparent) !important; border-color: var(--amber) !important; }
.confirm.armed::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: currentColor; transform-origin: left; animation: countdown 3.5s linear forwards; }
@keyframes countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }

.suns { display: flex; gap: 18px; color: var(--dim); font-size: 13px; }
.suns div { display: flex; align-items: center; gap: 6px; }
.suns .ico { width: 18px; height: 18px; }
.suns .rise .ico { color: var(--solar); } .suns .set .ico { color: var(--home); }
.mini-list { display: flex; flex-direction: column; gap: 6px; }
.mini-list div { display: flex; gap: 12px; font-size: 13px; color: var(--dim); min-width: 0; }
.mini-list div span:last-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mini-list .num { font-size: 12px; min-width: 64px; color: var(--text); flex: none; }

.scrim { position: fixed; inset: 0; z-index: 20; background: var(--scrim); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; transition: opacity .3s ease; }
.scrim.open { opacity: 1; }
.sheet { position: fixed; z-index: 21; left: 0; right: 0; margin-inline: auto; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); width: min(980px, calc(100% - 32px)); max-height: calc(100% - 48px); display: flex; flex-direction: column; border-radius: 34px; border: 1px solid var(--line); background: var(--sheet); -webkit-backdrop-filter: blur(30px) saturate(150%); backdrop-filter: blur(30px) saturate(150%); box-shadow: var(--sheet-shadow); color: var(--text); opacity: 0; transform: translateY(28px) scale(.985); transition: opacity .3s ease, transform .38s cubic-bezier(.2,.8,.2,1); }
.sheet.open { opacity: 1; transform: none; }
.sheet-head { display: flex; align-items: center; gap: 12px; padding: 22px 22px 6px 28px; position: relative; touch-action: none; cursor: grab; }
.grab { position: absolute; top: 9px; left: 50%; width: 44px; height: 5px; margin-left: -22px; border-radius: 3px; background: var(--faint); opacity: .5; }
.sheet-head h2 { margin: 0; font: 500 22px/1.2 var(--font-num); letter-spacing: -.01em; }
.sheet-head .btn { margin-left: auto; }
.sheet-body { overflow-y: auto; padding: 14px 28px 28px; display: grid; gap: 16px; overscroll-behavior: contain; }
.sheet-body::-webkit-scrollbar { width: 0; }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.panel { border-radius: 24px; background: var(--chip); padding: 18px 20px; display: grid; gap: 12px; align-content: start; min-width: 0; }
.panel h3 { margin: 0; font-size: 13px; font-weight: 600; color: var(--dim); }
.panel p { margin: 0; color: var(--dim); font-size: 14px; max-width: 60ch; }
.xl { font-size: 72px; line-height: 1; white-space: nowrap; }
.xl .u { font-size: .34em; margin-left: .15em; color: var(--dim); font-weight: 400; letter-spacing: 0; }
.seg { display: flex; flex-wrap: wrap; gap: 8px; }
.seg .btn { flex: 1 1 0; min-width: 110px; }
.pal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.pal { display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 0 16px; border-radius: 20px; border: 1px solid var(--line); background: var(--chip); font-weight: 600; font-size: 15px; text-align: left; cursor: pointer; transition: transform .12s ease; }
.pal:hover { background: var(--chip-hover); }
.pal:active { transform: scale(.96); }
.pal.sel { background: color-mix(in srgb, var(--home) 18%, transparent); border-color: color-mix(in srgb, var(--home) 50%, transparent); }
.pal-sw { width: 34px; height: 34px; border-radius: 50%; flex: none; border: 1px solid var(--line); background: linear-gradient(135deg, var(--p1) 0 40%, var(--p2) 40% 58%, var(--p3) 58% 100%); }
.rows { display: grid; gap: 10px; }
.row { display: flex; align-items: center; gap: 14px; padding: 12px 12px 12px 18px; border-radius: 22px; background: var(--chip); min-height: 80px; flex-wrap: wrap; }
.row > .ico { width: 26px; height: 26px; color: var(--c, var(--dim)); }
.row .what { flex: 1 1 160px; min-width: 0; }
.row .what b { display: block; font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.row .what span { font-size: 13px; color: var(--dim); }
.row .acts { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.row .thumb { width: 56px; height: 56px; border-radius: 14px; background: var(--card-solid) center / cover no-repeat; flex: none; }
.row.done { opacity: .5; }
.art-card { flex-direction: row; gap: 14px; padding: 12px; container-type: inline-size; }
.cover { height: 100%; aspect-ratio: 1; max-width: 58%; flex: none; border-radius: 18px; background: var(--chip) center / cover no-repeat; display: grid; place-items: center; color: var(--faint); box-shadow: 0 16px 34px -18px rgba(0,0,0,.6); }
.cover .ico { width: 40px; height: 40px; }
.backdrop { position: absolute; inset: -25%; z-index: -2; background: center / cover no-repeat; filter: blur(40px) saturate(1.3); opacity: var(--backdrop-o); pointer-events: none; }
.art-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 4px 6px 2px 0; }
.art-text .np-title { font-size: 19px; line-height: 1.18; -webkit-line-clamp: 3; margin-top: 2px; }
.art-text .who { font-size: 13.5px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.art-text .where { font-size: 12px; color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.art-text .controls { margin-top: auto; justify-content: flex-start; gap: 10px; }
@container (max-width: 420px) { .ctl-prev { display: none !important; } }
.wx-main { display: flex; gap: 12px; align-items: center; min-height: 0; }
.wx-now { flex: 1 1 auto; min-width: 0; }
.wx-now .big { margin-top: 2px; }
.wx-feel { font-size: 12.5px; color: var(--dim); margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wx-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; flex: 0 0 52%; }
.wx-grid.wide { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.wx-stat { background: var(--chip); border-radius: 12px; padding: 6px 9px; display: grid; grid-template-columns: auto 1fr; align-items: baseline; column-gap: 5px; min-width: 0; }
.wx-stat span { grid-column: 1 / -1; font-size: 10.5px; color: var(--dim); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wx-stat b { font-size: 15px; font-weight: 500; }
.wx-stat i { font-style: normal; font-size: 11px; color: var(--dim); display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; overflow: hidden; }
.wx-dir span { display: inline-flex; }
.wx-dir .ico { width: 11px; height: 11px; }
.wx-hint { color: var(--home) !important; font-weight: 600 !important; }
.wx-hours { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; border-top: 1px solid var(--line); padding-top: 8px; }
.wx-hour { display: grid; justify-items: center; gap: 1px; }
.wx-hour small { font-size: 10.5px; color: var(--dim); }
.wx-hour .ico { width: 16px; height: 16px; color: var(--dim); }
.wx-hour b { font-size: 13px; font-weight: 500; }
.wx-rain { color: var(--home) !important; }
.tv-row { justify-content: flex-start; gap: 10px; }
.dpad { display: grid; grid-template-columns: repeat(3, 70px); grid-template-rows: repeat(3, 70px); gap: 10px; justify-content: center; }
.dpad .ok { font: 600 16px var(--font-ui); }
.spin { grid-template-columns: auto minmax(0,1fr); align-items: center; gap: 22px; }
.spin-art { width: min(240px, 38vw); aspect-ratio: 1; border-radius: 20px; background: var(--card-solid) center / cover no-repeat; display: grid; place-items: center; color: var(--faint); box-shadow: 0 18px 40px -18px rgba(0,0,0,.5); }
.spin-art .ico { width: 48px; height: 48px; }
.spin-t { display: grid; gap: 8px; min-width: 0; }
.lights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
.lamp { --c: var(--lamp); border-radius: 22px; background: var(--chip); padding: 8px; display: grid; gap: 6px; border: 1px solid transparent; }
.lamp.on { background: color-mix(in srgb, var(--c) 12%, transparent); border-color: color-mix(in srgb, var(--c) 28%, transparent); }
.lamp .btn { justify-content: space-between; background: transparent; border-color: transparent; min-height: 64px; padding: 0 14px; }
.lamp .btn small { color: var(--dim); font-weight: 500; }
input[type="range"] { width: calc(100% - 20px); margin: 0 10px 8px; height: 40px; accent-color: var(--gc, var(--g-lamp)); }
.lamp-top { display: flex; align-items: stretch; gap: 6px; }
.lamp-top > .btn:first-child { flex: 1; min-width: 0; }
.lamp .lamp-go { flex: none; width: 56px; padding: 0; justify-content: center; color: var(--dim); }
.lamp .lamp-go.txt { width: auto; padding: 0 18px; color: var(--text); background: var(--chip); }
.members { display: grid; gap: 12px; }
.sw-area { display: grid; gap: 10px; padding: 4px 10px 10px; }
.sw-area small { color: var(--dim); font-weight: 600; font-size: 12px; }
.swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.sw-btn { width: 56px; height: 56px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--text) 14%, transparent); padding: 0; cursor: pointer; transition: transform .12s ease; }
.sw-btn:active { transform: scale(.92); }
.hue, .sat { -webkit-appearance: none; appearance: none; background: transparent; height: 44px; accent-color: auto; }
.hue::-webkit-slider-runnable-track, .sat::-webkit-slider-runnable-track { height: 16px; border-radius: 99px; }
.hue::-moz-range-track, .sat::-moz-range-track { height: 16px; border-radius: 99px; }
.hue::-webkit-slider-runnable-track { background: linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%)); }
.hue::-moz-range-track { background: linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%)); }
.sat::-webkit-slider-runnable-track { background: linear-gradient(to right, #fff, hsl(var(--h, 30) 100% 50%)); }
.sat::-moz-range-track { background: linear-gradient(to right, #fff, hsl(var(--h, 30) 100% 50%)); }
.hue::-webkit-slider-thumb, .sat::-webkit-slider-thumb { -webkit-appearance: none; width: 36px; height: 36px; margin-top: -10px; border-radius: 50%; background: #fff; border: 3px solid rgba(0,0,0,.22); box-shadow: 0 2px 8px rgba(0,0,0,.3); }
.hue::-moz-range-thumb, .sat::-moz-range-thumb { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 3px solid rgba(0,0,0,.22); box-shadow: 0 2px 8px rgba(0,0,0,.3); }
.vol { flex: 1 1 200px; min-width: 160px; margin: 0; accent-color: var(--g-media); }
.hours { display: grid; grid-template-columns: repeat(8, minmax(64px, 1fr)); gap: 8px; overflow-x: auto; }
.hour { text-align: center; padding: 12px 6px; border-radius: 18px; background: var(--card-solid); display: grid; gap: 6px; justify-items: center; }
.hour small { color: var(--dim); font-size: 12px; }
.hour .num { font-size: 18px; }
.hour .ico { color: var(--dim); } .hour .ico.sunny { color: var(--solar); }
.day-label { font-size: 13px; font-weight: 700; color: var(--dim); margin-top: 6px; }
.big-snap { width: 100%; aspect-ratio: 16 / 9; border-radius: 22px; background: var(--card-solid) center / cover no-repeat; overflow: hidden; }
.big-snap ha-camera-stream { display: block; width: 100%; height: 100%; }
.alert-block { --c: var(--amber); border-radius: 24px; padding: 18px 20px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; background: color-mix(in srgb, var(--c) 12%, transparent); border: 1px solid color-mix(in srgb, var(--c) 45%, transparent); }
.alert-block.red { --c: var(--red); }
.alert-block > .ico { width: 30px; height: 30px; color: var(--c); }
.alert-block .what { flex: 1 1 200px; }
.alert-block b { display: block; font-size: 17px; }
.alert-block span { color: var(--dim); font-size: 14px; }
.alert-block .acts { display: flex; gap: 8px; flex-wrap: wrap; }
.empty { color: var(--dim); font-size: 14px; padding: 8px 2px; }
.toast { position: fixed; z-index: 30; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); transform: translate(-50%, 16px); opacity: 0; pointer-events: none; padding: 14px 22px; border-radius: 99px; background: var(--card-solid); color: var(--text); border: 1px solid var(--line); box-shadow: var(--sheet-shadow); font-weight: 600; font-size: 15px; transition: opacity .25s ease, transform .3s ease; white-space: nowrap; max-width: calc(100% - 32px); overflow: hidden; text-overflow: ellipsis; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }

.fan-row { display: flex; align-items: center; gap: 10px; margin-top: auto; }
.fan-l { margin-right: auto; color: var(--dim); font-size: 13px; font-weight: 600; }
.good-btn { flex: 1; min-height: 70px; font-size: 22px; border-radius: 26px; margin-top: 6px; }
.good-btn .ico { width: 26px; height: 26px; }
.night { position: fixed; inset: 0; z-index: 40; background: #000; display: grid; align-content: center; justify-items: center; gap: 12px; cursor: pointer; color: #4a3e31; }
.night-clock { font-size: clamp(96px, 26vh, 240px); line-height: 1; }
.night-clock small { font-size: .22em; margin-left: .15em; color: #352c23; font-family: var(--font-ui); letter-spacing: 0; }
.night-date { font-size: clamp(16px, 3.2vh, 30px); color: #352c23; }
.night-hint { font-size: 13px; color: #221c16; margin-top: 18px; }
@media (max-width: 999px), (orientation: portrait), (max-height: 600px) {
  :host { --big: 48px; }
  .board { grid-template-columns: repeat(2, minmax(0,1fr)); grid-template-rows: none; grid-auto-rows: minmax(230px, auto); }
  .app { height: auto; }
  .tiles { min-height: 340px; }
}
@media (max-width: 640px) {
  .top { grid-template-columns: minmax(0,1fr) auto; }
  .slot { grid-column: 1 / -1; order: 3; justify-content: stretch; }
  .slot .alert-pill { flex: 1; }
  .slot .calm { display: none; }
  .when { flex-direction: column; align-items: flex-start; gap: 4px; }
  .sky small { display: none; }
  .board { grid-template-columns: minmax(0,1fr); }
  .tall { grid-row: auto; }
  .sheet { width: calc(100% - 16px); bottom: 8px; }
  .sheet-body { padding: 12px 16px 20px; }
  .xl { font-size: 56px; }
}
/* Upright tablet: two columns that fill the screen, with an odd last card stretched across the bottom */
@media (orientation: portrait) and (min-width: 700px) {
  :host { --big: clamp(40px, 5vh, 56px); }
  /* Rows never get shorter than their content needs; on a short screen the board scrolls under the fixed header instead of clipping */
  .board { grid-template-columns: repeat(2, minmax(0,1fr)); grid-template-rows: repeat(var(--prows, 5), minmax(208px, 1fr)); grid-auto-rows: minmax(208px, 1fr); overflow-y: auto; scrollbar-width: none; }
  .board::-webkit-scrollbar { display: none; }
  .app { height: 100%; }
  .tiles { min-height: 0; }
  .tall { grid-row: span 2; }
  .last-wide { grid-column: span 2; }
  /* The weather card needs a little less height than other cards here, so its stat tiles and hourly strip are tightened to fit the 208px row */
  .wx-main { flex: none; }
  .wx-grid { gap: 4px; }
  .wx-stat { padding: 4px 8px; }
  .wx-stat span { font-size: 10px; line-height: 1.25; }
  .wx-stat b { font-size: 14px; line-height: 1.2; }
  .wx-hours { padding-top: 6px; }
  .wx-hour small { font-size: 10px; line-height: 1.2; }
  .wx-hour b { font-size: 12.5px; line-height: 1.2; }
  .wx-hour .ico { width: 14px; height: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; }
  .sheet { transform: none; }
  .card:active, .btn:active, .tile:active, .chip:active { transform: none; }
}
`;

const HEARTH_ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sunrise: '<path d="M12 3v5M8.5 6.5 12 3l3.5 3.5M4.2 12.2l1.4 1.4M2 18h2M20 18h2M18.4 13.6l1.4-1.4M22 22H2M16 18a4 4 0 0 0-8 0"/>',
  sunset: '<path d="M12 8V3M8.5 4.5 12 8l3.5-3.5M4.2 12.2l1.4 1.4M2 18h2M20 18h2M18.4 13.6l1.4-1.4M22 22H2M16 18a4 4 0 0 0-8 0"/>',
  bulb: '<path d="M9 18h6M10 21.5h4M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6V16h6v-.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5z"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 10.5a4 4 0 0 1-.5 8H7z"/>',
  rain: '<path d="M7 15.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 7.5a4 4 0 0 1-.5 8H7zM8 19l-1 2.5M12 19l-1 2.5M16 19l-1 2.5"/>',
  storm: '<path d="M7 15.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 7.5a4 4 0 0 1-.5 8H7z"/><path d="m12.5 13-2 4h3l-2 4"/>',
  snow: '<path d="M12 2v20M4 7l16 10M20 7 4 17"/>',
  nightcloud: '<path d="M7 19a4 4 0 0 1-.3-8 5.5 5.5 0 0 1 10.3 1.3A3.4 3.4 0 0 1 16.6 19H7z"/><path d="M19.5 9.5A4 4 0 0 1 14 4.2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M16 3v4M8 3v4M3.5 10h17"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  disc: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="3"/><path d="M12 5.5a6.5 6.5 0 0 0-6.5 6.5"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z"/>',
  pause: '<path d="M8 4.5v15M16 4.5v15"/>',
  next: '<path d="M5 4.5v15l10-7.5zM19 5v14"/>',
  prev: '<path d="M19 4.5v15l-10-7.5zM5 5v14"/>',
  door: '<path d="M5 21.5V4a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 4v17.5M3 21.5h18M15 12.5v.01"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5h-15zM10 21a2 2 0 0 0 4 0"/>',
  motion: '<circle cx="13" cy="4" r="2"/><path d="m9 21 3-6 3 2v4M7 12l3-4 4 1 2 4 3 1M10 8l-1 5"/>',
  camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  alert: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  battery: '<rect x="2.5" y="7" width="16" height="10" rx="2.5"/><path d="M21.5 10.5v3M6 10.5v3"/>',
  drop: '<path d="M12 2.7s6.5 6.6 6.5 11.8a6.5 6.5 0 0 1-13 0C5.5 9.3 12 2.7 12 2.7z"/>',
  flame: '<path d="M12 21.5a6.5 6.5 0 0 0 6.5-6.5c0-3.6-2.6-5.6-3.8-8.5-.9 1.8-2 2.8-3.2 3 0-2-.8-4-2-6-.8 4-5 6.6-5 11.5a6.5 6.5 0 0 0 6.5 6.5z"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  chevl: '<path d="m15 6-6 6 6 6"/>',
  chevu: '<path d="m6 15 6-6 6 6"/>',
  chevd: '<path d="m6 9 6 6 6-6"/>',
  tv: '<rect x="2.5" y="4.5" width="19" height="13" rx="2.5"/><path d="M8 21h8M12 17.5V21"/>',
  power: '<path d="M12 3v8M7.1 6.2a7.5 7.5 0 1 0 9.8 0"/>',
  house: '<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"/>',
  back: '<path d="M9 7 4 12l5 5M4.5 12H15a5 5 0 0 1 0 10h-2"/>',
  arrow: '<path d="M12 20V4M6 10l6-6 6 6"/>',
  news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/>',
  radio: '<rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="m7 8 10-5M8 14h.01M13 13h5M13 16h5"/>',
  volup: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  voldown: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM15.5 9a4 4 0 0 1 0 6"/>',
  stop: '<circle cx="12" cy="12" r="9.5"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  fan: '<circle cx="12" cy="12" r="1.8"/><path d="M12 10.2c-1-4 .5-6.7 3-6.7 2.3 0 2.5 3 .6 4.6-.9.8-2 1.6-3.6 2.1zM13.8 12c4-1 6.7.5 6.7 3 0 2.3-3 2.5-4.6.6-.8-.9-1.6-2-2.1-3.6zM12 13.8c1 4-.5 6.7-3 6.7-2.3 0-2.5-3-.6-4.6.9-.8 2-1.6 3.6-2.1zM10.2 12c-4 1-6.7-.5-6.7-3 0-2.3 3-2.5 4.6-.6.8.9 1.6 2 2.1 3.6z"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>'
};

const hIco = (n, c = '') => `<svg class="ico ${c}" viewBox="0 0 24 24" aria-hidden="true">${HEARTH_ICONS[n] || ''}</svg>`;
const hEsc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const hClamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hStore = {
  get(k, d) { try { const v = localStorage.getItem('hearth.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('hearth.' + k, JSON.stringify(v)); } catch {} }
};
const WX = {
  'clear-night': ['Clear', 'moon'], cloudy: ['Cloudy', 'cloud'], fog: ['Fog', 'cloud'], hail: ['Hail', 'rain'],
  lightning: ['Storms', 'storm'], 'lightning-rainy': ['Storms', 'storm'], partlycloudy: ['Partly cloudy', 'cloud'],
  pouring: ['Heavy rain', 'rain'], rainy: ['Rain', 'rain'], snowy: ['Snow', 'snow'], 'snowy-rainy': ['Sleet', 'snow'],
  sunny: ['Sunny', 'sun'], windy: ['Windy', 'cloud'], 'windy-variant': ['Windy', 'cloud'], exceptional: ['Unusual weather', 'alert']
};
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
// Rain amount as shown (0.1 in or whole mm); '' when it would round to zero
const fmtRain = (v, pu) => { if (v == null) return ''; const t = pu === 'in' ? (+v).toFixed(1) : String(Math.round(v)); return +t > 0 ? `${t} ${pu}` : ''; };
const UV_LABEL = uv => uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : uv < 11 ? 'Very high' : 'Extreme';
// Feels-like: NWS heat index when hot, wind chill when cold, otherwise the air temperature
function feelsLike(t, rh, wind, unit) {
  const c = /C/i.test(unit || ''), f = c ? t * 9 / 5 + 32 : t, mph = c ? wind / 1.609 : wind;
  let r = f;
  if (f >= 80 && rh != null) {
    r = -42.379 + 2.04901523 * f + 10.14333127 * rh - .22475541 * f * rh - .00683783 * f * f - .05481717 * rh * rh + .00122874 * f * f * rh + .00085282 * f * rh * rh - .00000199 * f * f * rh * rh;
  } else if (f <= 50 && mph > 3) {
    r = 35.74 + .6215 * f - 35.75 * Math.pow(mph, .16) + .4275 * f * Math.pow(mph, .16);
  }
  return c ? (r - 32) * 5 / 9 : r;
}
const SAFETY = { smoke: ['Smoke detected', 'flame'], gas: ['Gas detected', 'alert'], carbon_monoxide: ['Carbon monoxide', 'alert'], moisture: ['Water leak', 'drop'], safety: ['Safety alarm', 'alert'] };

// Card shells, keyed by the names used in the board option
const HEARTH_CARDS = {
  rooms: t => `<article class="card${t ? ' tall' : ''}" id="cRooms" data-open="lights" role="button" tabindex="0" aria-label="Lights. Open brightness and color controls" style="--c:var(--lamp);--gc:var(--g-lamp)"><div class="in"></div></article>`,
  media: () => `<article class="card art-card" id="cMedia" data-open="media" role="button" tabindex="0" aria-label="Now playing. Open speakers" style="--c:var(--media);--gc:var(--g-media)"><div class="halo"></div><div class="in"></div></article>`,
  weather: () => `<article class="card" id="cWeather" data-open="weather" role="button" tabindex="0" aria-label="Weather. Open forecast" style="--c:var(--solar);--gc:var(--g-solar)"><div class="in"></div></article>`,
  vinyl: () => `<article class="card art-card" id="cVinyl" data-open="vinyl" role="button" tabindex="0" aria-label="Turntable. Open the record cover" style="--c:var(--media);--gc:var(--g-media)"><div class="halo"></div><div class="in"></div></article>`,
  agenda: () => `<article class="card" id="cAgenda" data-open="agenda" role="button" tabindex="0" aria-label="Calendar. Open the week" style="--c:var(--home)"><div class="in"></div></article>`,
  scenes: () => `<article class="card" id="cScenes" data-open="scenes" role="button" tabindex="0" aria-label="Scenes. Open all scenes" style="--c:var(--lamp);--gc:var(--g-lamp)"><div class="in"></div></article>`,
  door: () => `<article class="card" id="cDoor" data-open="door" role="button" tabindex="0" aria-label="Front door. Open camera" style="--c:var(--ok);--gc:var(--g-ok)"><div class="in"></div></article>`,
  tv: () => `<article class="card" id="cTv" data-open="tv" role="button" tabindex="0" aria-label="Apple TV. Open the remote" style="--c:var(--home);--gc:var(--g-home)"><div class="halo"></div><div class="in"></div></article>`,
  climate: () => `<article class="card" id="cClimate" data-open="climate" role="button" tabindex="0" aria-label="Room. Open the fan controls" style="--c:var(--home);--gc:var(--g-home)"><div class="in"></div></article>`,
  good: () => `<article class="card" id="cGood" style="--c:var(--media);--gc:var(--g-media);cursor:default"><div class="in"></div></article>`
};

class HearthPanel extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
    this._cache = new Map();
    this._events = []; this._fc = { daily: [], hourly: [] };
    // Display choices are saved per dashboard (its first URL segment): every dashboard shares this origin's storage. The old shared value seeds a dashboard's first visit.
    const dash = location.pathname.split('/')[1] || 'default';
    this._key = k => k + ':' + dash;
    this._prefs = { theme: hStore.get(this._key('theme'), hStore.get('theme', 'auto')), palette: hStore.get(this._key('palette'), 'midnight'), header: hStore.get(this._key('header'), hStore.get('header', 'show')) };
    this._snooze = hStore.get('snooze', {});
    this._hidden = hStore.get('media_hidden', []);
    this._sceneColors = {};
    this._room = null; this._roomOpen = new Set();
    this._current = null; this._armed = null; this._drag = false; this._snapTick = Date.now();
  }
  static getStubConfig() { return {}; }
  setConfig(config) { this._cfg = { ...HEARTH_DEFAULTS, ...(config || {}) }; if (this._built) this._update(); }
  getCardSize() { return 12; }
  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (!this._built) this._build();
    if (first) this._startData();
    this._queue();
  }
  connectedCallback() {
    this._timer = setInterval(() => this._tick(), 5000);
    this._onResize = () => this._fit();
    window.addEventListener('resize', this._onResize);
    requestAnimationFrame(() => this._fit());
    if (this._hass && !this._unsubs) this._startData();
  }
  disconnectedCallback() {
    clearInterval(this._timer); clearInterval(this._slowTimer);
    window.removeEventListener('resize', this._onResize);
    this._applyChrome(true);   // give Home Assistant its header back when this card leaves the page
    (this._unsubs || []).forEach(p => Promise.resolve(p).then(u => typeof u === 'function' && u()).catch(() => {}));
    this._unsubs = null;
  }

  /* ---------- helpers ---------- */
  _s(id) { return id ? this._hass.states[id] : undefined; }
  _weatherId() { const w = this._cfg.weather; return w && w !== 'auto' ? w : Object.keys(this._hass.states).find(id => id.startsWith('weather.')) || null; }
  _name(id, fallback) { return fallback || this._s(id)?.attributes.friendly_name || id; }
  _url(u) { return !u ? '' : u.startsWith('/') ? this._hass.hassUrl(u) : u; }
  _tf(d) { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  _ago(ts) {
    if (!ts || isNaN(ts)) return 'never';
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }
  _eventTime(id) { const s = this._s(id); return s ? Date.parse(s.state) : NaN; }
  _set(key, el, html) { if (this._cache.get(key) !== html) { this._cache.set(key, html); el.innerHTML = html; } }
  _call(domain, service, data = {}, target) {
    return this._hass.callService(domain, service, data, target).catch(err => this._toast(`Couldn’t reach ${domain}: ${err.message || err}`));
  }

  /* ---------- build ---------- */
  _build() {
    this._built = true;
    if (!document.querySelector('link[data-hearth-fonts]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = FONT_URL; l.dataset.hearthFonts = '1';
      document.head.appendChild(l);
    }
    this._root.innerHTML = `<style>${HEARTH_CSS}${hPaletteCss()}</style>
      <div class="ambient"></div>
      <div class="app">
        <header class="top">
          <div class="when"><div class="clock num" id="clock"></div><div class="date" id="date"></div></div>
          <div class="slot" id="slot" aria-live="polite"></div>
          <div class="top-actions"><button class="sky" id="sky" data-act="settings" aria-label="Theme settings"><span id="skyIco"></span><span><b id="skyNow"></b><small id="skyNext"></small></span></button></div>
        </header>
        <main class="board" id="board"></main>
      </div>
      <div class="scrim" id="scrim" hidden></div>
      <section class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" hidden>
        <header class="sheet-head" id="sheetHead"><div class="grab"></div><h2 id="sheetTitle"></h2><button class="btn round" data-act="close" aria-label="Close">${hIco('x')}</button></header>
        <div class="sheet-body" id="sheetBody"></div>
      </section>
      <div class="toast" id="toast" role="status"></div>
      <div class="night" id="night" hidden role="button" tabindex="0" aria-label="Wake the screen"><div class="night-clock num" id="nClock"></div><div class="night-date" id="nDate"></div><div class="night-hint">Tap to wake</div></div>`;
    const $ = s => this._root.querySelector(s);
    this.$ = $;
    $('#board').innerHTML = (this._cfg.board || []).map(b => { const o = typeof b === 'string' ? { card: b } : b; return HEARTH_CARDS[o.card]?.(!!o.tall) || ''; }).join('');
    const list = (this._cfg.board || []).map(b => typeof b === 'string' ? { card: b } : b).filter(o => HEARTH_CARDS[o.card]);
    const cells = list.reduce((n, o) => n + (o.tall ? 2 : 1), 0);
    this.style.setProperty('--prows', Math.ceil(cells / 2));
    if (cells % 2) $('#board').lastElementChild?.classList.add('last-wide');
    $('#night').addEventListener('click', e => { e.stopPropagation(); this._wakeUntil = Date.now() + this._wakeMs(); this._queue(); });
    this._root.addEventListener('click', e => this._onClick(e));
    this._root.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._current) this._closeSheet();
      const t = e.composedPath()[0];
      if ((e.key === 'Enter' || e.key === ' ') && t?.dataset?.open) { e.preventDefault(); this._openSheet(t.dataset.open); }
    });
    this._root.addEventListener('pointerdown', e => { if (e.composedPath()[0]?.type === 'range') this._drag = true; if (this._wakeUntil > Date.now()) this._wakeUntil = Date.now() + this._wakeMs(); wakeLock(); });
    this._root.addEventListener('pointerup', () => setTimeout(() => { this._drag = false; }, 900));
    this._root.addEventListener('change', e => this._onChange(e));
    this._root.addEventListener('input', e => { const el = e.composedPath()[0]; if (el?.dataset?.hue) el.closest('.sw-area').querySelector('[data-sat]').style.setProperty('--h', el.value); });
    this._root.addEventListener('pointerdown', e => this._pressStart(e));
    this._root.addEventListener('pointermove', e => { if (this._press && Math.hypot(e.clientX - this._press.x, e.clientY - this._press.y) > 12) this._pressEnd(); });
    ['pointerup', 'pointercancel'].forEach(t => this._root.addEventListener(t, () => this._pressEnd()));
    this._root.addEventListener('contextmenu', e => { if (this._tileOf(e)) e.preventDefault(); });
    this._initSwipe();
    requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add('ready')));
  }
  _fit() {
    if (!this.isConnected) return;
    const top = this.getBoundingClientRect().top + window.scrollY;
    const upright = window.innerHeight > window.innerWidth && window.innerWidth >= 700;   // tablet held upright: fill the screen, no scrolling
    const narrow = !upright && (window.innerWidth < 1000 || window.innerHeight < 600 || window.innerHeight > window.innerWidth);
    this.style.height = narrow ? '' : Math.max(560, window.innerHeight - Math.max(0, top)) + 'px';
  }

  /* ---------- data feeds ---------- */
  _startData() {
    if (!this._hass || !this.isConnected) return;
    const c = this._cfg, conn = this._hass.connection;
    this._unsubs = [];
    const wid = this._weatherId();
    if (wid && this._s(wid)) {
      ['daily', 'hourly'].forEach(type => {
        this._unsubs.push(conn.subscribeMessage(ev => { this._fc[type] = ev.forecast || []; this._queue(); },
          { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: wid }).catch(() => null));
      });
    }
    this._loadEvents(); this._loadSceneColors();
    clearInterval(this._slowTimer);
    this._slowTimer = setInterval(() => { this._loadEvents(); this._snapTick = Date.now(); this._queue(); }, 10 * 60000);
  }
  async _loadEvents(days = 2) {
    const cals = (this._cfg.calendars || []).filter(id => this._s(id));
    if (!cals.length) return;
    const start = new Date(), end = new Date(); end.setDate(end.getDate() + Math.max(days, 7)); end.setHours(23, 59, 0, 0);
    const q = `?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
    const res = await Promise.all(cals.map(id => this._hass.callApi('GET', `calendars/${id}${q}`)
      .then(list => list.map(e => ({ ...e, cal: this._name(id) }))).catch(() => [])));
    this._events = res.flat().map(e => {
      const allDay = !!e.start.date;
      const s = allDay ? new Date(e.start.date + 'T00:00:00') : new Date(e.start.dateTime);
      const en = allDay ? new Date(e.end.date + 'T00:00:00') : new Date(e.end.dateTime);
      return { title: e.summary || 'Busy', where: e.location || '', cal: e.cal, allDay, start: s, end: en };
    }).filter(e => e.end > new Date()).sort((a, b) => a.start - b.start);
    this._queue();
  }
  // Colours stored in each Home Assistant scene (read only). Hue scenes don't expose theirs, so they stay neutral.
  async _loadSceneColors() {
    const ids = Object.keys(this._hass.states).filter(id => id.startsWith('scene.') && this._s(id).attributes.id);
    await Promise.all(ids.map(async id => {
      try {
        const cfg = await this._hass.callApi('GET', `config/scene/config/${this._s(id).attributes.id}`);
        const counts = new Map(); let whiteOnly = false;
        Object.entries(cfg.entities || {}).forEach(([eid, e]) => {
          if (!eid.startsWith('light.') || e.state === 'off') return;
          if (!Array.isArray(e.rgb_color)) { if (e.brightness) whiteOnly = true; return; }
          const key = e.rgb_color.map(v => Math.round(v / 40) * 40).join(',');
          const hit = counts.get(key) || { rgb: e.rgb_color, n: 0 }; hit.n++; counts.set(key, hit);
        });
        // Warm white only when the scene has no coloured lights at all
        if (!counts.size && whiteOnly) counts.set('warm', { rgb: [255, 210, 122], n: 1 });
        this._sceneColors[id] = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 3).map(c => `rgb(${c.rgb.join(',')})`);
      } catch { /* not an admin, or not a UI scene */ }
    }));
    this._cache.delete('scenes');
    this._queue();
  }

  /* ---------- update loop ---------- */
  _queue() { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = null; this._update(); }); }
  _tick() { this._queue(); }
  _update() {
    if (!this._hass || !this._built) return;
    const $ = this.$;
    this._fit();
    this._applyTheme(); this._applyChrome();
    const now = new Date();
    const parts = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).formatToParts(now);
    const hm = parts.filter(p => p.type !== 'dayPeriod').map(p => p.value).join('').trim();
    const dp = parts.find(p => p.type === 'dayPeriod')?.value || '';
    this._set('clock', $('#clock'), `${hEsc(hm)}${dp ? `<small>${hEsc(dp)}</small>` : ''}`);
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    this._set('date', $('#date'), hEsc(dateStr));
    const night = this._night();
    $('#night').hidden = !night;
    if (night) { this._set('nClock', $('#nClock'), `${hEsc(hm)}${dp ? `<small>${hEsc(dp)}</small>` : ''}`); this._set('nDate', $('#nDate'), hEsc(dateStr)); }
    const has = id => !!$('#' + id);
    if (has('cRooms')) this._renderRooms();
    if (has('cMedia')) this._renderMedia();
    if (has('cWeather')) this._renderWeather();
    if (has('cDoor')) this._renderDoor();
    if (has('cAgenda')) this._renderAgenda();
    if (has('cScenes')) this._renderScenes();
    if (has('cVinyl')) this._renderVinyl();
    if (has('cTv')) this._renderTv();
    if (has('cClimate')) this._renderClimate();
    if (has('cGood')) this._renderGood();
    this._renderAlerts();
    if (this._current && !this._drag && !this._armed) {
      const sig = this._sheetSig(this._current);
      if (sig !== this._lastSheetSig) this._renderSheet(this._current);
    }
  }

  /* ---------- Home Assistant header ---------- */
  // Walks up through the shadow roots to HA's hui-root and adds (or removes) one style rule there. Nothing in HA is edited.
  _huiRoot() {
    let n = this;
    while (n) { if (n.localName === 'hui-root') return n; n = n.parentNode || n.host; }
    return null;
  }
  _applyChrome(release) {
    const root = this._huiRoot()?.shadowRoot;
    if (!root) return;
    const hide = !release && this._prefs.header === 'hide';
    let st = root.getElementById('hearth-chrome');
    if (hide && !st) {
      st = document.createElement('style'); st.id = 'hearth-chrome';
      st.textContent = ':host{--header-height:0px !important} .header{display:none !important} #view{min-height:100vh !important;padding-top:0 !important}';
      root.appendChild(st);
    } else if (!hide && st) st.remove();
    else return;
    [60, 400].forEach(ms => setTimeout(() => this._fit(), ms));
  }

  /* ---------- theme ---------- */
  _isDay() { const s = this._s('sun.sun'); return s ? s.state === 'above_horizon' : (new Date().getHours() >= 7 && new Date().getHours() < 19); }
  _applyTheme() {
    const t = this._prefs.theme;
    const light = t === 'light' ? true : t === 'dark' ? false : t === 'ha' ? !this._hass.themes?.darkMode : this._isDay();
    const sky = light ? 'light' : 'dark';
    if (this.getAttribute('sky') !== sky) this.setAttribute('sky', sky);
    const pal = HEARTH_PALETTES.some(p => p.id === this._prefs.palette) ? this._prefs.palette : 'midnight';
    if (this.getAttribute('palette') !== pal) this.setAttribute('palette', pal);
    const btn = this.$('#sky');
    btn.classList.toggle('is-day', light); btn.classList.toggle('is-night', !light);
    this._set('skyIco', this.$('#skyIco'), hIco(light ? 'sun' : 'moon'));
    const sun = this._s('sun.sun');
    let now = light ? 'Light' : 'Dark', next = '';
    if (t === 'auto' && sun) {
      const up = sun.state === 'above_horizon';
      const at = new Date(up ? sun.attributes.next_setting : sun.attributes.next_rising);
      next = `${up ? 'Dark' : 'Light'} at ${this._tf(at)}`;
    } else next = t === 'ha' ? 'Follows Home Assistant' : t === 'auto' ? 'Follows the sun' : 'Set manually';
    if (t === 'light' || t === 'dark') now += ' theme';
    this._set('skyNow', this.$('#skyNow'), hEsc(now));
    this._set('skyNext', this.$('#skyNext'), hEsc(next));
  }

  _paletteGrid() {
    const light = this.getAttribute('sky') === 'light';
    return `<div class="pal-grid">${HEARTH_PALETTES.map(p => {
      const c = light ? p.l : p.d, on = p.id === this._prefs.palette;
      return `<button class="pal ${on ? 'sel' : ''}" data-act="palette" data-v="${p.id}" aria-pressed="${on}" style="--p1:${c.bg};--p2:${c.surf};--p3:${c.acc}"><span class="pal-sw"></span><span>${hEsc(p.name)}</span></button>`;
    }).join('')}</div>`;
  }

  /* ---------- cards ---------- */
  _rooms() { return (this._cfg.rooms || []).map(r => ({ ...r, ...this._lightInfo(r.entity, r.name) })); }
  _lightInfo(entity, name) {
    {
      const s = this._s(entity);
      const na = !s || s.state === 'unavailable' || s.state === 'unknown';
      const on = s?.state === 'on';
      const pct = on && s.attributes.brightness != null ? Math.round(s.attributes.brightness / 2.55) : null;
      const dim = s && (s.attributes.supported_color_modes || []).some(m => m !== 'onoff');
      // The light's actual colour while on; white-only lights keep the default warm tint
      const rgb = on && Array.isArray(s.attributes.rgb_color) ? s.attributes.rgb_color : null;
      const tint = rgb ? `style="--c:rgb(${rgb.join(',')});--gc:rgb(${rgb.join(',')})"` : '';
      return { entity, name: name || this._name(entity), s, na, on, pct, dim, tint };
    }
  }
  _roomName() { return this._lightInfo(this._room, (this._cfg.rooms || []).find(r => r.entity === this._room)?.name).name; }
  // The working lights in a room: groups inside the group (a Hue room inside "Office (all)") are opened up, each light listed once, unavailable ones skipped
  _roomMembers() {
    const out = [], seen = new Set([this._room]);
    const walk = id => {
      const ids = this._s(id)?.attributes.entity_id;
      if (!Array.isArray(ids)) return;
      ids.forEach(m => {
        if (!m.startsWith('light.') || seen.has(m) || !this._s(m)) return;
        seen.add(m);
        if (Array.isArray(this._s(m).attributes.entity_id)) walk(m); else if (this._s(m).state !== 'unavailable') out.push(m);   // offline lights are left out
      });
    };
    walk(this._room);
    return out;
  }
  // Colour swatches, a hue and saturation pair, and a white-temperature slider, only for what the light supports
  _colorHTML(id) {
    const a = this._s(id)?.attributes || {}, modes = a.supported_color_modes || [];
    const hasTemp = modes.includes('color_temp'), hasColor = modes.some(m => ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'].includes(m));
    if (!hasTemp && !hasColor) return '';
    const lo = a.min_color_temp_kelvin || 2000, hi = a.max_color_temp_kelvin || 6500, k = v => hClamp(v, lo, hi);
    const sw = ([label, css, data]) => `<button class="sw-btn" style="background:${css}" data-act="light-color" data-id="${id}" data-v="${hEsc(JSON.stringify(data))}" aria-label="${label}"></button>`;
    const whites = hasTemp
      ? [['Warm white', '#ffc58a', { color_temp_kelvin: k(2700) }], ['Neutral white', '#fff1e0', { color_temp_kelvin: k(4000) }], ['Cool white', '#d6e6ff', { color_temp_kelvin: k(6000) }]]
      : [['Warm white', '#ffc58a', { hs_color: [32, 45] }], ['Neutral white', '#fff1e0', { hs_color: [35, 12] }], ['Cool white', '#d6e6ff', { hs_color: [215, 12] }]];
    const palette = [['Red', 0, 100], ['Coral', 10, 70], ['Orange', 24, 100], ['Amber', 38, 100], ['Yellow', 50, 100], ['Lime', 80, 90], ['Green', 130, 90], ['Mint', 155, 55],
      ['Teal', 175, 90], ['Cyan', 190, 95], ['Sky', 205, 70], ['Blue', 220, 90], ['Indigo', 245, 80], ['Purple', 268, 75], ['Magenta', 300, 80], ['Pink', 330, 70], ['Rose', 348, 55]];
    const colors = hasColor ? palette.map(([l, h, sat]) => [l, `hsl(${h} ${sat}% ${Math.round(50 + (100 - sat) / 2)}%)`, { hs_color: [h, sat] }]) : [];
    const hs = a.hs_color || [30, 100];
    const pick = hasColor ? `<small>Any color: hue, then saturation</small><input class="hue" type="range" min="0" max="360" step="1" value="${Math.round(hs[0])}" data-hue="${id}" aria-label="Hue">
      <input class="sat" type="range" min="0" max="100" step="1" value="${Math.round(hs[1])}" style="--h:${Math.round(hs[0])}" data-sat="${id}" aria-label="Saturation">` : '';
    return `<div class="sw-area"><small>Color</small><div class="swatches">${[...whites, ...colors].map(sw).join('')}</div>
      ${pick}${hasTemp ? `<small>White temperature, warm to cool</small><input type="range" min="${lo}" max="${hi}" step="50" value="${a.color_temp_kelvin ?? Math.round((lo + hi) / 2)}" data-kelvin="${id}" aria-label="White temperature">` : ''}</div>`;
  }
  _roomHTML() {
    const g = this._s(this._room);
    const room = this._lightInfo(this._room, (this._cfg.rooms || []).find(r => r.entity === this._room)?.name);
    const gname = g.attributes.friendly_name || '', members = this._roomMembers();
    const state = i => i.na ? 'Unavailable' : i.on ? (i.pct != null ? i.pct + '%' : 'On') : 'Off';
    const bri = i => i.on && i.dim ? `<input type="range" min="1" max="100" step="1" value="${i.pct ?? 100}" data-bri="${i.entity}" aria-label="${hEsc(i.name)} brightness">` : '';
    const base = gname.replace(/\s*\(all\)\s*$/i, '');
    const short = nm => { const r = nm.replace(new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i'), ''); return r.length >= 3 ? r : nm; };
    const used = {}, label = id => { const n = short(this._name(id)); used[n] = (used[n] || 0) + 1; return used[n] > 1 ? `${n} (${used[n]})` : n; };
    return `<div class="seg"><button class="btn lg" data-act="room-back">${hIco('chevl')}All lights</button></div>
      <div class="lamp ${room.on ? 'on' : ''}" ${room.tint}>
        <div class="lamp-top"><button class="btn" data-act="light-toggle" data-id="${room.entity}" ${room.na ? 'disabled' : ''} aria-pressed="${room.on}"><span>${members.length ? 'Whole room' : hEsc(room.name)}</span><small>${state(room)}</small></button></div>
        ${bri(room)}${room.na ? '' : this._colorHTML(room.entity)}
      </div>
      ${members.length ? `<div class="day-label">Lights in this room</div><div class="members">${members.map(id => {
        const m = this._lightInfo(id, label(id)), open = this._roomOpen.has(id), col = this._colorHTML(id);
        return `<div class="lamp ${m.on ? 'on' : ''}" ${m.tint}>
          <div class="lamp-top"><button class="btn" data-act="light-toggle" data-id="${id}" ${m.na ? 'disabled' : ''} aria-pressed="${m.on}"><span>${hEsc(m.name)}</span><small>${state(m)}</small></button>
          ${col && !m.na ? `<button class="btn lamp-go txt" data-act="member-color" data-id="${id}" aria-expanded="${open}">Color</button>` : ''}</div>
          ${bri(m)}${open ? col : ''}</div>`;
      }).join('')}</div>` : ''}`;
  }
  _renderRooms() {
    const rooms = this._rooms(), counted = rooms.filter(r => r.count !== false), lit = counted.filter(r => r.on), unit = this._cfg.rooms_unit || ['room lit', 'rooms lit'];
    const html = `<div class="card-head">${hIco('bulb')}<span>Lights</span><span class="note">${counted.length - lit.length} off</span></div>
      <div class="big num">${lit.length}<span class="u">${lit.length === 1 ? unit[0] : unit[1]}</span></div>
      ${rooms.length ? '' : '<div class="sub">Add your lights under <b>rooms:</b> in the card’s YAML.</div>'}
      <div class="tiles">${rooms.map(r => `<button class="tile ${r.on ? 'on' : ''} ${r.na ? 'na' : ''}" ${r.tint} data-act="light-toggle" data-id="${r.entity}" ${r.na ? 'disabled' : ''} aria-pressed="${r.on}">
        <i></i><span class="tt"><b>${hEsc(r.name)}</b><span>${r.na ? 'Unavailable' : r.on ? (r.pct != null ? r.pct + '%' : 'On') : 'Off'}</span></span></button>`).join('')}</div>`;
    this._set('rooms', this.$('#cRooms .in'), html);
  }
  _wakeMs() { return ((this._cfg.night && this._cfg.night.wake_seconds) || 45) * 1000; }
  // Night mode: after sunset the screen shows only a dim clock until someone taps it
  _night() { const n = this._cfg.night; return !!n && n.mode === 'dim' && !this._isDay() && Date.now() > (this._wakeUntil || 0); }
  _agendaList() {
    if (this._cfg.agenda_mode !== 'tomorrow') return this._upcoming();
    const a = new Date(); a.setDate(a.getDate() + 1); a.setHours(0, 0, 0, 0);
    const b = new Date(a); b.setDate(b.getDate() + 1);
    return this._events.filter(e => e.start < b && e.end > a);
  }
  _climate() {
    const c = this._cfg.climate || {}, num = id => { const v = parseFloat(this._s(id)?.state); return isNaN(v) ? null : v; };
    return { hum: num(c.humidity), temp: num(c.temperature), tu: this._s(c.temperature)?.attributes.unit_of_measurement || '°', fan: c.fan || {} };
  }
  _fanBtns(fan, cls = 'btn round') {
    const b = (id, icon, label) => id ? `<button class="${cls}" data-act="fan" data-id="${hEsc(id)}" data-v="${label}" aria-label="${label}">${hIco(icon)}</button>` : '';
    return b(fan.down, 'minus', 'Fan slower') + b(fan.power, 'power', 'Fan power') + b(fan.up, 'plus', 'Fan faster');
  }
  _renderClimate() {
    const card = this.$('#cClimate'), k = this._climate();
    const big = k.temp != null ? `${Math.round(k.temp)}<span class="u">${hEsc(k.tu)}</span>` : k.hum != null ? `${Math.round(k.hum)}<span class="u">%</span>` : '—';
    const sub = k.temp != null && k.hum != null ? `${Math.round(k.hum)}% humidity` : k.hum != null ? 'Humidity' : '';
    const hasFan = k.fan.up || k.fan.down || k.fan.power;
    const html = `<div class="card-head">${hIco('fan')}<span>Room</span></div>
      <div class="big num">${big}</div><div class="sub">${hEsc(sub)}</div>
      ${hasFan ? `<div class="foot fan-row"><span class="fan-l">Floor fan</span>${this._fanBtns(k.fan)}</div>` : ''}`;
    this._set('climate', card.querySelector('.in'), html);
  }
  _renderGood() {
    const g = this._cfg.goodnight || {}, card = this.$('#cGood'), name = g.name || 'Goodnight';
    const html = `<div class="card-head">${hIco('moon')}<span>Bedtime</span></div>
      <button class="btn lg good-btn confirm" style="--c:var(--media)" data-act="scene" data-id="${hEsc(g.entity)}" data-confirm="Tap again: ${hEsc(name)}"><span class="lbl">${hIco('moon')}${hEsc(name)}</span></button>
      <div class="sub">${hEsc(g.detail || 'Tap twice to turn off the lights')}</div>`;
    this._set('good', card.querySelector('.in'), html);
  }
  _players() {
    const c = this._cfg, hidden = new Set([...(c.media_ignore || []), ...this._hidden]);
    const ids = Array.isArray(c.media) ? c.media : Object.keys(this._hass.states).filter(id => id.startsWith('media_player.'));
    return ids.filter(id => !hidden.has(id)).map(id => this._s(id)).filter(p => p && p.state !== 'unavailable');
  }
  _activePlayers() {
    const newest = (a, b) => Date.parse(b.last_changed) - Date.parse(a.last_changed);
    const ps = this._players();
    return [...ps.filter(p => p.state === 'playing').sort(newest), ...ps.filter(p => p.state === 'paused').sort(newest)];
  }
  // Pinned player wins only while it plays; otherwise the most recently started playing player; then a pause from the last hour
  _mainPlayer() {
    const ps = this._players(), newest = (a, b) => Date.parse(b.last_changed) - Date.parse(a.last_changed);
    const pinned = this._pinned && ps.find(p => p.entity_id === this._pinned);
    if (pinned?.state === 'playing') return pinned;
    const playing = ps.filter(p => p.state === 'playing').sort(newest)[0];
    if (playing) return playing;
    if (pinned?.state === 'paused') return pinned;
    this._pinned = null;
    return ps.filter(p => p.state === 'paused' && p.attributes.media_title && Date.now() - Date.parse(p.last_changed) < 36e5).sort(newest)[0];
  }
  _vinyl() {
    const v = this._cfg.vinyl || {};
    const album = (this._s(v.album)?.state || '').trim();
    if (!album || album === 'unknown' || album === 'unavailable') return null;
    let cover = (this._s(v.cover)?.state || '').trim();
    const i = cover.indexOf('/local/');
    if (i > 0) cover = cover.slice(i);   // same file, served by whichever address this tablet uses for HA
    return { album, artist: (this._s(v.artist)?.state || '').trim(), cover: this._url(cover) };
  }
  /* Cover-first layout shared by the media and turntable cards: big square cover, text column beside it */
  _coverCard({ art, icon, label, title, who, where, dimTitle, controls = '' }) {
    const bg = art ? `style="background-image:url('${hEsc(art)}')"` : '';
    return `${art ? `<div class="backdrop" ${bg}></div>` : ''}
      <div class="cover" ${bg}>${art ? '' : hIco(icon)}</div>
      <div class="art-text">
        <div class="card-head">${hIco(icon)}<span>${hEsc(label)}</span></div>
        <div class="np-title num" ${dimTitle ? 'style="color:var(--dim)"' : ''}>${hEsc(title)}</div>
        ${who ? `<div class="who">${hEsc(who)}</div>` : ''}
        ${where ? `<div class="where">${hEsc(where)}</div>` : ''}
        ${controls ? `<div class="controls">${controls}</div>` : ''}
      </div>`;
  }
  _renderVinyl() {
    const v = this._vinyl(), card = this.$('#cVinyl');
    card.classList.toggle('live', !!v);
    const html = v
      ? this._coverCard({ art: v.cover, icon: 'disc', label: 'Now spinning', title: v.album, who: v.artist, where: 'Turntable' })
      : this._coverCard({ icon: 'disc', label: 'Turntable', title: 'Nothing spinning', who: 'No record set', dimTitle: true });
    this._set('vinyl', card.querySelector('.in'), html);
  }
  _tv() {
    const c = this._cfg.tv || {}, s = this._s(c.player);
    const on = !!s && !['off', 'standby', 'unavailable', 'unknown'].includes(s.state);
    return { c, s, on, playing: s?.state === 'playing', name: c.name || 'Apple TV' };
  }
  _tvPowerBtn(t, cls = 'btn round') {
    return t.on
      ? `<button class="${cls} confirm" data-act="tv-power" data-v="turn_off" data-confirm="Off?" aria-label="Turn off ${hEsc(t.name)}"><span class="lbl">${hIco('power')}</span></button>`
      : `<button class="${cls} primary" style="--c:var(--home)" data-act="tv-power" data-v="turn_on" aria-label="Turn on ${hEsc(t.name)}"><span class="lbl">${hIco('power')}</span></button>`;
  }
  _renderTv() {
    const t = this._tv(), card = this.$('#cTv');
    card.classList.toggle('live', t.playing);
    const a = t.s?.attributes || {};
    let html;
    if (!t.c.player) {
      html = `<div class="card-head">${hIco('tv')}<span>${hEsc(t.name)}</span></div><div class="big word num" style="color:var(--dim)">Not set up</div><div class="sub">Add this Apple TV in Home Assistant, then set it in this dashboard</div>`;
    } else if (!t.s || t.s.state === 'unavailable') {
      html = `<div class="card-head">${hIco('tv')}<span>${hEsc(t.name)}</span></div><div class="big word num" style="color:var(--dim)">Offline</div><div class="sub">Can’t reach the Apple TV</div>`;
    } else if (!t.on) {
      html = `<div class="card-head">${hIco('tv')}<span>${hEsc(t.name)}</span>${t.c.room ? `<span class="note">${hEsc(t.c.room)}</span>` : ''}</div>
        <div class="big word num" style="color:var(--dim)">Off</div><div class="sub">Tap power to wake it</div>
        <div class="foot controls" style="justify-content:flex-start">${this._tvPowerBtn(t)}</div>`;
    } else {
      const title = a.media_title || a.app_name || 'Home screen';
      const sub = [a.media_title ? a.app_name : '', a.media_artist || a.media_series_title || ''].filter(Boolean).join(' · ') || (t.playing ? 'Playing' : t.s.state === 'paused' ? 'Paused' : 'On');
      html = `<div class="card-head">${hIco('tv')}<span>${t.playing ? 'Watching' : hEsc(t.name)}</span><span class="note">${t.s.state === 'paused' ? 'Paused' : 'On'}</span></div>
        <div class="big word num">${hEsc(title)}</div><div class="sub">${hEsc(sub)}</div>
        <div class="foot controls tv-row">
          <button class="btn round" data-act="tv-cmd" data-v="menu" aria-label="Back">${hIco('back')}</button>
          <button class="btn round primary" style="--c:var(--home)" data-act="tv-media" data-v="media_play_pause" aria-label="${t.playing ? 'Pause' : 'Play'}">${hIco(t.playing ? 'pause' : 'play')}</button>
          <button class="btn round" data-act="tv-cmd" data-v="home" aria-label="Home screen">${hIco('house')}</button>
          ${this._tvPowerBtn(t)}
        </div>`;
    }
    this._set('tv', card.querySelector('.in'), html);
  }
  _renderMedia() {
    const p = this._mainPlayer(), card = this.$('#cMedia');
    const playing = p?.state === 'playing';
    card.classList.toggle('live', playing);
    let html;
    if (!p) {
      html = this._coverCard({ icon: 'music', label: 'Now playing', title: 'Quiet', who: 'Nothing is playing', dimTitle: true });
    } else {
      const a = p.attributes;
      html = this._coverCard({
        art: this._url(a.entity_picture), icon: 'music', label: playing ? 'Now playing' : 'Paused',
        title: a.media_title || a.source || 'Playing', who: a.media_artist || a.media_album_name || a.app_name || '', where: a.friendly_name,
        controls: `<button class="btn round ctl-prev" data-act="media" data-v="media_previous_track" data-id="${p.entity_id}" aria-label="Previous">${hIco('prev')}</button>
          <button class="btn round primary" style="--c:var(--media)" data-act="media" data-v="media_play_pause" data-id="${p.entity_id}" aria-label="${playing ? 'Pause' : 'Play'}">${hIco(playing ? 'pause' : 'play')}</button>
          <button class="btn round" data-act="media" data-v="media_next_track" data-id="${p.entity_id}" aria-label="Next">${hIco('next')}</button>`
      });
    }
    this._set('media', card.querySelector('.in'), html);
  }
  _wx() {
    const w = this._s(this._weatherId());
    if (!w) return null;
    const a = w.attributes, [label, icon] = WX[w.state] || [w.state, 'cloud'];
    const d0 = this._fc.daily[0], d1 = this._fc.daily[1];
    const unit = a.temperature_unit || '°', pu = a.precipitation_unit || '';
    const wet = pu === 'in' ? 0.02 : 0.5;
    const soonRain = this._fc.hourly.slice(0, 12).find(h => (h.precipitation ?? 0) >= wet || /rain|pouring|lightning/.test(h.condition || ''));
    const hint = soonRain ? `Rain around ${new Date(soonRain.datetime).toLocaleTimeString([], { hour: 'numeric' })}`
      : d1 && /rain|pouring|lightning|snow/.test(d1.condition || '') ? 'Rain tomorrow' : '';
    return { w, a, label, unit, pu, hint,
      icon: !this._isDay() && (icon === 'sun' || icon === 'cloud') ? (icon === 'sun' ? 'moon' : 'nightcloud') : icon,
      temp: Math.round(a.temperature), hi: d0?.temperature, lo: d0?.templow,
      feels: a.temperature != null ? Math.round(feelsLike(a.temperature, a.humidity, a.wind_speed || 0, unit)) : null,
      humidity: a.humidity, dew: a.dew_point, wind: a.wind_speed != null ? Math.round(a.wind_speed) : null, windUnit: a.wind_speed_unit || '',
      bearing: a.wind_bearing, dir: a.wind_bearing != null ? COMPASS[Math.round(a.wind_bearing / 22.5) % 16] : '',
      uvMax: d0?.uv_index != null ? Math.round(d0.uv_index) : a.uv_index, rain: d0?.precipitation };
  }
  _hourIcon(h) {
    const [, icon] = WX[h.condition] || ['', 'cloud'], sun = this._s('sun.sun'), t = new Date(h.datetime);
    if (!sun || !(icon === 'sun' || icon === 'cloud')) return icon;
    const hr = d => d.getHours() + d.getMinutes() / 60, x = hr(t);
    const day = x >= hr(new Date(sun.attributes.next_rising)) && x < hr(new Date(sun.attributes.next_setting));
    return day ? icon : (icon === 'sun' ? 'moon' : 'nightcloud');
  }
  _renderWeather() {
    const x = this._wx();
    let html;
    if (!x) html = `<div class="card-head">${hIco('cloud')}<span>Outside</span></div><div class="sub">Weather entity not found</div>`;
    else {
      const rainTxt = x.rain == null ? '—' : hEsc(fmtRain(x.rain, x.pu) || 'None');
      const stat = (label, val, extra = '') => `<div class="wx-stat"><span>${label}</span><b class="num">${val}</b>${extra}</div>`;
      const hours = this._fc.hourly.slice(1, 6).map(h => `<div class="wx-hour"><small>${new Date(h.datetime).toLocaleTimeString([], { hour: 'numeric' }).replace(' ', '')}</small>${hIco(this._hourIcon(h))}<b class="num">${Math.round(h.temperature)}°</b></div>`).join('');
      html = `<div class="card-head">${hIco(x.icon)}<span>Outside</span>${x.hint ? `<span class="note wx-hint">${hEsc(x.hint)}</span>` : `<span class="note">${hEsc(x.label)}</span>`}</div>
        <div class="wx-main">
          <div class="wx-now">
            <div class="big num">${x.temp}<span class="u">${hEsc(x.unit)}</span></div>
            <div class="wx-feel">${x.feels != null && x.feels !== x.temp ? `Feels ${x.feels}° · ` : ''}${x.hi != null ? `H ${Math.round(x.hi)}° L ${Math.round(x.lo)}°` : hEsc(x.label)}</div>
          </div>
          <div class="wx-grid">
            ${stat('Humidity', x.humidity != null ? x.humidity + '%' : '—')}
            ${stat('Wind', x.wind != null ? x.wind : '—', x.wind != null ? `<i class="wx-dir">${x.bearing != null ? `<span style="transform:rotate(${Math.round(x.bearing + 180)}deg)">${hIco('arrow')}</span>` : ''}${hEsc(x.dir)}</i>` : '')}
            ${stat('UV peak', x.uvMax != null ? x.uvMax : '—', x.uvMax != null ? `<i>${UV_LABEL(x.uvMax)}</i>` : '')}
            ${stat('Rain today', rainTxt)}
          </div>
        </div>
        ${hours ? `<div class="foot wx-hours">${hours}</div>` : ''}`;
    }
    this._set('weather', this.$('#cWeather .in'), html);
  }
  _snapUrl() {
    const cam = this._s(this._cfg.camera);
    if (!cam?.attributes.entity_picture) return '';
    const u = this._url(cam.attributes.entity_picture);
    return u + (u.includes('?') ? '&' : '?') + 't=' + Math.floor(this._snapTick / 1000);
  }
  _door() {
    const c = this._cfg, recent = (c.recent_minutes || 3) * 60000, now = Date.now();
    const ding = this._eventTime(c.doorbell), motion = this._eventTime(c.motion);
    const bat = parseFloat(this._s(c.doorbell_battery)?.state);
    const sw = this._s(c.motion_switch);
    return { ding, motion, bat, sw, dingNow: now - ding < recent, motionNow: now - motion < recent };
  }
  _renderDoor() {
    const d = this._door(), card = this.$('#cDoor'), snap = this._snapUrl();
    const lvl = d.dingNow ? 'red' : d.motionNow || this._batteryLow(d) ? 'amber' : '';
    if (lvl) card.dataset.attn = lvl; else delete card.dataset.attn;
    card.style.setProperty('--c', lvl === 'red' ? 'var(--red)' : lvl ? 'var(--amber)' : 'var(--ok)');
    const flag = d.dingNow ? '<span class="flag red">At the door</span>' : d.motionNow ? '<span class="flag">Motion</span>' : this._batteryLow(d) ? `<span class="flag">Battery ${Math.round(d.bat)}%</span>` : `<span class="note">${d.sw?.state === 'off' ? 'Motion alerts off' : ''}</span>`;
    const html = `<div class="card-head">${hIco('door')}<span>Front door</span>${flag}</div>
      <div class="snap" ${snap ? `style="background-image:url('${hEsc(snap)}')"` : ''}>${snap ? '' : hIco('camera')}</div>
      <div class="sub">Motion ${this._ago(d.motion)} · Rang ${this._ago(d.ding)}</div>`;
    this._set('door', card.querySelector('.in'), html);
  }
  _batteryLow(d) { return !isNaN(d.bat) && d.bat <= 15 && !this._snoozed('battery'); }
  _upcoming() { const now = new Date(); return this._events.filter(e => e.allDay ? e.end > now : e.start >= now || e.end > now); }
  _whenLabel(e) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(e.start); day.setHours(0, 0, 0, 0);
    const diff = Math.round((day - today) / 864e5);
    const dayWord = diff <= 0 ? '' : diff === 1 ? 'Tomorrow' : e.start.toLocaleDateString([], { weekday: 'short' });
    if (e.allDay) return diff <= 0 ? 'Today' : dayWord;
    return (dayWord ? dayWord + ' ' : '') + this._tf(e.start);
  }
  _renderAgenda() {
    // Next event in time order, all-day ones included; today's all-day events (birthdays, holidays) go to the list below
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
    const tm = this._cfg.agenda_mode === 'tomorrow', up = this._agendaList(), first = up.find(e => !(e.allDay && e.start <= endOfToday)) || up[0];
    let html;
    if (!first) html = `<div class="card-head">${hIco('calendar')}<span>${tm ? 'Tomorrow' : 'Up next'}</span></div><div class="big word num">Clear</div><div class="sub">Nothing ${tm ? 'tomorrow' : 'in the next week'}</div>`;
    else {
      const isToday = first.start.toDateString() === new Date().toDateString() || (first.allDay && first.start <= new Date());
      const rest = up.filter(e => e !== first).slice(0, 2);
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const dayName = isToday ? 'Up next' : first.start.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : first.start.toLocaleDateString([], { weekday: 'long' });
      html = `<div class="card-head">${hIco('calendar')}<span>${hEsc(dayName)}</span><span class="note">${hEsc(first.cal)}</span></div>
        <div class="big num ${first.allDay ? 'word' : ''}">${hEsc(first.allDay ? (isToday ? 'Today' : 'All day') : this._tf(first.start).replace(/\s?[AP]M$/i, ''))}${!first.allDay && /[AP]M$/i.test(this._tf(first.start)) ? `<span class="u">${this._tf(first.start).slice(-2)}</span>` : ''}</div>
        <div class="sub">${hEsc(first.title)}</div>
        <div class="foot mini-list">${rest.map(e => `<div><span class="num">${hEsc(this._whenLabel(e))}</span><span>${hEsc(e.title)}</span></div>`).join('')}</div>`;
    }
    this._set('agenda', this.$('#cAgenda .in'), html);
  }
  _lastScene() {
    const ids = [...(this._cfg.scenes || []).map(s => s.entity), ...Object.keys(this._hass.states).filter(id => id.startsWith('scene.'))];
    let best = null;
    ids.forEach(id => {
      const s = this._s(id); if (!s) return;
      const t = id.startsWith('script.') ? Date.parse(s.attributes.last_triggered) : Date.parse(s.state);
      if (!isNaN(t) && (!best || t > best.t)) best = { id, t, name: this._name(id) };
    });
    return best;
  }
  _sceneChip(sc, cls = 'chip', current = false) {
    const name = sc.name || this._name(sc.entity), cols = this._sceneColors[sc.entity] || [];
    const vars = cols.map((c, i) => `--c${i + 1}:${c}`).join(';');
    const sw = cols.length ? `<span class="sw">${cols.map(c => `<i style="background:${c}"></i>`).join('')}</span>` : '';
    const klass = `${cls}${cols.length ? ' tinted' : ''}${current ? ' current' : ''}${sc.confirm ? ' confirm' : ''}`;
    const conf = sc.confirm ? ` data-confirm="Tap again: ${hEsc(name)}"` : '';
    return `<button class="${klass}" ${vars ? `style="${vars}"` : ''} data-act="scene" data-id="${sc.entity}"${conf}>${sw}<span class="lbl">${hEsc(name)}</span></button>`;
  }
  _renderScenes() {
    const last = this._lastScene(), today = last && new Date(last.t).toDateString() === new Date().toDateString();
    const html = `<div class="card-head">${hIco('sparkle')}<span>Scenes</span><span class="note">${last ? `${hEsc(last.name)} · ${today ? this._tf(new Date(last.t)) : this._ago(last.t)}` : ''}</span></div>
      <div class="chips scene-grid">${(this._cfg.scenes || []).filter(s => this._s(s.entity)).map(s => this._sceneChip(s, 'chip', last?.id === s.entity)).join('')}
        ${(this._cfg.rooms || []).length ? '<button class="chip confirm" data-act="all-off" data-confirm="Tap again: all off"><span class="lbl">All lights off</span></button>' : '<span class="sub">Add scenes under <b>scenes:</b> in the card’s YAML.</span>'}</div>`;
    this._set('scenes', this.$('#cScenes .in'), html);
  }

  /* ---------- alerts ---------- */
  _snoozed(id) { return (this._snooze[id] || 0) > Date.now(); }
  _alerts() {
    const a = [], d = this._door();
    if (d.dingNow) a.push({ id: 'ding', lvl: 'red', icon: 'bell', title: 'Someone’s at the door', detail: this._ago(d.ding), open: 'door' });
    Object.values(this._hass.states).forEach(s => {
      if (!s.entity_id.startsWith('binary_sensor.') || s.state !== 'on') return;
      const k = SAFETY[s.attributes.device_class];
      if (k) a.push({ id: 'safety-' + s.entity_id, lvl: 'red', icon: k[1], title: k[0], detail: s.attributes.friendly_name });
    });
    if (d.motionNow && !d.dingNow) a.push({ id: 'motion', lvl: 'amber', icon: 'motion', title: 'Motion at the front door', detail: this._ago(d.motion), open: 'door' });
    if (this._batteryLow(d)) a.push({ id: 'battery', lvl: 'amber', icon: 'battery', title: 'Doorbell battery low', detail: `${Math.round(d.bat)}%`, snooze: true });
    return a;
  }
  _renderAlerts() {
    const al = this._alerts(), top = al[0];
    const html = top
      ? `<button class="alert-pill ${top.lvl === 'red' ? 'red' : ''}" data-act="open-alerts">${hIco(top.icon)}<span><b>${hEsc(top.title)}</b> · ${hEsc(top.detail)}</span>${al.length > 1 ? `<span class="more">+${al.length - 1}</span>` : ''}${hIco('chev', 'chev')}</button>`
      : `<div class="calm"><i></i>Everything’s normal</div>`;
    this._set('slot', this.$('#slot'), html);
  }

  /* ---------- sheets ---------- */
  _sheetSig(type) {
    const st = id => { const s = this._s(id); return s ? s.state + (s.attributes.brightness ?? '') + (s.attributes.volume_level ?? '') + (s.attributes.media_title ?? '') : ''; };
    switch (type) {
      case 'lights': {
        const ids = this._room ? [this._room, ...this._roomMembers()] : (this._cfg.rooms || []).map(r => r.entity);
        return this._room + [...this._roomOpen].join() + ids.map(id => st(id) + (this._s(id)?.attributes.rgb_color || '') + (this._s(id)?.attributes.color_temp_kelvin || '')).join('|');
      }
      case 'media': return this._activePlayers().map(p => p.entity_id + st(p.entity_id)).join('|') + this._pinned + this._hidden.join();
      case 'vinyl': return JSON.stringify(this._vinyl());
      case 'tv': { const t = this._tv(); return t.s ? t.s.state + (t.s.attributes.media_title ?? '') + (t.s.attributes.app_name ?? '') : ''; }
      case 'door': return [this._cfg.doorbell, this._cfg.motion, this._cfg.motion_switch, this._cfg.doorbell_battery].map(st).join('|');
      case 'weather': return JSON.stringify(this._fc.hourly.slice(0, 8)) + st(this._weatherId());
      case 'agenda': return this._events.length + ':' + (this._events[0]?.title || '');
      case 'alerts': return this._alerts().map(a => a.id + a.detail).join('|');
      case 'settings': return this._prefs.theme + this._prefs.palette + this._prefs.header + this.getAttribute('sky');
      case 'climate': { const k = this._climate(); return `${k.hum}|${k.temp}`; }
      default: return '';
    }
  }
  _sheetHTML(type) {
    const seg = (act, opts, cur, c) => `<div class="seg">${opts.map(([v, l]) => `<button class="btn lg ${v === cur ? 'sel' : ''}" style="--c:${c}" data-act="${act}" data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`;
    switch (type) {
      case 'lights': {
        if (this._room && this._s(this._room)) return this._roomHTML();
        this._room = null;
        const rooms = this._rooms();
        return `<div class="seg"><button class="btn lg confirm" data-act="all-off" data-confirm="Tap again to turn everything off"><span class="lbl">Turn everything off</span></button></div>
          <div class="lights-grid">${rooms.map(r => `<div class="lamp ${r.on ? 'on' : ''}" ${r.tint}>
            <div class="lamp-top"><button class="btn" data-act="light-toggle" data-id="${r.entity}" ${r.na ? 'disabled' : ''} aria-pressed="${r.on}"><span>${hEsc(r.name)}</span><small>${r.na ? 'Unavailable' : r.on ? (r.pct != null ? r.pct + '%' : 'On') : 'Off'}</small></button>
            ${r.na ? '' : `<button class="btn lamp-go" data-act="room" data-id="${r.entity}" aria-label="${hEsc(r.name)} details">${hIco('chev')}</button>`}</div>
            ${r.on && r.dim ? `<input type="range" min="1" max="100" step="1" value="${r.pct ?? 100}" data-bri="${r.entity}" aria-label="${hEsc(r.name)} brightness">` : ''}
          </div>`).join('')}</div>`;
      }
      case 'vinyl': {
        const v = this._vinyl();
        if (!v) return `<div class="panel spin"><div class="spin-art">${hIco('disc')}</div><div class="spin-t"><h3>Turntable</h3><div class="np-title num" style="font-size:28px;color:var(--dim)">Nothing spinning</div><p>When a record is set, its cover appears here.</p></div></div>`;
        return `<div class="panel spin"><div class="spin-art" ${v.cover ? `style="background-image:url('${hEsc(v.cover)}')"` : ''}>${v.cover ? '' : hIco('disc')}</div>
          <div class="spin-t"><h3>Now spinning</h3><div class="np-title num" style="font-size:30px">${hEsc(v.album)}</div><p>${hEsc(v.artist)}</p></div></div>`;
      }
      case 'tv': {
        const t = this._tv(), a = t.s?.attributes || {};
        if (!t.c.player) return '<div class="empty">This Apple TV isn’t set up yet. Add it in Home Assistant (Settings, Devices &amp; services, Apple TV), then put its media player and remote in this dashboard’s settings.</div>';
        if (!t.s || t.s.state === 'unavailable') return '<div class="empty">The Apple TV isn’t responding. Check that it’s on the network.</div>';
        const apps = (t.c.apps || []).filter(n => (a.source_list || []).includes(n));
        const pad = (v, icon, label, cls = '') => `<button class="btn lg round ${cls}" data-act="tv-cmd" data-v="${v}" aria-label="${label}">${hIco(icon)}</button>`;
        return `<div class="cols">
          <div class="panel">
            <h3>${t.on ? hEsc(a.media_title || a.app_name || 'Home screen') : 'Off'}</h3>
            <div class="dpad">
              <span></span>${pad('up', 'chevu', 'Up')}<span></span>
              ${pad('left', 'chevl', 'Left')}<button class="btn lg round primary ok" style="--c:var(--home)" data-act="tv-cmd" data-v="select" aria-label="Select">OK</button>${pad('right', 'chev', 'Right')}
              <span></span>${pad('down', 'chevd', 'Down')}<span></span>
            </div>
            <div class="seg">
              <button class="btn lg" data-act="tv-cmd" data-v="menu">${hIco('back')}Back</button>
              <button class="btn lg" data-act="tv-cmd" data-v="home">${hIco('house')}Home</button>
            </div>
          </div>
          <div class="panel">
            <h3>Playback</h3>
            <div class="controls">
              <button class="btn lg round" data-act="tv-media" data-v="media_previous_track" aria-label="Previous">${hIco('prev')}</button>
              <button class="btn lg round primary" style="--c:var(--home)" data-act="tv-media" data-v="media_play_pause" aria-label="Play or pause">${hIco(t.playing ? 'pause' : 'play')}</button>
              <button class="btn lg round" data-act="tv-media" data-v="media_next_track" aria-label="Next">${hIco('next')}</button>
              ${this._tvPowerBtn(t, 'btn lg round')}
            </div>
            ${apps.length ? `<h3>Open an app</h3><div class="seg">${apps.map(n => `<button class="btn lg" data-act="tv-app" data-v="${hEsc(n)}">${hEsc(n.split(':')[0])}</button>`).join('')}</div>` : ''}
          </div>
        </div>`;
      }
      case 'media': {
        const main = this._mainPlayer(), active = this._activePlayers();
        const rows = active.map(p => {
          const a = p.attributes, playing = p.state === 'playing', art = this._url(a.entity_picture), onCard = main?.entity_id === p.entity_id;
          return `<div class="row" style="--c:var(--media)">
            <div class="thumb" ${art ? `style="background-image:url('${hEsc(art)}')"` : ''}></div>
            <div class="what"><b>${hEsc(a.friendly_name)}${onCard ? ' · on the card' : ''}</b><span>${hEsc([a.media_title, a.media_artist].filter(Boolean).join(' · ') || (playing ? 'Playing' : 'Paused'))}</span></div>
            <div class="acts">
              ${a.volume_level != null ? `<input class="vol" type="range" min="0" max="100" value="${Math.round(a.volume_level * 100)}" data-vol="${p.entity_id}" aria-label="${hEsc(a.friendly_name)} volume">` : ''}
              <button class="btn lg round ${playing ? 'primary' : ''}" style="--c:var(--media)" data-act="media" data-v="media_play_pause" data-id="${p.entity_id}" aria-label="${playing ? 'Pause' : 'Play'} ${hEsc(a.friendly_name)}">${hIco(playing ? 'pause' : 'play')}</button>
              ${onCard ? '' : `<button class="btn lg" data-act="pin" data-id="${p.entity_id}">Show on card</button>`}
              <button class="btn lg" data-act="hide-player" data-id="${p.entity_id}">Hide</button>
            </div></div>`;
        }).join('');
        const hidden = this._hidden.map(id => `<div class="row">${hIco('music')}<div class="what"><b>${hEsc(this._name(id))}</b><span>${hEsc(id)}</span></div><div class="acts"><button class="btn lg" data-act="unhide-player" data-id="${id}">Show again</button></div></div>`).join('');
        const fromConfig = (this._cfg.media_ignore || []).length;
        const al = this._cfg.alexa, acts = al?.device_id ? al.actions || [] : [];
        const abtn = g => acts.map((x, i) => x.group === g ? `<button class="btn lg" data-act="alexa" data-v="${i}">${hIco(x.icon)}${hEsc(x.name)}</button>` : '').join('');
        const alexa = acts.length ? `<div class="panel"><h3>${hEsc(al.name || 'Alexa')} · Alexa</h3><div class="seg">${abtn('play')}</div><div class="seg">${abtn('control')}</div></div>` : '';
        return `${alexa}<div class="rows">${rows || '<div class="empty">Nothing is playing or paused right now.</div>'}</div>
          <p class="empty">The card shows whatever started playing most recently. “Show on card” keeps a speaker there only while it plays. “Hide” keeps a player off the card for good.</p>
          ${hidden ? `<div class="day-label">Hidden from the card</div><div class="rows">${hidden}</div>` : ''}
          ${fromConfig ? `<p class="empty">${fromConfig} more ${fromConfig === 1 ? 'player is' : 'players are'} hidden in the dashboard settings (media_ignore).</p>` : ''}`;
      }
      case 'door': {
        const d = this._door(), snap = this._snapUrl();
        return `<div class="big-snap" id="bigSnap" ${snap ? `style="background-image:url('${hEsc(snap)}')"` : ''}></div>
          <div class="rows">
            <div class="row" style="--c:var(--ok)">${hIco('motion')}<div class="what"><b>Last motion</b><span>${this._ago(d.motion)}${isNaN(d.motion) ? '' : ' · ' + new Date(d.motion).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span></div></div>
            <div class="row" style="--c:var(--ok)">${hIco('bell')}<div class="what"><b>Last ring</b><span>${this._ago(d.ding)}${isNaN(d.ding) ? '' : ' · ' + new Date(d.ding).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span></div></div>
            ${!isNaN(d.bat) ? `<div class="row" style="--c:${d.bat <= 15 ? 'var(--amber)' : 'var(--ok)'}">${hIco('battery')}<div class="what"><b>Doorbell battery</b><span>${Math.round(d.bat)}%${d.bat <= 15 ? ' · charge it soon' : ''}</span></div></div>` : ''}
            ${d.sw ? `<div class="row">${hIco('camera')}<div class="what"><b>Motion alerts</b><span>${d.sw.state === 'on' ? 'On' : 'Off'}</span></div><div class="acts">${d.sw.state === 'on'
              ? `<button class="btn lg confirm" data-act="switch" data-v="turn_off" data-id="${d.sw.entity_id}" data-confirm="Tap again to turn off"><span class="lbl">Turn off</span></button>`
              : `<button class="btn lg" data-act="switch" data-v="turn_on" data-id="${d.sw.entity_id}">Turn on</button>`}</div></div>` : ''}
          </div>`;
      }
      case 'weather': {
        const x = this._wx(), sun = this._s('sun.sun');
        if (!x) return '<div class="empty">Weather entity not found.</div>';
        const hours = this._fc.hourly.slice(0, 8).map(h => {
          const t = new Date(h.datetime), icon = this._hourIcon(h);
          return `<div class="hour"><small>${t.toLocaleTimeString([], { hour: 'numeric' })}</small>${hIco(icon, icon === 'sun' ? 'sunny' : '')}<span class="num">${Math.round(h.temperature)}°</span></div>`;
        }).join('');
        const days = this._fc.daily.slice(0, 7).map(h => {
          const t = new Date(h.datetime), [label, icon] = WX[h.condition] || [h.condition, 'cloud'];
          return `<div class="hour"><small>${t.toLocaleDateString([], { weekday: 'short' })}</small>${hIco(icon, icon === 'sun' ? 'sunny' : '')}<span class="num">${Math.round(h.temperature)}°</span><small>${h.templow != null ? Math.round(h.templow) + '°' : hEsc(label)}</small>${fmtRain(h.precipitation, x.pu) ? `<small class="wx-rain">${hEsc(fmtRain(h.precipitation, x.pu))}</small>` : ''}</div>`;
        }).join('');
        return `<div class="cols">
            <div class="panel"><h3>Now</h3><div class="xl num">${x.temp}<span class="u">${hEsc(x.unit)}</span></div>
              <p>${hEsc(x.label)}${x.feels != null && x.feels !== x.temp ? ` · feels like ${x.feels}°` : ''}${x.hint ? ` · ${hEsc(x.hint.toLowerCase())}` : ''}</p>
              <div class="wx-grid wide">
                <div class="wx-stat"><span>Humidity</span><b class="num">${x.humidity ?? '—'}%</b></div>
                <div class="wx-stat"><span>Dew point</span><b class="num">${x.dew != null ? Math.round(x.dew) + '°' : '—'}</b></div>
                <div class="wx-stat"><span>Wind</span><b class="num">${x.wind ?? '—'}</b><i>${hEsc(x.windUnit)} ${hEsc(x.dir)}</i></div>
                <div class="wx-stat"><span>Pressure</span><b class="num">${x.a.pressure ?? '—'}</b><i>${hEsc(x.a.pressure_unit || '')}</i></div>
                <div class="wx-stat"><span>UV now</span><b class="num">${x.a.uv_index != null ? Math.round(x.a.uv_index) : '—'}</b><i>peak ${x.uvMax ?? '—'}</i></div>
                <div class="wx-stat"><span>Clouds</span><b class="num">${x.a.cloud_coverage != null ? Math.round(x.a.cloud_coverage) + '%' : '—'}</b></div>
              </div></div>
            <div class="panel"><h3>Daylight</h3>${sun ? `<div class="suns" style="font-size:16px"><div class="rise">${hIco('sunrise')}<span>${this._tf(new Date(sun.attributes.next_rising))}</span></div><div class="set">${hIco('sunset')}<span>${this._tf(new Date(sun.attributes.next_setting))}</span></div></div>` : ''}
              <p>${this._prefs.theme === 'auto' ? 'The panel turns light at sunrise and dark at sunset.' : 'Automatic theme switching is off. Change it from the theme button.'}</p></div>
          </div>
          ${hours ? `<div class="panel"><h3>Next 8 hours</h3><div class="hours">${hours}</div></div>` : ''}
          ${days ? `<div class="panel"><h3>This week</h3><div class="hours" style="grid-template-columns:repeat(7,minmax(72px,1fr))">${days}</div></div>` : ''}`;
      }
      case 'agenda': {
        const up = this._upcoming();
        if (!up.length) return '<div class="empty">Nothing on your calendars this week.</div>';
        let lastDay = '';
        return `<div class="rows">${up.slice(0, 30).map(e => {
          const day = e.start <= new Date() ? 'Today' : e.start.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
          const label = day === new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) ? 'Today' : day;
          const head = label !== lastDay ? `<div class="day-label">${hEsc(label)}</div>` : '';
          lastDay = label;
          return `${head}<div class="row" style="--c:var(--home)">${hIco('calendar')}<div class="what"><b>${hEsc(e.title)}</b><span>${hEsc([e.cal, e.where].filter(Boolean).join(' · '))}</span></div><span class="num" style="font-size:18px">${e.allDay ? 'All day' : this._tf(e.start)}</span></div>`;
        }).join('')}</div>`;
      }
      case 'scenes': {
        const quick = (this._cfg.scenes || []).filter(s => this._s(s.entity));
        const byArea = {};
        const areas = this._hass.areas || {}, reg = this._hass.entities || {};
        Object.keys(this._hass.states).filter(id => id.startsWith('scene.')).forEach(id => {
          const area = reg[id]?.area_id || (reg[id]?.device_id && this._hass.devices?.[reg[id].device_id]?.area_id);
          if (!area) return;
          (byArea[area] = byArea[area] || []).push(id);
        });
        return `<div class="panel"><h3>Favourites</h3><div class="seg">${quick.map(s => this._sceneChip(s, 'btn lg')).join('')}</div></div>
          ${Object.entries(byArea).sort().map(([area, ids]) => `<div class="panel"><h3>${hEsc(areas[area]?.name || area)}</h3><div class="seg">${ids.map(id => this._sceneChip({ entity: id, name: this._name(id).replace(new RegExp('^' + (areas[area]?.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i'), '') }, 'btn lg')).join('')}</div></div>`).join('')}`;
      }
      case 'alerts': {
        const al = this._alerts();
        if (!al.length) return '<div class="panel"><h3>All clear</h3><p>Nothing needs you right now.</p></div>';
        return al.map(a => `<div class="alert-block ${a.lvl === 'red' ? 'red' : ''}">${hIco(a.icon)}<div class="what"><b>${hEsc(a.title)}</b><span>${hEsc(a.detail)}</span></div><div class="acts">
          ${a.open ? `<button class="btn lg" data-act="open" data-v="${a.open}">Show camera</button>` : ''}
          ${a.snooze ? `<button class="btn lg" data-act="snooze" data-v="${a.id}">Hide for a day</button>` : ''}</div></div>`).join('');
      }
      case 'climate': {
        const k = this._climate();
        return `<div class="cols">
          <div class="panel"><h3>Room</h3>
            ${k.temp != null ? `<div class="xl num">${Math.round(k.temp)}<span class="u">${hEsc(k.tu)}</span></div>` : ''}
            ${k.hum != null ? `<div class="${k.temp != null ? 'np-title num' : 'xl num'}">${Math.round(k.hum)}<span class="u">% humidity</span></div>` : ''}</div>
          <div class="panel"><h3>Floor fan</h3><div class="controls">${this._fanBtns(k.fan, 'btn lg round')}</div>
            <p>The fan is controlled with scenes, so the panel can’t show whether it’s on.</p></div></div>`;
      }
      case 'settings':
        return `<div class="panel"><h3>Theme</h3>
          ${seg('theme', [['auto', 'Sunrise &amp; sunset'], ['light', 'Light'], ['dark', 'Dark'], ['ha', 'Match Home Assistant']], this._prefs.theme, 'var(--home)')}
          <p>Sunrise and sunset come from your Home Assistant location. Motion follows this tablet’s reduced-motion setting. The choice is saved on this device, for this dashboard only.</p></div>
          <div class="panel"><h3>Color palette</h3>
          ${this._paletteGrid()}
          <p>A palette recolors the panel. Light and dark above still decide which version of it shows. Saved on this device, for this dashboard only.</p></div>
          <div class="panel"><h3>Home Assistant top bar</h3>
          ${seg('header', [['show', 'Show'], ['hide', 'Hide']], this._prefs.header, 'var(--home)')}
          <p>Hiding it gives the panel the whole screen. Open this sheet again from the theme button to bring it back. Saved on this device, for this dashboard only.</p></div>
          <p class="empty">Hearth Panel ${HEARTH_VERSION}</p>`;
    }
    return '';
  }
  _renderSheet(type) {
    const body = this.$('#sheetBody'), scroll = body.scrollTop;
    const titles = { lights: 'Lights', media: 'Speakers', door: 'Front door', weather: 'Weather', agenda: 'This week', scenes: 'Scenes', vinyl: 'Turntable', tv: 'Apple TV', alerts: 'Needs attention', settings: 'Display', climate: 'Room' };
    this.$('#sheetTitle').textContent = type === 'lights' && this._room && this._s(this._room) ? this._roomName() : titles[type] || '';
    body.innerHTML = this._sheetHTML(type);
    body.scrollTop = scroll;
    this._lastSheetSig = this._sheetSig(type);
    if (type === 'door') this._mountStream();
  }
  _mountStream() {
    const cam = this._s(this._cfg.camera), box = this.$('#bigSnap');
    if (!cam || !box || !customElements.get('ha-camera-stream')) return;
    const el = document.createElement('ha-camera-stream');
    el.hass = this._hass; el.stateObj = cam; el.muted = true; el.controls = false; el.allowExoPlayer = true;
    box.appendChild(el);
  }
  _openSheet(type) {
    this._disarm();
    if (!this._current) this._lastFocus = this._root.activeElement;
    this._current = type;
    if (type === 'agenda') this._loadEvents(7);
    if (type === 'door') this._snapTick = Date.now();
    const sh = this.$('#sheet'), sc = this.$('#scrim');
    this.$('#sheetBody').scrollTop = 0;
    this._renderSheet(type);
    sh.hidden = false; sc.hidden = false; sh.style.transform = '';
    requestAnimationFrame(() => requestAnimationFrame(() => { sh.classList.add('open'); sc.classList.add('open'); }));
  }
  _closeSheet() {
    if (!this._current) return;
    this._disarm();
    this._current = null; this._room = null;
    const sh = this.$('#sheet'), sc = this.$('#scrim');
    sh.classList.remove('open'); sc.classList.remove('open'); sh.style.transform = '';
    const done = () => { if (!this._current) { sh.hidden = true; sc.hidden = true; this.$('#sheetBody').innerHTML = ''; } };
    matchMedia('(prefers-reduced-motion: reduce)').matches ? done() : setTimeout(done, 320);
    if (this._lastFocus?.isConnected) this._lastFocus.focus({ preventScroll: true });
  }
  /* ---------- long press on a room tile opens that room's detail ---------- */
  _tileOf(e) { return e.composedPath().find(n => n.classList?.contains('tile') && n.dataset?.act === 'light-toggle'); }
  _pressStart(e) {
    this._longPressed = false; this._pressEnd();
    const tile = this._tileOf(e);
    if (!tile || e.button > 0) return;
    this._press = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
      this._press = null; this._longPressed = true;
      navigator.vibrate?.(15);
      this._room = tile.dataset.id; this._roomOpen = new Set();
      this._openSheet('lights');
    }, 500) };
  }
  _pressEnd() { if (this._press) { clearTimeout(this._press.t); this._press = null; } }
  _initSwipe() {
    const head = this.$('#sheetHead'), sh = this.$('#sheet');
    let y0 = null, dy = 0;
    head.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; sh.style.transition = 'none'; head.setPointerCapture(e.pointerId); });
    head.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 == null) return; y0 = null; sh.style.transition = ''; if (dy > 110) this._closeSheet(); else sh.style.transform = ''; };
    head.addEventListener('pointerup', end); head.addEventListener('pointercancel', end);
  }

  /* ---------- second tap ---------- */
  _arm(btn) {
    this._disarm();
    const lbl = btn.querySelector('.lbl');
    this._armed = { btn, label: lbl.innerHTML, t: setTimeout(() => this._disarm(), 3500) };   // innerHTML keeps icon labels intact
    btn.classList.add('armed'); lbl.textContent = btn.dataset.confirm;
  }
  _disarm() {
    const a = this._armed; if (!a) return;
    clearTimeout(a.t);
    if (a.btn.isConnected) { a.btn.classList.remove('armed'); a.btn.querySelector('.lbl').innerHTML = a.label; }
    this._armed = null;
    this._queue();
  }
  _toast(msg) {
    const t = this.$('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(this._toastT); this._toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- input ---------- */
  _onClick(e) {
    if (this._longPressed) { this._longPressed = false; e.stopPropagation(); return; }   // the release after a long press is not a tap
    const path = e.composedPath();
    const btn = path.find(n => n.dataset?.act);
    if (btn) {
      e.stopPropagation();
      if (btn.disabled) return;
      if (btn.classList.contains('confirm') && this._armed?.btn !== btn) { this._arm(btn); return; }
      this._disarm();
      this._act(btn.dataset.act, btn);
      return;
    }
    if (this._armed) this._disarm();
    const card = path.find(n => n.dataset?.open);
    if (card) this._openSheet(card.dataset.open);
    else if (path[0]?.id === 'scrim') this._closeSheet();
  }
  _act(act, b) {
    const id = b.dataset.id, v = b.dataset.v;
    switch (act) {
      case 'close': return this._closeSheet();
      case 'settings': return this._openSheet('settings');
      case 'open-alerts': return this._openSheet('alerts');
      case 'open': return this._openSheet(v);
      case 'light-toggle': return this._call('light', 'toggle', {}, { entity_id: id });
      case 'all-off': {
        const ids = (this._cfg.rooms || []).map(r => r.entity).filter(x => this._s(x)?.state === 'on');
        if (ids.length) this._call('light', 'turn_off', {}, { entity_id: ids });
        return this._toast('Turning all lights off');
      }
      case 'scene': {
        const [domain] = id.split('.');
        this._call(domain, 'turn_on', {}, { entity_id: id });
        return this._toast(`${this._name(id)} is on`);
      }
      case 'media': return this._call('media_player', v, {}, { entity_id: id });
      case 'tv-media': return this._call('media_player', v, {}, { entity_id: this._cfg.tv?.player });
      case 'tv-power': this._call('media_player', v, {}, { entity_id: this._cfg.tv?.player }); return this._toast(v === 'turn_on' ? 'Waking the Apple TV' : 'Apple TV off');
      case 'tv-cmd': return this._call('remote', 'send_command', { command: v }, { entity_id: this._cfg.tv?.remote });
      case 'tv-app': this._call('media_player', 'select_source', { source: v }, { entity_id: this._cfg.tv?.player }); return this._toast(`Opening ${v.split(':')[0]}`);
      case 'pin': this._pinned = id; this._toast(`${this._name(id)} is on the card while it plays`); this._queue(); return this._renderSheet('media');
      case 'hide-player': this._hidden = [...new Set([...this._hidden, id])]; hStore.set('media_hidden', this._hidden); if (this._pinned === id) this._pinned = null; this._toast(`${this._name(id)} hidden from the card`); this._queue(); return this._renderSheet('media');
      case 'unhide-player': this._hidden = this._hidden.filter(x => x !== id); hStore.set('media_hidden', this._hidden); this._toast(`${this._name(id)} can show on the card again`); this._queue(); return this._renderSheet('media');
      case 'switch': this._call('switch', v, {}, { entity_id: id }); return this._toast(v === 'turn_on' ? 'Motion alerts on' : 'Motion alerts off');
      case 'snooze': this._snooze[v] = Date.now() + 864e5; hStore.set('snooze', this._snooze); this._toast('Hidden until tomorrow'); return this._queue();
      case 'room': this._room = id; this._roomOpen = new Set(); this._renderSheet('lights'); this.$('#sheetBody').scrollTop = 0; return;
      case 'room-back': this._room = null; this._renderSheet('lights'); this.$('#sheetBody').scrollTop = 0; return;
      case 'member-color': this._roomOpen.has(id) ? this._roomOpen.delete(id) : this._roomOpen.add(id); return this._renderSheet('lights');
      case 'light-color': return this._call('light', 'turn_on', JSON.parse(v), { entity_id: id });
      case 'alexa': {
        const al = this._cfg.alexa, x = (al?.actions || [])[+v];
        if (!x) return;
        this._call('alexa_devices', 'send_text_command', { device_id: al.device_id, text_command: x.command });
        return this._toast(`Asked Alexa: ${x.name}`);
      }
      case 'fan': this._call('scene', 'turn_on', {}, { entity_id: id }); return this._toast(v || 'Fan');
      case 'theme': this._prefs.theme = v; hStore.set(this._key('theme'), v); return this._queue();
      case 'palette': this._prefs.palette = v; hStore.set(this._key('palette'), v); this._applyTheme(); return this._queue();
      case 'header': this._prefs.header = v; hStore.set(this._key('header'), v); this._applyChrome(); return this._queue();
    }
  }
  _onChange(e) {
    const el = e.composedPath()[0];
    if (el?.dataset?.bri) this._call('light', 'turn_on', { brightness_pct: +el.value }, { entity_id: el.dataset.bri });
    if (el?.dataset?.hue || el?.dataset?.sat) {
      const box = el.closest('.sw-area'), id = el.dataset.hue || el.dataset.sat;
      this._call('light', 'turn_on', { hs_color: [+box.querySelector('[data-hue]').value, +box.querySelector('[data-sat]').value] }, { entity_id: id });
    }
    if (el?.dataset?.kelvin) this._call('light', 'turn_on', { color_temp_kelvin: +el.value }, { entity_id: el.dataset.kelvin });
    if (el?.dataset?.vol) this._call('media_player', 'volume_set', { volume_level: +el.value / 100 }, { entity_id: el.dataset.vol });
    setTimeout(() => { this._drag = false; }, 900);
  }
}

let hearthLock = null;
function wakeLock() {
  if (hearthLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  navigator.wakeLock.request('screen').then(l => { hearthLock = l; l.addEventListener('release', () => { hearthLock = null; }); }).catch(() => {});
}
document.addEventListener('visibilitychange', wakeLock);

if (!customElements.get('hearth-panel')) {
  customElements.define('hearth-panel', HearthPanel);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'hearth-panel', name: 'Hearth Panel', description: 'Full-screen wall tablet dashboard' });
  console.info(`%c HEARTH PANEL %c ${HEARTH_VERSION} `, 'background:#38bdf8;color:#080b11;font-weight:700', 'background:#121824;color:#e8edf5');
}

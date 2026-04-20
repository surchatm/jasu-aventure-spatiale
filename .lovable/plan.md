
## Plan: Pokédex screen from start menu

Add a "Pokédex" button next to "Commencer" with a book icon that opens a modal showing all Pokémon in the roster, grouped by rarity, with caught ones highlighted and uncaught ones shown as silhouettes.

### 1. Track caught Pokémon across runs (localStorage)
- In `src/lib/pokemon.ts`, add helpers:
  - `loadCaughtIds(): Set<string>` — reads `localStorage["caughtPokemonIds"]`.
  - `saveCaughtIds(ids: Iterable<string>)` — persists merged set.
- In `SpaceGame.tsx`, when a Pokémon is caught (existing `handleHit` pokeball branch), also call `saveCaughtIds` to persist the new id alongside previously caught ones. This makes the Pokédex meaningful across sessions.

### 2. Create `src/components/game/Pokedex.tsx`
- Dialog (shadcn `dialog.tsx`) containing a scrollable grid.
- Header: total caught count `X / Y`.
- Three sections (Common, Rare, Legendary), each a responsive grid of cards:
  - Caught: full-color image, name, points, rarity color border.
  - Not caught: same card with image at `filter: brightness(0)` (silhouette) and name shown as `???`, points hidden.
- Legendary cards get the rainbow glow border / `animate-glow-pulse`.
- Props: `caughtIds: Set<string>`, `open`, `onOpenChange`.

### 3. Wire the button into the start overlay (`SpaceGame.tsx`)
- Add `useState` for `pokedexOpen` and `caughtIdsAll` (loaded from `loadCaughtIds()` on mount; refreshed when dialog opens).
- In the start overlay (lines 682–689), wrap the existing "▶ Commencer" button and a new secondary "📖 Pokédex" button (using lucide `BookOpen` icon) in a `flex flex-wrap justify-center gap-2` container.
- Render `<Pokedex open={pokedexOpen} onOpenChange={setPokedexOpen} caughtIds={caughtIdsAll} />` at the overlay level.

### Files touched
- `src/lib/pokemon.ts` — add load/save helpers.
- `src/components/game/Pokedex.tsx` — new component.
- `src/components/game/SpaceGame.tsx` — add button, dialog state, persist caught ids on capture.

### Diagram
```text
[Start overlay]
  🚀 Prêt, astronaute ?
  ...rules...
  [ ▶ Commencer ]  [ 📖 Pokédex ]
  [ Leaderboard ]
            │ click
            ▼
  ┌─ Pokédex Dialog ──────────────┐
  │ Caught 7 / 22                 │
  │ Common  [img][img][???][???]  │
  │ Rare    [img][???][???]...    │
  │ Legend. [???][???][???][???]  │
  └───────────────────────────────┘
```

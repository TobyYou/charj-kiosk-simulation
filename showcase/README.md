# AI Showcase (Dec 11, 2026) materials

- **White paper:** https://claude.ai/artifact/AYXY3RuCVQwjKtbWsNwfbR. It has the showcase descriptions, a 5-minute demo script, a guided tour of each simulator tab, the data and its sources, the statistical engine, validation and limits, the learning loop, how AI built this, and a Q&A cheat sheet.
- **Demo numbers:** run `node showcase/demo_numbers.mjs` the morning of the showcase. The daily research refines the inputs, so the figures move a little.
- **Run the simulator:** `python3 -m http.server 8765` from the project root, then open http://localhost:8765/simulator/.

Figures as of 2026-11-13 (120 simulated weeks each):

| Setup | Profit / week |
|---|---|
| 2 live kiosks (Hunan + Lerner) | ≈ $329 |
| Same, but Lerner moved to Manhattanville | ≈ $164 (half) |
| Core 6 | ≈ $361 |
| All 13 | ≈ $505 |
| Core 6 + Broadway & 97th | +$136 (B wins 97%) |
| Core 6, double the awareness | ≈ $760 |
| Core 6, double the packs (16 slots, 12 packs) | ≈ $363 |

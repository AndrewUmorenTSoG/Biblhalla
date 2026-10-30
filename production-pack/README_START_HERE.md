# Covenant Clash — fully offline production pack

**Kendrew Games.** Start by pasting [00_MASTER_PROMPT.md](00_MASTER_PROMPT.md) into your coding AI. This updated pack replaces the former online scope with a fully offline product and an **84-level story campaign** from Genesis to Jesus’ death and resurrection. It is a detailed design/prompt pack, not the completed game.

## What is included

- Twelve fighters with individual move/animation briefs and concept sheets.
- Eight weapon families plus unarmed; 147 original attack records, physics and combat rules.
- Six original arena concepts and authored stage definitions.
- Eighty-four detailed level prompts in fourteen chapters; **16 group-wave levels, 11 single-boss levels and 57 other story/task levels**.
- Story master, continuous Dru/Ken arc, enemies/bosses, cutscene/finale direction, campaign art briefs, source/chronology notes, local saves and offline distribution.
- Individual screen prompts with input selection, simple buttons, difficulty, story chapter flow and accessibility.

## Use the files in this order

1. [Master prompt](00_MASTER_PROMPT.md) and [product brief](01_Product/01_Product_Bible_and_Reference.md).
2. [Offline runtime](03_Offline/08_Offline_Runtime_Packaging_and_Save_Recovery.md), architecture and canonical `09_Data` mechanics.
3. [Campaign master](11_Story_Campaign/00_CAMPAIGN_MASTER_PROMPT.md), [84-level index](11_Story_Campaign/06_LEVEL_INDEX_AND_CHAPTER_ORDER.md), then one level prompt at a time.
4. UI, fighters/weapons/maps, art integration and engineering/QA prompts.

Computer choices are **Easy, Hard and Extremely Hard**. All required installed assets, narration, Bible context, bots and saves are local. No account, connection, remote ranking, ads or streaming. iPad strict offline distribution needs a signed bundled app; a PC HTML file in Files/Quick Look is not automatically an iPad app.

## Separate playable prototype

The separate `Covenant_Clash_Offline_Prototype.zip` contains actual solo computer combat with David/Samson, three arenas and Duel/Waves/Boss. Extract and open **PLAY.html** on PC. It asks Keyboard/Touch/Controller and difficulty. That slice has simplified mechanics and six key poses per fighter; it does not implement all 84 story levels, all 12 fighters, production animation or local multiplayer. Its README and verification report state actual checks and device limits.

## Art and source accuracy

Use [ART_GALLERY.html](ART_GALLERY.html) to view the 18 supplied concept PNGs without internet. These images are art references, not complete runtime clips/layered campaign scenes. New campaign assets are generation briefs. The story uses fictional Dru/Ken archive exercises alongside fixed source-based biblical accounts; miracles are not player power-ups. Jesus is never a combatant and the finale is noncombat. The campaign covers the main narrative arc to resurrection, not every verse or later New Testament book.

## Verification

Run `python3 07_Engineering/Tools/validate_pack.py` to check content IDs, timings, references, assets, Markdown links, offline rules and campaign continuity. [PACK_VALIDATION_REPORT.md](PACK_VALIDATION_REPORT.md) records the completed pack check. This is content validation, not certification of the unbuilt full game. [FILE_INDEX.md](FILE_INDEX.md) lists every file.

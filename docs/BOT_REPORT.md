# Bot harness report

Seeded bot-vs-bot local matches, 200 per difficulty and arena (`node tools/bot-harness.ts --matches 200`). Self-KO: a ring-out with no hit taken in the previous 3 seconds. Recovery: offstage journeys that ended standing on stage. Repeated move: an attack identical to the same fighter's previous attack. Legality: any resource (jumps, recovery, wall fatigue) outside its bounds.

| Difficulty | Arena | Matches | Avg s | KOs | Self-KO % | Recovery % | Repeated move % | Legality violations | Timeouts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| easy | elah_training_terrace | 200 | 292.1 | 631 | 4.6 | 94.4 | 21.5 | 0 | 164 |
| easy | wilderness_waystation | 200 | 293.6 | 593 | 3.9 | 94.5 | 22.5 | 0 | 175 |
| easy | jericho_outskirts | 200 | 298.7 | 479 | 2.9 | 94.5 | 22.8 | 0 | 193 |
| easy | deborahs_palm_court | 200 | 292.4 | 599 | 3.3 | 95.1 | 23.0 | 0 | 166 |
| easy | susa_garden_balcony | 200 | 293.6 | 591 | 3.6 | 93.9 | 21.6 | 0 | 175 |
| easy | jerusalem_builders_court | 200 | 293.9 | 533 | 3.0 | 94.3 | 22.9 | 0 | 180 |
| hard | elah_training_terrace | 200 | 281.6 | 760 | 7.5 | 93.1 | 22.5 | 0 | 120 |
| hard | wilderness_waystation | 200 | 280.8 | 775 | 6.3 | 93.2 | 23.3 | 0 | 119 |
| hard | jericho_outskirts | 200 | 290.9 | 636 | 8.6 | 93.1 | 23.4 | 0 | 170 |
| hard | deborahs_palm_court | 200 | 277.4 | 760 | 5.8 | 93.6 | 23.8 | 0 | 118 |
| hard | susa_garden_balcony | 200 | 289.6 | 702 | 7.5 | 93.6 | 22.8 | 0 | 150 |
| hard | jerusalem_builders_court | 200 | 283.5 | 737 | 8.0 | 93.5 | 23.4 | 0 | 137 |
| extreme | elah_training_terrace | 200 | 253.7 | 844 | 9.8 | 92.3 | 23.6 | 0 | 63 |
| extreme | wilderness_waystation | 200 | 249.1 | 887 | 8.5 | 92.0 | 24.6 | 0 | 39 |
| extreme | jericho_outskirts | 200 | 272.7 | 790 | 12.2 | 91.8 | 24.9 | 0 | 105 |
| extreme | deborahs_palm_court | 200 | 247.7 | 890 | 8.2 | 92.4 | 25.5 | 0 | 43 |
| extreme | susa_garden_balcony | 200 | 259.7 | 831 | 11.0 | 92.0 | 23.9 | 0 | 74 |
| extreme | jerusalem_builders_court | 200 | 259.6 | 891 | 7.0 | 92.3 | 25.1 | 0 | 51 |

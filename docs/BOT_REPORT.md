# Bot harness report

Seeded bot-vs-bot local matches, 20 per difficulty and arena (`node tools/bot-harness.ts --matches 20`). Self-KO: a ring-out with no hit taken in the previous 3 seconds. Recovery: offstage journeys that ended standing on stage. Repeated move: an attack identical to the same fighter's previous attack. Legality: any resource (jumps, recovery, wall fatigue) outside its bounds.

| Difficulty | Arena | Matches | Avg s | KOs | Self-KO % | Recovery % | Repeated move % | Legality violations | Timeouts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| easy | elah_training_terrace | 20 | 176.5 | 85 | 11.8 | 87.3 | 17.9 | 0 | 1 |
| easy | wilderness_waystation | 20 | 228.1 | 93 | 7.5 | 89.6 | 19.7 | 0 | 3 |
| easy | jericho_outskirts | 20 | 238.6 | 81 | 9.9 | 84.3 | 18.8 | 0 | 6 |
| easy | deborahs_palm_court | 20 | 231.8 | 88 | 4.5 | 92.0 | 18.8 | 0 | 3 |
| easy | susa_garden_balcony | 20 | 219.9 | 90 | 8.9 | 85.0 | 17.9 | 0 | 1 |
| easy | jerusalem_builders_court | 20 | 222.7 | 88 | 9.1 | 87.8 | 19.8 | 0 | 3 |
| hard | elah_training_terrace | 20 | 166.6 | 92 | 13.0 | 84.8 | 17.1 | 0 | 0 |
| hard | wilderness_waystation | 20 | 165.3 | 93 | 7.5 | 86.2 | 17.8 | 0 | 0 |
| hard | jericho_outskirts | 20 | 199.5 | 88 | 11.4 | 86.5 | 17.7 | 0 | 0 |
| hard | deborahs_palm_court | 20 | 167.9 | 94 | 10.6 | 86.2 | 18.0 | 0 | 0 |
| hard | susa_garden_balcony | 20 | 199.4 | 96 | 12.5 | 84.9 | 16.5 | 0 | 0 |
| hard | jerusalem_builders_court | 20 | 188.5 | 93 | 16.1 | 86.8 | 17.9 | 0 | 0 |
| extreme | elah_training_terrace | 20 | 163.8 | 87 | 12.6 | 86.5 | 18.9 | 0 | 0 |
| extreme | wilderness_waystation | 20 | 133.6 | 88 | 12.5 | 83.4 | 18.4 | 0 | 0 |
| extreme | jericho_outskirts | 20 | 168.8 | 91 | 16.5 | 83.8 | 18.9 | 0 | 0 |
| extreme | deborahs_palm_court | 20 | 150.6 | 86 | 9.3 | 85.4 | 18.5 | 0 | 0 |
| extreme | susa_garden_balcony | 20 | 154.3 | 91 | 22.0 | 84.5 | 17.3 | 0 | 0 |
| extreme | jerusalem_builders_court | 20 | 154.7 | 86 | 10.5 | 87.1 | 19.4 | 0 | 0 |

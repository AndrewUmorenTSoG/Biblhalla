# Story progression and local save prompt

Unlock levels sequentially from L001 to L084. Completed chapters open replay; Context remains available for seen scenes. Optional medals measure completion, objective coverage and difficulty, never righteousness. The story endpoint is available on Easy. All arena fighters are available for Quick battle without a grind; story mentor appearances unlock journal/visual material, not paid combat advantages.

Store profile locally with schemaVersion, contentVersion, lastSafeCheckpoint, completedLevelIds, seenCardIds, companionSettings, accessibilitySettings and localMedals. Validate IDs against bundled campaign data. Snapshot previous valid save; write new bytes atomically in native builds or a staged transaction in browser storage. If the new record fails checksum or migration, offer the last valid copy and explain the recovery. Never delete a save because an optional context card changes.

Pause saves only safe checkpoint progress, not an arbitrary active boss pose. Quitting restarts the current section, stated before confirmation. Export/import uses a user-selected local file; reject invalid sizes, IDs and schema. No account, email, cloud sync, paid unlock check or remote authentication. Provide clear Delete local progress only behind Settings with confirmation and export first.

Chapter select exposes Continue, chapter cards and one More options button for replay difficulty, journal filters and completion details. The top-level Play choice is Story / Quick battle / Local. A first-time launch asks Keyboard / Touch / detected Controller, then offers Story or Quick battle. Keep the current objective and pause visible during gameplay; simplify quiet scenes to Interact and Continue.

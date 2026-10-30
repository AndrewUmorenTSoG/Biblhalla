# Arena selection — standalone screen prompt

Implement working responsive semantic UI using the offline master and UI tokens. Show six arena cards with thumbnail/name/check mark and Confirm. Put collision/performance notes in developer Details, not the player flow. No remote download when choosing an arena. Story maps follow separate level routes; do not label arena concepts complete campaign stages.

Use one primary action, explicit labels, visible keyboard/controller focus, minimum 48-pixel targets and no color-only state. The main task stays visible; optional detail opens from a labeled button. Dialogs have titles, trap focus and restore the opener. Back preserves choices; gameplay input cannot leak into menu typing. Detect loading, disabled, error and ready as separate states.

Use locally installed fonts/assets. Test keyboard-only navigation, touch/landscape/safe-area layout, controller focus, valid and invalid state transitions, disabled storage and returning from gameplay. All transitions work in airplane mode. Show implemented state honestly; do not create decorative buttons that pretend missing gameplay is available.

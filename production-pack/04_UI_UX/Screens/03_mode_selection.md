# Play modes — standalone screen prompt

Implement working responsive semantic UI using the offline master and UI tokens. Three main choices: Story, Quick battle and Local. Story opens the 84-level chapter map; Quick battle opens computer setup; Local opens same-device assigned slots. Learn links to tutorial/training. Back preserves input.

Use one primary action, explicit labels, visible keyboard/controller focus, minimum 48-pixel targets and no color-only state. The main task stays visible; optional detail opens from a labeled button. Dialogs have titles, trap focus and restore the opener. Back preserves choices; gameplay input cannot leak into menu typing. Detect loading, disabled, error and ready as separate states.

Use locally installed fonts/assets. Test keyboard-only navigation, touch/landscape/safe-area layout, controller focus, valid and invalid state transitions, disabled storage and returning from gameplay. All transitions work in airplane mode. Show implemented state honestly; do not create decorative buttons that pretend missing gameplay is available.

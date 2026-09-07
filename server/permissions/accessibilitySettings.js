import AccessibilitySettings from '/models/accessibilitySettings';

AccessibilitySettings.allow({
  update() {
    return false;
  },
});

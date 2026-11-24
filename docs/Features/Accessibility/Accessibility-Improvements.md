# Wekan Accessibility & Responsive Design Improvements

## What it is

This is the plan and record of WeKan's accessibility and responsive design
work: how WeKan adapts to phones, tablets, laptops, large displays and TVs, with
touch targets large enough for a finger, keyboard navigation and screen-reader
support. Parts of it have been changed since; the notes say where.

## Read more

- [Responsive web design](https://en.wikipedia.org/wiki/Responsive_web_design)
  and [Web accessibility](https://en.wikipedia.org/wiki/Web_accessibility) on
  Wikipedia.
- [WCAG 2.1 target size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html);
  more resources are listed under "Resources" below.
- WeKan pages: [Accessibility](README.md), [Audit](Audit.md),
  [Touch screen support](../DragDrop/Touch-Screen-support.md).

## How to use it

Nothing to switch on: WeKan picks the layout from the window width. To change
the text size, use Member Settings → **Font**; to make drag handles show, see
[Touch screen support](../DragDrop/Touch-Screen-support.md).

## How the numbers are calculated

- Device ranges: smartphones 320-767px, tablets 768-1023px, laptops
  1024-1919px, desktops 1920-2559px, large displays 2560px and up.
- Touch targets: at least 44px on phones, 48px or more on tablets.
- The base font is 14px (see the note in "Responsive Design Features").

## How it works in WeKan

This document outlines the comprehensive accessibility and responsive design improvements implemented across all devices and screen sizes.

### 🎯 Overview

The improvements ensure Wekan is fully accessible and optimized for:
- **Smartphones** (320px - 767px)
- **Tablets** (768px - 1023px) 
- **Laptops** (1024px - 1919px)
- **Desktops** (1920px - 2559px)
- **Large Displays** (2560px+)
- **Digital Signage & TV** (Ultra-wide and 4K+)

### 📱 Mobile Optimizations

#### Touch Interactions
- **Minimum touch target size**: 44px × 44px (WCAG AA compliant)
- **Touch feedback**: Visual feedback for touch interactions
- **Prevent zoom on input focus**: Font size 16px prevents iOS zoom
- **Touch scrolling**: Smooth `-webkit-overflow-scrolling: touch`

#### Layout Improvements
- **Responsive typography**: `clamp(14px, 4vw, 18px)` scales with viewport
- **Flexible spacing**: `clamp(8px, 2vw, 16px)` for consistent spacing
- **Stacked navigation**: Header elements stack vertically on small screens
- **Full-width modals**: 95vw width for better mobile experience

#### Device-Specific Optimizations
- **iPhone 12 Mini**: 3x font scaling for readability
- **iPhone 12/13**: Optimized touch targets and spacing
- **iPhone Pro Max**: Enhanced layout for larger screens
- **Android phones**: Prevented zoom and improved touch handling

### 📱 Tablet Optimizations

#### Touch-Friendly Design
- **Comfortable touch targets**: 48px × 48px minimum
- **Optimized spacing**: Balanced between mobile and desktop
- **Orientation support**: Different layouts for portrait/landscape

#### Layout Enhancements
- **Flexible grid**: Lists adapt to available space
- **Improved navigation**: Side menu optimized for touch
- **Modal sizing**: 80-90vw width for better tablet experience

#### Device-Specific Support
- **iPad (9th gen)**: 768×1024 optimization
- **iPad Air**: 810×1080 enhancement
- **iPad Pro 11"**: 834×1194 refinement
- **iPad Pro 12.9"**: 1024×1366 optimization
- **Android tablets**: Portrait and landscape modes

### 💻 Desktop & Laptop Optimizations

#### Standard Desktop (1024px - 1919px)
- **Efficient use of space**: Optimal card and list sizing
- **Hover effects**: Enhanced interactivity for mouse users
- **Keyboard navigation**: Full keyboard accessibility
- **Modal sizing**: Standard 500px/800px widths

#### Large Displays (1920px+)
- **Scaled typography**: Larger fonts for better readability
- **Enhanced touch targets**: 56px+ for large displays
- **Centered layout**: Max-width containers prevent excessive stretching
- **Digital signage ready**: Optimized for TV and large displays

#### Ultra-Wide & 4K (2560px+)
- **Massive display support**: Up to 3200px max-width
- **Enhanced typography**: 20-22px base font size
- **Large touch targets**: 64px+ for digital signage
- **Print optimization**: Clean print layouts

### ♿ Accessibility Features

#### Keyboard Navigation
- **Skip links**: Jump to main content and navigation
- **Tab order**: Logical tab sequence throughout the app
- **Arrow key navigation**: Navigate cards and lists with arrow keys
- **Escape key**: Close modals and popovers
- **Enter/Space**: Activate buttons and interactive elements

#### Screen Reader Support
- **ARIA labels**: Descriptive labels for all interactive elements
- **Live regions**: Announce state changes and updates
- **Role attributes**: Proper semantic roles for custom elements
- **Focus management**: Clear focus indicators and restoration

#### Visual Accessibility
- **High contrast mode**: Enhanced borders and colors
- **Focus indicators**: Clear 2px outline for keyboard users
- **Reduced motion**: Respects user motion preferences
- **Color independence**: Information not conveyed by color alone

#### Touch Accessibility
- **Large touch targets**: Minimum 44px for comfortable interaction
- **Touch feedback**: Visual confirmation of touch interactions
- **Gesture support**: Swipe and pinch gestures where appropriate
- **Prevent accidental touches**: Proper touch action handling

### 🎨 Responsive Design Features

> **Changed since.** The fluid typography and flexible spacing below were
> reverted for #6465: on any window wider than 720px the `clamp()` font resolved
> to 18px, +28.5% on every font, input and button compared to the 14px of WeKan
> 6.09. The base font is now 14px with family and size set separately, the size
> moved by Member Settings → Font through a scale variable
> (`client/components/main/layouts.css`, `client/components/main/uiFont.css`);
> mobile readability is handled by the mobile media queries. The two `clamp()`
> rules are kept below as the original design.

#### Fluid Typography
```css
font: clamp(14px, 2.5vw, 18px) Roboto, Poppins, "Helvetica Neue", Arial, Helvetica, sans-serif;
```
- Scales smoothly between device sizes
- Maintains readability across all screens
- Uses system fonts for better performance

#### Flexible Spacing
```css
padding: clamp(8px, 2vw, 16px);
margin: clamp(12px, 1.5vw, 20px);
```
- Consistent spacing that adapts to screen size
- Prevents cramped layouts on small screens
- Maintains proper proportions on large displays

#### Adaptive Layouts
- **Mobile**: Single column, stacked navigation
- **Tablet**: Flexible grid, touch-optimized
- **Desktop**: Multi-column, hover effects
- **Large displays**: Centered, max-width containers

### 🔧 Technical Implementation

#### CSS Architecture
1. **Base styles**: `layouts.css` - Core typography and layout
2. **Responsive design**: `responsive-accessibility.css` - Cross-device compatibility
3. **Device-specific**: `device-specific.css` - Targeted optimizations
4. **Component styles**: Individual component CSS files

#### JavaScript Enhancements
1. **Accessibility**: `accessibility-enhancements.js` - ARIA, keyboard nav, screen readers
2. **Device detection**: Input method detection and device classification
3. **Focus management**: Focus trapping, restoration, and indicators
4. **Touch handling**: Touch feedback and gesture support

#### Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
```
- Prevents horizontal scrolling
- Allows zoom up to 500% (WCAG AAA)
- Maintains usability at all zoom levels

### 📊 Performance Optimizations

#### CSS Optimizations
- **Efficient selectors**: Minimal specificity conflicts
- **Hardware acceleration**: `transform` and `opacity` for animations
- **Reduced repaints**: Optimized layout properties
- **Critical CSS**: Above-the-fold styles prioritized

#### JavaScript Optimizations
- **Event delegation**: Efficient event handling
- **Debounced resize**: Optimized window resize handling
- **Lazy loading**: Dynamic content loading
- **Memory management**: Proper cleanup of event listeners

### 🧪 Testing & Validation

#### Device Testing
- **Mobile**: iPhone 12 Mini, iPhone 13, Samsung Galaxy S21
- **Tablet**: iPad (9th gen), iPad Air, iPad Pro, Samsung Tab S7
- **Laptop**: MacBook Air, Dell XPS, HP Spectre
- **Desktop**: 1920×1080, 2560×1440, 3440×1440 ultrawide
- **Large displays**: 4K monitors, digital signage displays

#### Accessibility Testing
- **Screen readers**: NVDA, JAWS, VoiceOver
- **Keyboard navigation**: Tab, arrow keys, Enter, Escape
- **High contrast**: Windows and macOS high contrast modes
- **Zoom testing**: 200%, 300%, 400% zoom levels

#### Browser Support
- **Chrome**: 90+ (mobile and desktop)
- **Firefox**: 88+ (mobile and desktop)
- **Safari**: 14+ (iOS and macOS)
- **Edge**: 90+ (Windows and mobile)

### 🚀 Usage Guidelines

#### For Developers
1. **Use semantic HTML**: Proper heading hierarchy and landmarks
2. **Include ARIA attributes**: Labels, roles, and states
3. **Test keyboard navigation**: Ensure all functionality is keyboard accessible
4. **Validate with screen readers**: Test with actual assistive technology

#### For Designers
1. **Maintain touch targets**: Minimum 44px for mobile, 48px+ for tablets
2. **Use sufficient contrast**: 4.5:1 for normal text, 3:1 for large text
3. **Design for motion sensitivity**: Provide reduced motion alternatives
4. **Test at different sizes**: Verify layouts work across all breakpoints

#### For Content Creators
1. **Use descriptive text**: Clear, concise labels and instructions
2. **Provide alt text**: Meaningful descriptions for images
3. **Structure content**: Use proper heading hierarchy
4. **Test with users**: Validate with actual users with disabilities

### 📈 Future Enhancements

#### Planned Improvements
- **Voice control**: Voice navigation support
- **Eye tracking**: Eye tracking device compatibility
- **Haptic feedback**: Touch device vibration feedback
- **Advanced gestures**: Multi-touch gesture support

#### Monitoring & Analytics
- **Accessibility metrics**: Track accessibility usage patterns
- **Performance monitoring**: Monitor responsive design performance
- **User feedback**: Collect feedback on accessibility features
- **Continuous improvement**: Regular updates based on user needs

### 📚 Resources

#### WCAG Guidelines
- [WCAG 2.1 AA Compliance](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile Accessibility Guidelines](https://www.w3.org/WAI/mobile/)
- [Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

#### Testing Tools
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

#### Documentation
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project](https://www.a11yproject.com/)

---

**Note**: WeKan follows WCAG 2.2 AA; the automated checks are in
`tests/playwright/specs/45-axe-accessibility.e2e.js`. Automated tests cover only
part of WCAG, so this is a floor, not a conformance claim.

## Commits

 - [Back to the WeKan 6.09 desktop density, among other fixes](https://github.com/wekan/wekan/commit/ed19445d307344216565caa6eb597f2d36a88b92)
 - [Accessibility and tab order across WeKan](https://github.com/wekan/wekan/commit/692207bf5ec42ba97fc189beb4135975b6d20f31)
 - [Accessibility improvements](https://github.com/wekan/wekan/commit/67b078b8056ec9851caaf6ef855719de1e6d966d)

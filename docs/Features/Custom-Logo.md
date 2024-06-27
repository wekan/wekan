In Wekan v4.40 and newer:

- Custom Logo for Login and Top Left Corner.
- Optional link when clicking logo.
- Settings at Admin Panel / Settings / Layout.

Added [with this commit](https://github.com/wekan/wekan/commit/a7c3317ed696fad8e211b22afbb3012f3a4f2ddb). As you can see from that commit:
- Height 27 px in Top Left Corner Logo. Width auto = automatic.
- Width 300 px in Login Logo. Height auto = automatic.

Image can be for example jpg/png/gif/svg.

For those sizes, if logo is a little bigger or smaller, it will be zoomed.

## Storing logo images elsewhere

Add image like `https://example.com/logo.png`

## Storing logos in Wekan

1. Create board and change it from private to public (visible to everyone at Internet)
2. Add card
3. Add logo images to card as attachment
4. Right click on top image and copy image link to Admin Panel/Settings/Layout/Logo image URL

# NEXT — v0.9

This release is a large re-write of the previous code base. Despite being
relatively similar to v0.8 feature-wise, this release marks the beginning of our
new user interface and continues to improve the overall performance and
security. It also features the following improvements:

* A new user account system, including the possibility to reset a forgotten
  password, to change the password, or to enable email confirmation (all of
  which were previously impossible);
* Avatar customization, including the possibility to upload images and to choose
  one from Gravatar or the user initials;
* Cards multi-selection to facilitate batch actions such as moving all the cards
  of selection, or attaching a label or a member to them;
* Keyboard navigation, press `?` to read the list of available shortcuts;
* The possibility to restore archived boards, lists, and cards.

Starting from this release we will also distribute official docker images on
both the
[GitHub release page](https://github.com/wekan/wekan/releases)
and on the
[DockerHub](https://hub.docker.com/r/mquandalle/wekan). We also improved
Sandstorm integration with the support of its build-in sharing model.

New languages supported: Chinese, Finnish, Spanish, Korean, and Russian.

Special thanks to GitHub users ePirat, nata-goddanti, ocdtrekkie, and others who
have supportive during this *traversée du desert*, and to neynah for the Wekan
icons.

# v0.8

This release continues the implementation of basic features of a “kanban”
software, especially:

* Basic card attachments. If the attached file is an image we generate and
  display a thumbnail that can be used as a card “cover” (visible in the board
  general view);
* User names mentions and auto-completion in card description and comments
  (though we don’t have any notification system for now, making this feature a
  less useful that it should);
* Filter views, current filtering options are based on labels and assigned
  members;
* Labels creation and suppression at the board level (previously we had a fixed
  list of labels);
* Customization of the board background color.

This release is also the first one to introduce localization of the user
interface.

New languages supported: French, German, Japanese, Portuguese, and Turkish.

# v0.7.1

This release fixes the following bugs:

* Unexpected lost of the card sorting on the server side;
* Fix a bug during board creation;
* Focus the new list form if the board is empty.

# v0.7

This release starts the transition from a toy project to something useful. Along
with some security and performance improvements (for instance, opening a card
used to take a long time because it was re-generated the entire DOM whereas only
the popover was new). New features includes:

* Add and remove labels to cards;
* Assign and unassign members to cards;
* Archive cards (though restoration is not yet possible);
* Board stars;
* Markdown and emojies support in comments and card description;
* Emojies auto-completion in the text editor;
* Some keyboard shortcuts (eg `Ctrl`+`Enter` to submit a multi-line input).

We also introduced basic support for the [Sandstorm](https://sandstorm.io)
platform, and distribute a `spk` (Sandstorm PacKage) for this release and
subsequent.

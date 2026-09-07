import Announcements from '/models/announcements';

Announcements.allow({
  update() {
    return false;
  },
});

Meteor.startup(() => {
  if (process.env.MAX_IMAGE_PIXEL) {
    Meteor.settings.public.MAX_IMAGE_PIXEL = process.env.MAX_IMAGE_PIXEL;
    Meteor.settings.public.IMAGE_COMPRESS_RATIO =
      process.env.IMAGE_COMPRESS_RATIO;
  }
});

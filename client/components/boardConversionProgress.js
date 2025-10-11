import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { boardConverter } from '/imports/lib/boardConverter';

Template.boardConversionProgress.helpers({
  isConverting() {
    return boardConverter.isConverting.get();
  },
  
  conversionProgress() {
    return boardConverter.conversionProgress.get();
  },
  
  conversionStatus() {
    return boardConverter.conversionStatus.get();
  },
  
  conversionEstimatedTime() {
    return boardConverter.conversionEstimatedTime.get();
  }
});

Template.boardConversionProgress.onCreated(function() {
  // Subscribe to conversion state changes
  this.autorun(() => {
    boardConverter.isConverting.get();
    boardConverter.conversionProgress.get();
    boardConverter.conversionStatus.get();
    boardConverter.conversionEstimatedTime.get();
  });
});

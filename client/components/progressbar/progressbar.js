(class ProgressBar extends BlazeComponent {
  template() {
    return 'progressBarTemplate';
  }

  onCreated() {
    super.onCreated();
    this.progress = new ReactiveVar(25);
  }

  progressValue() {
    return this.progress.get();
  }

  //IMPORTANT:
  //pass data context into this helper when using this component
  setProgress(currProgress) {
    if (currProgress <= 100 && currProgress >= 0)
      this.progress.set(currProgress);
    console.log("value: " + this.progress.get());
  }


}).register("progressBar");
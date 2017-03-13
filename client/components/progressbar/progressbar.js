(class ProgressBar extends BlazeComponent {
  template() {
    return 'progressBarTemplate';
  }

  onCreated() {
    super.onCreated();
    this.value = new ReactiveVar(this.data().prog);
  }

  progressValue() {
    return this.value.get();
  }

  progressCSS() {
    return "width:"+ this.value.get() +"%";
  }
}).register("progressBar");
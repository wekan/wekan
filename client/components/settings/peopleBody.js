Meteor.subscribe('people');

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.people = new ReactiveVar(true);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  peopleList() {
    this.users = Users.find({});

    this.users.forEach((user) => {
      console.log(JSON.stringify(user));
    });
    return this.users;
  },
}).register('people');

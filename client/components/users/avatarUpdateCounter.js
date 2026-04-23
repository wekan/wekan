import { ReactiveVar } from 'meteor/reactive-var';

// Reactive source for invalidating people row when avatars change
export const avatarUpdateCounter = new ReactiveVar(0);

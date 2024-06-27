

## 1. What is Monkey Proof Software?

Someone told xet7, that WeKan is Monkey Proof Software. Jira is not Monkey Proof Software. Here we are exploring what it means.

## 2. Proofing

a) Monkey Proof testing of laptop https://www.youtube.com/watch?v=QxCV0bZGE00 . There are also some info at Internet how to make sure monkeys do not mess up apartments, trashcans etc.

b) https://en.wikipedia.org/wiki/Proofing

> Proofing may refer to:
>
> - [Proofing (armour)](https://en.wikipedia.org/wiki/Proofing_(armour)), the testing of armour for its defensive ability
> - [Proofing (baking technique)](https://en.wikipedia.org/wiki/Proofing_(baking_technique)), a rest period during the fermentation of bread dough
> - [Proofing (prepress)](https://en.wikipedia.org/wiki/Prepress_proofing), a concept in print production
> - [Proof testing](https://en.wikipedia.org/wiki/Proof_test), a form of stress test to demonstrate the fitness of a load-bearing structure

c) https://nl.wikipedia.org/wiki/Foolproof mentions "De Engelse termen foolproof, idiot proof, monkey proof"

d) https://en.wikipedia.org/wiki/Idiot-proof 

> In modern [English](https://en.wikipedia.org/wiki/English_language) usage, the informal term idiot-proof or foolproof describes designs that cannot be misused either inherently, or by use of [defensive design](https://en.wikipedia.org/wiki/Defensive_design) principles. The implication is that the design is usable even by someone of low intelligence who would not use it properly.

## 3. Defensive design

Mentioned at https://en.wikipedia.org/wiki/Defensive_design

> Defensive design is the practice of planning for [contingencies](https://en.wikipedia.org/wiki/Contingency_plan) in the [design](https://en.wikipedia.org/wiki/Design) stage of a project or undertaking. Essentially, it is the practice of anticipating all possible ways that an end-user could misuse a device, and designing the device so as to make such misuse impossible, or to minimize the negative consequences. For example, if it is important that a plug is inserted into a socket in a particular orientation, the socket and plug should be designed so that it is physically impossible to insert the plug incorrectly. Power sockets are often keyed in such a manner, to prevent the transposition of live and neutral. They are also recessed in the wall in a way that makes it impossible to touch connectors once they become live.

## 4. Defensive Design in Computer software

> Defensive design in [software engineering](https://en.wikipedia.org/wiki/Software_engineering) is called [defensive programming](https://en.wikipedia.org/wiki/Defensive_programming). [Murphy's law](https://en.wikipedia.org/wiki/Murphy%27s_law) is a well-known statement of the need for defensive design, and also of its ultimate limitations.
>
> [Software design](https://en.wikipedia.org/wiki/Software_design) entails many ways so that software can be designed to operate more safely.
>
> - Data entry screens can "sanitize" inputs, e.g. numeric fields contain only digits, signs and a single decimal point if appropriate.
>
> - Inputs can be sanity checked for legitimate values, e.g. for counts of workplace injuries (or number of people injured) the number can be 0 but can't be negative and must be a whole number; for number of hours worked in one week the amount for any specified employee can be 0, can be fractional, but can't be negative and can't be greater than 168, nor more than 24 times the number of days they were in attendance.
>
> - A word processor requested to load a saved document should scan it to ensure it is in good form and not corrupted. If it is corrupted, the program should say so, then either accept the partial document that was valid, or refuse the entire document. In either case it should remain running and not quit.

## 6. Monkey Testing

https://en.wikipedia.org/wiki/Monkey_testing

## 7. Why Custom CSS/Javascript is not Monkey Proof

@xet7 wrote at https://github.com/wekan/wekan/issues/4167#issuecomment-1151557772 to this comment

> Wekan functions better on pretty much all fronts except for customization options given that one can directly change kanboard CSS to fit their needs.

From @xet7

Custom CSS and Javascript is very dangerous: https://github.com/wekan/wekan/issues/3086#issuecomment-627615017

> I had to previously find a way [how to fix Custom Javascript in RocketChat](https://forums.rocket.chat/t/big-issue-with-custom-javascript/261/4?u=xet7) because it broke my RocketChat install.
>
> Also, previously I had to [fix XSS bug](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v385-2020-03-23-wekan-release) because adding Javascript to input fields did run that Javascript code.
>
> I'll try to find is there a safe way to do this.

Correct solution is to add setting like here https://github.com/wekan/wekan/issues/4558 

WeKan target group is those that call WeKan "Monkey Proof Software", so that WeKan is easy to figure out, user friendly, polished enough. Jira is not "Monkey Proof Software".

If someone is asking for "Custom CSS", that means they are programmers, and should be sending PRs to WeKan with fixes to UI, new settings, etc, so that WeKan works safely without "Custom CSS", for normal non-programmer people.

## 6. Towards more Monkey Proof Software

In Progress:
- Optimizing speed
- Minimize frontend and backend code
- Fixing bugs
If in List titles you like to create numbered text like this:
```
3. Something
```
Write it this way (to escape dot), so it shows correctly:
```
3\. Something
```
This happens because of markdown support for autonumbering in input fields.

For example, if you write numbered list like:
```
1. Something nice
1. Something cool
1. Something great
```
It will be autonumbered like this, so you can cut/paste reorder list freely, without manually reordering numbers:
```
1. Something nice
2. Something cool
3. Something great
```
For example, when you reorder numbered list like this:
```
1. Something great
1. Something nice
1. Something cool
```
It will show automatically numbered like this:
```
1. Something great
2. Something nice
3. Something cool
```


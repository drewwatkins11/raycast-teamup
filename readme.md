This is a Raycast script for checking for open rooms in Raycast. The specific use case I designed this for is checking for open rooms in my coworking space (ie. finding a room open _now_ or in the _next x minutes_), but I am open to extending it for other use cases as needed.

This is the first version (quickly hacked together while frustrated about people not booking call rooms for their ad-hoc calls), but I'm working on updating it to work with Raycast's new API.

This script is currently limited to one calendar. To configure, replace two strings the script before copying to your [Raycast extensions folder](https://github.com/raycast/script-commands):

- **CALENDAR**: This should be the calendar you wish to check for open rooms on.
- **TOKEN**: This is your API token from Teamup.
  _*Both of these are listed twice in the script*_

# authentication

- anonymous users for room participants
- optionally sign in to github to create rooms
- when the user logs in from github, we'll create an entry in the users database

# data model

<!--  -->

- anyone can create a room
- if you create a room

- if you have a link you can join a room

- store recently visited rooms and settings:

  - server side if signed in
  - client side if not

* id
* github_id
* ownedRooms

## room creation

when you create a room,
provide room name
provide gist

if given gist, load gist contents into editors
(make request to github, and load contents into ydoc on the server side)

### ui description

- Click create room button
- open modal
- link input
  - green when valid url? try
- incremental search select through current users's owned gists
- card with selected gist details
- on select, populate url into url input
- display gist details
- if gist not owned, show additional dialogue option asking if user wants to automatically fork the gist

# Styling Notes

## nav bar

- we need to redesign the existing base web navbar to have the following properties
- 30% smaller
- less aggressive hamburger mode breakpoint
- (some percentage of viewheight on desktop)

## save back to gist

if gist already created:

- provide diff with gist for each file
  - save all
  - save one
- send request to save on the client side

# TODOs

## now

- delete room action

## later

- decent styling for presence indicators
- add titles for routes
- add heading to globalheader
- handle non-gist cases
- move modal buttons to right
- presence
- styling pass - global header
- style scrollbar
- move add file button out of tab group
- get list of gists for user at home DONE
- rename files DONE
- new room button DONE
- fork room
- allow removing files - true
- diff viewer
  - re-add monaco DONE
  - check diff mode
- handle tab overflow

## problems to solve later

- form/input validation
- limit client side routes for non-logged in users
- tab switching is slow

## discovery

- 0auth modal
- diff viewer
- transition to frontend-only?

## questions

- what does TypeGraphql.ID do?
- how to unset browser session token
- will the current implementation work with private gists?
- can I provide an interface for commit messages?
- multiple editors? how will that work with y-monaco?

gen-env-types
dokku

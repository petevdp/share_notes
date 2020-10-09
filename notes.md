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

- make theme more compact for desktop
- (some percentage of viewheight on desktop)

## save back to gist

if gist already created:

- provide diff with gist for each file
  - save all
  - save one
- send request to save on the client side

# TODOs

## now

- editor settings DONE
  - choose settings to display DONE
  - implement DONE

## later

- decent styling for presence indicators
  - still need to add border for prescence indicators with avatar
- theming
  - editor
  - more compact
  - nord?
- add titles for routes
- add heading to globalheader
- move modal buttons to right
- style scrollbar
- move add file button out of tab group
- fork room
- allow removing files - true
- diff viewer
- saving
  - add save action persist editor to db on save
  - file clean/dirty edit state/last saved indicator
- flesh out dashboard
  - recently visited rooms
- form/input validation
- limit client side routes for non-logged in users
- authorization
  - client-side routes
  - api
- set up logging
  - server
  - client
  - api-specific
  - postgres
  - redis

## discovery

- diff viewer
- gen-env-types
- dokku

## questions

- can I provide an interface for commit messages?

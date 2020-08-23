# authentication design

- anonymous users for room participants
- optionally sign in to github to create rooms
- when the user logs in from github, we'll create an entry in the users database

# data model

- anyone can create a room
- if you create a room

- if you have a link you can join a room

- room participants will be stored in redis

- store recently visited rooms and settings:

  - server side if signed in
  - client side if not

* id
* github_id
* ownedRooms

# todo

## now

- fix 0auth DONE
- setup type-graphql DONE
- get room data populating DONE

- assign links to rooms, send to empty page DONE
- one editor per room DONE

- simple room creation DONE
- real time editing in rooms DONE

- multiple editors per room ???

- create new gist with room data
- load data from a gist
- save back to gist

## later

- form/input validation

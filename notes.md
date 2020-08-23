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

- fix 0auth DONE
- setup type-graphql DONE
- get room data populating

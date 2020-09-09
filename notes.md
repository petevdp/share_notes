# authentication

- anonymous users for room participants
- optionally sign in to github to create rooms
- when the user logs in from github, we'll create an entry in the users database

# data model

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

## save back to gist

if gist already created:

- provide diff with gist for each file
  - save all
  - save one
- send request to save on the client side

# TODOs

## now

- choose between monaco and codemirror DONE, codemirror
- decent styling for presence indicators
- handle non-gist cases
- investigate diff viewer
- styling pass

## done

- fix 0auth DONE
- setup type-graphql DONE
- get room data populating DONE
- assign links to rooms, send to empty page DONE
- one editor per room DONE
- simple room creation DONE
- real time editing in rooms DONE
- Define a service that gives us a ydoc instance for the application's room DONE, unused
- load data from a gist DONE
- load data from a gist on room creation from the client DONE
- generalize query to work with non-user owned gists DONE
- save back to gist DONE
  - retreive gist data for room DONE
  - get current user data on client side DONE
- create new gist with room data
- multiple editors per room DONE
  - prove provider swap can be done cleanly DONE
  - get good event listener for room additions/changes DONE
  - integrate multi-editors with loading gist data for new rooms DONE
- try refactoring to use observable DONE, never again
- use github username in profile DONE

## tech debt

- hot module replacement
- form/input validation
- reduce bundle size

## questions

- what does TypeGraphql.ID do?
- how to unset browser session token
- will the current implementation work with private gists?

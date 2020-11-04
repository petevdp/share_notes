## save back to gist

if gist already created:

- provide diff with gist for each file
  - save all
  - save one
- send request to save on the client side

# TODOs

## now

- soft delete room
- loading and transitions
  - create room
- force anonymous login
- quick settings
- icons for actions/move actions
- fix rooms display
- landing page
- what's up with populate's transact?
- anonymous room owner

## later

- automatic sign-in
- restyle create new room button
- focus editor on tab switch
- landing page
- unescapable anonymous login modal
- come up with better name
- copy link to room button
- add titles for routes
- style scrollbar
- create new gist
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
- use redis for doc caching

## discovery

- diff viewer
- gen-env-types
- dokku

## questions

- can I provide an interface for commit messages?

## debt

- there are some type mismatches for certain gql queries with overly generic response types
- sometimes we get an error involving setting options on the editors when we create a room

# optional gists

- save back to gist action has to be conditional
- need to make gistName optional
- add link gist action

# anonymous rooms

# performance

- editing markdown, no preview: 64% scripting
- editing markdown, preview:

emojis that might break things:

⚡
⬇️
⚖️
🌐
⛹️
💯
🚨

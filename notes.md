# TODOs

- disable icons and actions depending on
  - room ownership
  - room having attached gist
- text truncations
- add snackbar when room is saved to gist
- timeout session clean up session storage, logout action
- loading and transitions
  - create room
- landing page
  - basic structure DONE
  - images and styling
- fix vim undo action

## later

- copy link to room button
- add titles for routes
- style scrollbar
- create new gist
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

- gen-env-types
- dokku
- aws
  - s3

## questions

- can I provide an interface for commit messages?

## debt

- there are some type mismatches for certain gql queries with overly generic response types
- sometimes we get an error involving setting options on the editors when we create a room
- all docs are stored in javascript memory, should move to redis for scalability

# optional gists

- save back to gist action has to be conditional
- need to make gistName optional
- add link gist action

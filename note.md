# Notes

## Concept

Collaboratively edit notes and export them to a few common places quickly and easily.

## Target Audience

people who like markdown and github/dislake word processors

## Flow

go to home page
sign user in if they have linked their github

click new workspace button
if no account, then we ask them to give us a name or sign in via github

add a file by:

- dragging and dropping file from desktop
- linking to a gist
  - if you link to a gist, we might also ask for 0Auth so we can write back to it
- linking to a file in a github repo

* google drive
* idk some other note taking apps

copy link to workspace via button

edit notes collaboratively

save notes by

- download
  - if multiple, zip
  - **stretch** if we've already downloaded a file like this before, give it a unique name (maybe date or just simple versioning with underscore)
- save back to gist or create a new one

## cool stretch features

protocol to support editing from your own editor

## stack

#### editor library

- monaco with convergence for sharing

### language

- typescript

### framework

- react

## package manger

- yarn v2
- yarn
- npm

## build tool

- parcel

# backend

- nodejs

## names

z_note
noteriety
sharepad
note_sharer
share_note
re_note
s_note
notr

## Layout

### landing page

- purpose
- option to list fetaures

## Persistent nav elements

- new room [mvp]
- sign in status
- recent rooms [mvp]

## New Room Dialogue

- if no user, ask to sign in
- ask for room name(provide default name based on context)[mvp]
- drops you in a new empty room [mvp]

## Room

### Actions

#### all users

- import gist -
  - open dropdown [mvp]
  - url text box [mvp]
  - if signed in on github, render list of user gists
  - else, provide link to sign in
- export/download
  - click button, download into folder as zip
- new file [mvp]
- copy invite link [mvp]
- delete file [mvp]
  - confirmation prompt [mvp]
- view diff

#### Owner only

- save back to gist
  - commit message text box
  - option to view diff
- save as new gist/fork
- delete room [mvp]
- kick user

### Status/details

- room name
- connected users [mvp]
  - if they're a github user, link there
  - connection quality
- owner
- server connection quality
- does this room have an associated gist?
- how many / whichlines are changed on this file?(hopefully we can do this via monaco)
- which files are edited?

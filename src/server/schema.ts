import { gql } from 'apollo-server';

export const typeDefs = gql`
  type Room {
    id: Int
    name: String
    owner: User
  }
  type User {
    id: Int
    username: String
  }

  type Query {
    rooms: [Room]
    room(id: Int): Room
    users: [User]
    user(id: Int): User
  }

  type Mutation {
    roomCreate(name: String, ownerId: Int): Room
    userCreate(id: Int, username: String): User
  }
`;

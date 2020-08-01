import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { User } from 'Server/models/user';
import { CreateUserInput } from 'Server/inputs/createUserInput';
import { Convergence } from '@convergence/convergence';

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users() {
    return User.find();
  }
  @Mutation(() => User)
  async createUser(@Arg('data') data: CreateUserInput) {
    const user = User.create(data);
    await user.save();

    return user;
  }
}

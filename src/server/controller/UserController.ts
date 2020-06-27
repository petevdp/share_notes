import { Controller, Query, Mutation } from 'vesper';
import { EntityManager } from 'typeorm';
import { User } from 'Server/entity/user';
import { UserArgs, UserCreateArgs } from 'Shared/args';

@Controller()
export class UserController {
  constructor(private entityManager: EntityManager) {}

  @Query()
  users() {
    return this.entityManager.find(User);
  }

  @Query()
  user({ id }: UserArgs) {
    return this.entityManager.findOne(User, id);
  }

  @Mutation()
  userCreate(args: UserCreateArgs) {
    console.log('args: ', args);

    const user = new User();
    user.username = args.username;
    return this.entityManager.save(user);
  }
}

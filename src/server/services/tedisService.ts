import { Room } from 'Server/models/room';
import { User } from 'Server/models/user';
import { Tedis } from 'tedis';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

export const USER_ID_BY_SESSION_KEY = 'userid-by-session';
export const TOKEN_BY_USER_ID = 'tokens-by-userid';

@Service()
export class TedisService {
  tedis: Tedis;
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {
    this.tedis = new Tedis({
      host: '127.0.0.1',
      port: 6379,
    });
  }

  async getCurrentUserId(token: string) {
    return await this.tedis.hget(USER_ID_BY_SESSION_KEY, token);
  }
}

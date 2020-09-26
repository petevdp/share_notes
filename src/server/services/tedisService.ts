import { extraUserDetails } from 'Server/utils/githubUtils';
import { Tedis } from 'tedis';
import { Service } from 'typedi';

export const USER_ID_BY_SESSION_KEY = 'session';

@Service()
export class TedisService {
  tedis: Tedis;
  constructor() {
    this.tedis = new Tedis({
      host: '127.0.0.1',
      port: 6379,
    });
  }
}

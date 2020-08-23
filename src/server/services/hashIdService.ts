import HashIds from 'hashids';
import { Service } from 'typedi';

@Service()
export class HashIdService {
  hashIds: HashIds;
  constructor() {
    this.hashIds = new HashIds(process.env.HASHID_SALT, 10);
  }
}

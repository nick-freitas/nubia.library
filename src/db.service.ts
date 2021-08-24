import { Gamebook, User } from '@indigobit/nubia.common';
import { Injectable } from '@nestjs/common';

export interface UserWithGamebooks extends User {
  library: Gamebook[];
}

// Use JSON file for storage
export type DbData = {
  users: UserWithGamebooks[];
};

@Injectable()
export class DBService {
  readonly db: { data: DbData };

  get users() {
    return this.db.data.users;
  }

  constructor() {
    this.db = { data: { users: [] } };
  }
}

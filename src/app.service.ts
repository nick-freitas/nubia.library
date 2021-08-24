import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EventType,
  OutOfOrderEventException,
  User,
} from '@indigobit/nubia.common';
import { DBService, UserWithGamebooks } from './db.service';

@Injectable()
export class AppService {
  constructor(private readonly DBService: DBService) {}

  async userCreatedHandler(data: Partial<User>): Promise<UserWithGamebooks> {
    const { fullName, id, email, version } = data;

    if (!email) {
      throw new Error('Missing Email');
    }
    if (!fullName) {
      throw new Error('Missing Full Name');
    }
    if (!id) {
      throw new Error('Missing Id');
    }

    const user: UserWithGamebooks = {
      id: id,
      email: email,
      fullName: fullName,
      version: version,
      library: [],
    };

    this.DBService.users.push({ ...user });

    return user;
  }

  async userUpdatedHandler(
    eventType: EventType,
    data: Partial<User>,
  ): Promise<UserWithGamebooks> {
    const { fullName, id, version } = data;

    if (!id) {
      throw new Error('Missing Id');
    }

    const index = this.DBService.users.findIndex(
      (user) => user.id === id && user.active === true,
    );
    if (index === -1)
      throw new BadRequestException('Bad Id in User Update Request');

    const user = { ...this.DBService.users[index] };
    if (user.version !== version - 1)
      throw new OutOfOrderEventException(eventType, user.version - 1, version);

    user.fullName = fullName;
    user.version = version;
    this.DBService.users[index] = { ...user };

    return user;
  }
}

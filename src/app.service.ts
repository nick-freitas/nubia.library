import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AddBookToLibraryEvent,
  Gamebook,
  GamebookCreatedEvent,
  GamebookEventType,
  GamebookUpdatedEvent,
  GetUserLibraryEvent,
  OutOfOrderEventException,
  RemoveBookFromLibraryEvent,
  UserCreatedEvent,
  UserEventType,
  UserUpdatedEvent,
} from '@indigobit/nubia.common';
import { DBService, UserWithGamebooks } from './db.service';

@Injectable()
export class AppService {
  constructor(private readonly dBService: DBService) {}

  async userCreatedHandler(
    data: UserCreatedEvent['data'],
  ): Promise<UserWithGamebooks> {
    const { fullName, id, email, version, roles } = data;

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
      roles: roles,
    };

    this.dBService.users.push({ ...user });

    return user;
  }

  async userUpdatedHandler(
    data: UserUpdatedEvent['data'],
  ): Promise<UserWithGamebooks> {
    const { fullName, id, version } = data;

    if (!id) {
      throw new Error('Missing Id');
    }

    const index = this.dBService.users.findIndex(
      (user) => user.id === id && user.active === true,
    );
    if (index === -1)
      throw new BadRequestException('Bad Id in User Update Request');

    const user = { ...this.dBService.users[index] };
    if (user.version !== version - 1)
      throw new OutOfOrderEventException(
        UserEventType.USER_UPDATED,
        user.version - 1,
        version,
      );

    user.fullName = fullName;
    user.version = version;
    this.dBService.users[index] = { ...user };

    return user;
  }

  async gamebookCreatedHandler(
    data: GamebookCreatedEvent['data'],
  ): Promise<Gamebook> {
    const { id, price, imageSrc, description, title, version, authorId } = data;

    if (!id) {
      throw new Error('Missing Id');
    }
    if (!version) {
      throw new Error('Missing version');
    }

    const gamebook: Gamebook = {
      id,
      price,
      imageSrc,
      authorId,
      description,
      title,
      version,
    };

    this.dBService.gamebooks.push({ ...gamebook });

    return gamebook;
  }

  async gamebookUpdatedHandler(
    data: GamebookUpdatedEvent['data'],
  ): Promise<Gamebook> {
    const { id, version } = data;

    if (!id) {
      throw new Error('Missing Id');
    }
    if (!version) {
      throw new Error('Missing Version');
    }

    const index = this.dBService.gamebooks.findIndex(
      (gamebook) => gamebook.id === id,
    );
    if (index === -1)
      throw new BadRequestException('Bad Id in Gamebook Update Request');

    const gamebook = { ...this.dBService.gamebooks[index] };
    if (gamebook.version !== version - 1)
      throw new OutOfOrderEventException(
        GamebookEventType.GAMEBOOK_UPDATED,
        gamebook.version - 1,
        version,
      );

    this.dBService.gamebooks[index] = {
      ...gamebook,
      ...data,
      version,
    };

    return gamebook;
  }

  async getUserLibrary(data: GetUserLibraryEvent['data']) {
    const { userId } = data;

    if (!userId)
      throw new BadRequestException('No UserId in GetUserLibrary Request');

    const userLibrary = this.dBService.users.find((u) => u.id === userId);
    if (!userLibrary)
      throw new BadRequestException('Could not find a library for that user');

    return userLibrary.library;
  }

  async addBookToLibrary(data: AddBookToLibraryEvent['data']) {
    const { userId, gamebookId } = data;

    if (!userId)
      throw new BadRequestException('No UserId in GetUserLibrary Request');
    if (!gamebookId)
      throw new BadRequestException('No GamebookId in GetUserLibrary Request');

    const userLibraryIndex = this.dBService.users.findIndex(
      (u) => u.id === userId,
    );
    if (userLibraryIndex === -1)
      throw new BadRequestException('Could not find a library for that user');
    const userLibrary = this.dBService.users[userLibraryIndex];

    const existingGamebook = userLibrary.library.find(
      (gb) => gb.id === gamebookId,
    );

    // Tf there is already a gamebook in the library with that id,
    // then we've already processed this event or a simliar one in the past.
    // There is nothing more we can do so just return
    if (existingGamebook) return;

    const gamebook = this.dBService.gamebooks.find(
      (gb) => gb.id === gamebookId,
    );
    userLibrary.library.push(gamebook);
    this.dBService.users[userLibraryIndex] = { ...userLibrary };

    return userLibrary.library;
  }

  async removeBookFromLibrary(data: RemoveBookFromLibraryEvent['data']) {
    const { userId, gamebookId } = data;

    if (!userId)
      throw new BadRequestException(
        'No UserId in RemoveBookFromLibrary Request',
      );
    if (!gamebookId)
      throw new BadRequestException(
        'No GamebookId in RemoveBookFromLibrary Request',
      );

    const userLibraryIndex = this.dBService.users.findIndex(
      (u) => u.id === userId,
    );
    if (userLibraryIndex === -1)
      throw new BadRequestException('Could not find a library for that user');
    const userLibrary = this.dBService.users[userLibraryIndex];

    const existingGamebookIndex = userLibrary.library.findIndex(
      (gb) => gb.id === gamebookId,
    );

    // Tf that gamebook is not there,
    // then we've already processed this event or a simliar one in the past.
    // There is nothing more we can do so just return
    if (existingGamebookIndex === -1) return;

    userLibrary.library.splice(existingGamebookIndex, 1);
    this.dBService.users[userLibraryIndex] = {
      ...userLibrary,
      library: [...userLibrary.library],
    };

    return userLibrary.library;
  }
}

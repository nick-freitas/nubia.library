import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('library.get-test')
  getTest(@Payload() message: any): any {
    return this.appService.getTest(message);
  }
}

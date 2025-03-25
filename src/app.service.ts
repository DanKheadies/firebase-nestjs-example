import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'The NestJS-Firebas project is up and running. Test it out..';
  }
}

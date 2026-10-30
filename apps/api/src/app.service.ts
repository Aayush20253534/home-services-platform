import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: 'ok'; service: 'home-services-api' } {
    return { status: 'ok', service: 'home-services-api' };
  }
}

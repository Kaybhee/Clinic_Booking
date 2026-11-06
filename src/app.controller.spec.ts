import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  it('reports ok', () => {
    expect(new AppController(new AppService()).health()).toEqual({ status: 'ok' });
  });
});

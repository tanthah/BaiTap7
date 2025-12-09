process.env.NODE_ENV = 'test';
jest.setTimeout(10000);

afterAll((done) => {
  if (global.server) {
    global.server.close(done);
  } else {
    done();
  }
});
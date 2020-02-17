import { configureApp } from './app';
const port = 3000;
configureApp().listen(port);
console.log(`Listening on port ${port}`);

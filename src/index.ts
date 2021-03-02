import * as dotenv from 'dotenv';
import { Server } from "./server";
dotenv.config();
const server = new Server();

server.listen(port => {
    console.log(`Server is listening on http://localhost:${port}`);
});
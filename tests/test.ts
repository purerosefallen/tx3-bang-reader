import { User } from "../src/user";
import fs from "fs";

async function main() {
	let html = await fs.promises.readFile("./tests/28_20588.html", "utf-8");
	console.log(new User("28_20588", html));
	html = await fs.promises.readFile("./tests/60_46782.html", "utf-8");
	console.log(new User("60_46782", html));
}
main();

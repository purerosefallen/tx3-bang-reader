import { User } from "../src/user";
import fs from "fs";

async function main() {
	const html = await fs.promises.readFile("./tests/28_20588.html", "utf-8");
	console.log(new User(html));
}
main();

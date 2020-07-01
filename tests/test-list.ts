import { User } from "../src/user";
import fs from "fs";
import { parsePlayerRows } from "../src/playerlist";

async function main() {
	let html = await fs.promises.readFile("./tests/playerlist.html", "utf-8");
	console.log(parsePlayerRows(html));
	html = await fs.promises.readFile("./tests/playerlist-null.html", "utf-8");
	console.log(parsePlayerRows(html));
}
main();

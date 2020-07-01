import { User } from "../src/user";
import fs from "fs";
import HTML from "posthtml-parser";

async function main() {
	let id = "28_20588";
	let html = await fs.promises.readFile(`./tests/${id}.html`, "utf-8");
	await fs.promises.writeFile(`./tests/${id}.json`, JSON.stringify(HTML(html), null, 2));
	console.log(new User(id, html, null));
	id = "6_18804822";
	html = await fs.promises.readFile(`./tests/${id}.html`, "utf-8");
	await fs.promises.writeFile(`./tests/${id}.json`, JSON.stringify(HTML(html), null, 2));
	console.log(new User(id, html, null));
}
main();

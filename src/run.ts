import { Tx3Fetcher, servers } from "./fetcher";
import fs from "fs";
import _ from "underscore";

const fetcher = new Tx3Fetcher();

async function runServer(server: string) {
	const users = await fetcher.fetchUsersFromServer(server);
	await fs.promises.writeFile(`./output/servers/${server}.json`, JSON.stringify(users, null, 2));
}

async function main() {
	try {
		await fs.promises.access("./output/servers");
	} catch (e) {
		await fs.promises.mkdir("./output/servers", {
			recursive: true
		});
	}
	await fetcher.initProxies();
	for (let server of servers) {
		await runServer(server);
	}
}
main();

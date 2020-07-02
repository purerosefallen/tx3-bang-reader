import {Tx3Fetcher, servers, Config} from "./fetcher";
import fs from "fs";
import _ from "underscore";
import yaml from "yaml";

let fetcher;

async function runServer(server: string) {
	const users = await fetcher.fetchListFromServer(server);
	await fs.promises.writeFile(`./output/servers/${server}.json`, JSON.stringify({
		date: fetcher.date,
		data: users
	}, null, 2));
	return users;
}

async function main() {
	try {
		await fs.promises.access("./output/servers");
	} catch (e) {
		await fs.promises.mkdir("./output/servers", {
			recursive: true
		});
	}
	const config: Config = yaml.parse(await fs.promises.readFile("./config.yaml", "utf8"));
	fetcher = new Tx3Fetcher(config);
	await fetcher.init();
	if (config.server) {
		await Promise.all(config.server.map(runServer));
		return;
	}
	const userListWithServer = await Promise.all(servers.map(runServer));
	const allServersList: any = {};
	for (let i = 0; i < servers.length;++i) {
		allServersList[servers[i]] = userListWithServer[i];
	}
	await fs.promises.writeFile(`./output/all.json`, JSON.stringify({
		date: fetcher.date,
		data: allServersList
	}, null, 2));
	process.exit();
}
main();

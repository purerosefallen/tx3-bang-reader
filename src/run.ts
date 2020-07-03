import {Tx3Fetcher, servers, Config} from "./fetcher";
import fs from "fs";
import _ from "underscore";
import yaml from "yaml";
import { CronJob } from "cron";

let config: Config;

async function loadConfig() {
	config = yaml.parse(await fs.promises.readFile("./config.yaml", "utf8"));
}

async function runServer(fetcher: Tx3Fetcher, server: string) {
	const users = await fetcher.fetchListFromServer(server);
	await fs.promises.writeFile(`./output/servers/${server}.json`, JSON.stringify({
		date: fetcher.curDate,
		data: users
	}, null, 2));
	return users;
}

async function run() {
	console.log(`Fetch started.`);
	try {
		await fs.promises.access("./output/servers");
	} catch (e) {
		await fs.promises.mkdir("./output/servers", {
			recursive: true
		});
	}
	const fetcher = new Tx3Fetcher(config);
	await fetcher.init();
	if (config.server) {
		await Promise.all(config.server.map(server => {
			return runServer(fetcher, server)
		}));
	} else {
		const userListWithServer = await Promise.all(servers.map(server => {
			return runServer(fetcher, server)
		}));
		const allServersList: any = {};
		for (let i = 0; i < servers.length;++i) {
			allServersList[servers[i]] = userListWithServer[i];
		}
		await fs.promises.writeFile(`./output/all.json`, JSON.stringify({
			date: fetcher.curDate,
			data: allServersList
		}, null, 2));
	}
	console.log("Finished.");
}

async function main() {
	await loadConfig();
	if (process.argv[2] === "cron") {
		const job = new CronJob("0 0 1 * * *", run, null, true, "Asia/Shanghai");
		job.start();
	} else {
		await run();
		process.exit();
	}
	
}
main();

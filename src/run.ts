import { Tx3Fetcher, servers } from "./fetcher";
import fs from "fs";
import _ from "underscore";
async function main() {
	try {
		await fs.promises.access("./output/servers");
	} catch (e) {
		await fs.promises.mkdir("./output/servers", {
			recursive: true
		});
	}
	const fetcher = new Tx3Fetcher();
	await fetcher.initProxies();
	const fetchResult = await fetcher.fetch();
	const allUsers = _.flatten(Array.from(fetchResult.values));
	await fs.promises.writeFile("./output/all.json", JSON.stringify(allUsers, null, 2));
	await Promise.all(servers.map(server => fs.promises.writeFile(`./output/servers/${server}.json`, JSON.stringify(fetchResult.get(server), null, 2))));
}
main();

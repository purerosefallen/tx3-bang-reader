import mysql from "promise-mysql";
import fs from "fs";
import { Config } from "./fetcher";
import { PlayerRowFull } from "./playerlist";
import _ from "underscore";
import yaml from "yaml";

function checkSameRow(row: PlayerRowFull, lrow: PlayerRowFull) {
	return _.every(["name", "category", "serverArea", "server", "region"], field => lrow[field] === row[field]);
}

async function main() {
	console.error("Started.");
	const config: Config = yaml.parse(await fs.promises.readFile("./config.yaml", "utf8"));
	const db = await mysql.createPool(config.MySQLConfig);
	const urlDataCache = new Map<string, PlayerRowFull>();
	const deleteList: number[] = [];
	const datas: PlayerRowFull[] = await db.query(`select * from userdata order by date asc`);
	for (let row of datas) {
		if (urlDataCache.has(row.url)) {
			const oldRow = urlDataCache.get(row.url);
			if (checkSameRow(row, oldRow)) {
				deleteList.push(row.id);
			}
		}
		urlDataCache.set(row.url, row);
	}
	console.error(`Deletes: ${deleteList.length}`);
	for (let id of deleteList) {
		const sql = `delete from userdata where id = ?`;
		console.error(`Deleted: ${sql} ${id} ${JSON.stringify(await db.query(sql, id))}`);
	}
	console.error("Finished.");
	process.exit();
}
main();

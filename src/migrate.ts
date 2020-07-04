import mysql from "promise-mysql";
import moment from "moment";
import fs from "fs";
import _csv_parse from "csv-parse";
import util from 'util';
import { Config } from "./fetcher";
import { PlayerRow, PlayerRowDated } from "./playerlist";
import _ from "underscore";
import yaml from "yaml";

const parse_csv: (input: Buffer | string, options?: _csv_parse.Options) => Promise<any[]> = util.promisify(_csv_parse);
let config: Config;
let db: mysql.Pool;

const serverAreaCache = new Map<string, string>();
async function getServerAreaFromServer(server: string) {
	if (serverAreaCache.has(server)) {
		return serverAreaCache.get(server);
	} else {
		const [res] = await db.query("select serverArea from userdata where server = ? limit 1", server);
		if (!res) {
			return "none";
		}
		const serverArea = res.serverArea;
		serverAreaCache.set(server, serverArea);
		return serverArea;
	}
}

async function readSingleRecord(col: string[], offset: number, base: PlayerRow): Promise<PlayerRowDated> {
	let pointer = offset;
	const newRecord: PlayerRowDated = {
		date: moment(col[pointer++], "YYYY/MM/DD").format("YYYY-MM-DD HH:mm:ss"),
		...(_.clone(base))
	};
	newRecord.name = col[pointer++];
	newRecord.server = col[pointer++];
	newRecord.serverArea = await getServerAreaFromServer(newRecord.server);
	const _region = col[pointer++];
	newRecord.region = _region.length ? _region : "none";
	newRecord.category = col[pointer++];
	newRecord.equip = parseInt(col[pointer++]);
	newRecord.totalScore = newRecord.equip + newRecord.score;
	return newRecord;
}

let leftCount: number;
async function readColumn(col: string[]): Promise<void> {
	const recordCount = parseInt(col[0]);
	const url = `/bang/role/${col[3]}`;
	console.error(`Reading column ${url}.`);
	let [base] = await db.query("select url,rank,name,category,serverArea,server,level,region,score,equip,totalScore from userdata where url = ? order by date asc limit 1", url) as PlayerRow[];
	if (!base) {
		console.error(`Base record of ${url} not found. Using default values.`);
		base = {
			url,
			rank: 500,
			name: null,
			server: null,
			serverArea: null,
			category: null,
			level: 80,
			region: "none",
			score: 0,
			equip: 0,
			totalScore: 0
		}
	}
	for (let i = 0; i < recordCount; ++i) {
		const offset = 4 + (i * 6);
		if (!col[offset].length) {
			continue;
		}
		const record = await readSingleRecord(col, offset, base);
		const sql = "insert into userdata set ?";
		console.log(sql, JSON.stringify(record), JSON.stringify(await db.query(sql, record)));
	}
	console.error(`Read column ${url}. ${--leftCount} columns left.`);
}

async function loadCsv(path: string): Promise<string[][]> {
	const data = await fs.promises.readFile(path);
	return await parse_csv(data, {
		trim: true
	});
}

async function main() {
	console.error("Started.");
	const config: Config = yaml.parse(await fs.promises.readFile("./config.yaml", "utf8"));
	db = await mysql.createPool(config.MySQLConfig);
	const data = await loadCsv(process.argv[2]);
	leftCount = data.length;
	//await Promise.all(data.map(col => readColumn(col)));
	for (let col of data) {
		await readColumn(col);
	}
	console.error("Finished.");
	process.exit();
}
main();

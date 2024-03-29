import axios from "axios";
import _ from "underscore";
import { User } from "./user";
import {ProxyConfig, ProxyFetcher} from "./proxy";
import { PlayerRow, parsePlayerRows } from "./playerlist";
import qs from "querystring";
import mysql from "promise-mysql";
import moment from "moment";

export const servers = [
	"东方明珠",
	"紫禁之巅",
	"一纪山海",
	"剑心问道",
	"天与秋光",
	"梦回山海",
	"绝代风华",
	"鼎立山河",
	"天府之国",
	"天下无双",
	"情动大荒",
	"琉璃月",
	"齐鲁天下",
	"剑舞香江",
	"白云山",
	"瘦西湖",
	"逐鹿中原",
	"黄鹤楼",
	"武夷九曲",
	"上善若水",
	"君临天下",
	"气壮山河",
	"飞龙在天",
	"烽火关东",
	"盛世长安",
	
]

export interface Config {
	outDir: string;
	server: string[];
	useMySQL: boolean,
	MySQLConfig: mysql.PoolConfig,
	proxy: ProxyConfig,
	cronString: string;
}
export class Tx3Fetcher {
	config: Config;
	proxyFetcher: ProxyFetcher;
	db: mysql.Pool;
	curDate: string;
	constructor(config: Config) {
		this.config = config;
		this.proxyFetcher = new ProxyFetcher(config.proxy);
	}
	async init() {
		this.curDate = moment().format("YYYY-MM-DD HH:mm:ss");
		if(this.config.useMySQL) {
			this.db = await mysql.createPool(this.config.MySQLConfig);
			await this.db.query("CREATE TABLE IF NOT EXISTS `userdata` (\n" +
				"  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n" +
				"  `date` datetime NOT NULL DEFAULT current_timestamp(),\n" +
				"  `url` varchar(50) COLLATE utf8_unicode_ci NOT NULL,\n" +
				"  `rank` int(11) UNSIGNED NOT NULL,\n" +
				"  `name` varchar(7) COLLATE utf8_unicode_ci NOT NULL,\n" +
				"  `category` varchar(5) COLLATE utf8_unicode_ci NOT NULL,\n" +
				"  `serverArea` varchar(4) COLLATE utf8_unicode_ci NOT NULL,\n" +
				"  `server` varchar(4) COLLATE utf8_unicode_ci NOT NULL,\n" +
				"  `level` tinyint(4) UNSIGNED NOT NULL,\n" +
				"  `region` varchar(7) COLLATE utf8_unicode_ci NOT NULL,\n" +
				"  `score` int(11) UNSIGNED NOT NULL,\n" +
				"  `equip` int(11) UNSIGNED NOT NULL,\n" +
				"  `totalScore` int(11) UNSIGNED NOT NULL,\n" +
				"  PRIMARY KEY (`id`),\n" +
				"  INDEX (date),\n" +
				"  INDEX (name(7)),\n" +
				"  INDEX (url(50)),\n" +
				"  INDEX (category(5)),\n" +
				"  INDEX (serverArea(4)),\n" +
				"  INDEX (server(4)),\n" +
				"  INDEX (region(7)),\n" +
				"  INDEX (equip)\n" +
				") ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci");
			console.log(`Removing existing records of ${this.curDate}.`);
			//await this.db.query("delete from userdata where date = ?", this.curDate);
		}
		if(this.config.proxy.useProxy) {
			await this.proxyFetcher.initProxies();
		}
	}
	async fetchAll(): Promise<Map<string, User[]>> {
		const res = new Map<string, User[]>();
		const userLists = await Promise.all(servers.map(server => this.fetchUsersFromServer(server)));
		for (let i = 1; i < userLists.length; ++i){
			res.set(servers[i], userLists[i])
		}
		return res;
	}
	async fetchUsersFromServer(server: string): Promise<User[]> {
		console.log(`Fetching user list from server ${server}.`);
		const resPromises: Promise<User[]>[] = [];
		for (let school = 1; school < 12; ++school) {
			resPromises.push(this.fetchUsersFromSchoolAndServer(school, server));
		}
		const result = _.flatten(await Promise.all(resPromises));
		console.log(`Fetched user list with ${result.length} users from server ${server}.`);
		return result;
	}
	async fetchUsersFromSchoolAndServer(school: number, server: string): Promise<User[]> {
		console.log(`Fetching users from server ${server} with school ${school}.`);
		const res: User[][] = [];
		for (let page = 1; page <= 25; ++page) {
			const list = await this.fetchUsers(school, server, page);
			if (!list.length) {
				break;
			}
			res.push(list);
		}
		return _.flatten(res);
	}
	async fetchUsers(school: number, server: string, page: number): Promise<User[]> {
		const playerRows = await this.fetchList(school, server, page);
		return await Promise.all(playerRows.map(row => this.fetchUser(row)));
	}
	async fetchListFromServer(server: string): Promise<PlayerRow[]> {
		console.log(`Fetching user list from server ${server}.`);
		const resPromises: Promise<PlayerRow[]>[] = [];
		for (let school = 1; school < 12; ++school) {
			resPromises.push(this.fetchListFromSchoolAndServer(school, server));
		}
		const result = _.flatten(await Promise.all(resPromises));
		console.log(`Fetched user list from server ${server}. ${result.length} users found.`);
		return result;
	}
	async fetchListFromSchoolAndServer(school: number, server: string): Promise<PlayerRow[]> {
		console.log(`Fetching users from server ${server} with school ${school}.`);
		const res: PlayerRow[][] = [];
		for (let page = 1; page <= 25; ++page) {
			const list = await this.fetchList(school, server, page);
			if (!list.length) {
				break;
			}
			res.push(list);
		}
		const ret = _.flatten(res);
		console.log(`Fetched users from server ${server} with school ${school}.`);
		return ret;
	}
	async checkAddRecord(row: PlayerRow) {
		const latestRows = await this.db.query("select url,rank,name,category,serverArea,server,level,region,score,equip,totalScore from userdata where url = ? order by date desc limit 1", row.url);
		if (latestRows.length) {
			const lrow = latestRows[0];
			if (_.every(["name", "category", "serverArea", "server", "region"], field => lrow[field] === row[field])) {
				return;
			}
		}
		const sql = "insert into userdata set ?";
		const valueObj = {
			date: this.curDate,
			...row
		};
		console.log(`Player ${row.name} from ${row.server} has changes. Writing record to database: ${sql} ${JSON.stringify(valueObj)} ${JSON.stringify(await this.db.query(sql, valueObj))}`);
	}
	async fetchList(school: number, server: string, page: number): Promise<PlayerRow[]> {
		console.log(`Fetching user list from server ${server} with school ${school} page ${page}.`);
		try { 
			const content: string = await this.proxyFetcher.getWithProxy(`http://bang.tx3.163.com/bang/ranks`, {
				responseType: "document",
				params: {
					order_key: "equ_xiuwei",
					count: 20,
					school,
					server,
					page
				},
				paramsSerializer: (params) => {
					return qs.stringify(params);
				}
			});
			const playerRows = parsePlayerRows(content);
			console.log(`Fetched user list from server ${server} with school ${school} page ${page}. ${playerRows.length} users found.`);
			if (this.db) {
				//await Promise.all(playerRows.map(m => this.db.query("delete from userdata where url = ? and date = ?", [m.url, this.curDate])));
				await Promise.all(playerRows.map(m => this.checkAddRecord(m)));
			}
			return playerRows;
		} catch(e) {
			console.error(`Errored fetching user list with params ${school} ${server} ${page}}: ${e.toString()}`);
			return [];
		}
	}
	async fetchUser(playerRow: PlayerRow): Promise<User> {
		const id = playerRow.url.split("/").pop();
		try { 
			console.log(`Fetching user ${playerRow.name} from ${playerRow.server}.`);
			const content: string = await this.proxyFetcher.getWithProxy(`http://bang.tx3.163.com${playerRow.url}`, {
				responseType: "document"
			});
			const user = new User(id, content, playerRow.region);
			console.log(`Fetched user ${playerRow.name} from ${playerRow.server}.`);
			return user;
		} catch(e) {
			console.error(`Errored fetching role data from ${id}: ${e.toString()}`);
			return null;
		}
	}
}

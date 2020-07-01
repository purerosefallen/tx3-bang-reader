import axios from "axios";
import _ from "underscore";
import { User } from "./user";
import { ProxyFetcher } from "./proxy";
import { PlayerRow, parsePlayerRows } from "./playerlist";
import qs from "querystring";

export const servers = [
	"东方明珠",
	"君临天下",
	"幻龙诀",
	"气壮山河",
	"紫禁之巅",
	"绝代风华",
	"问鼎天下",
	"鼎立山河",
	"天下无双",
	"情动大荒",
	"昆仑变",
	"琉璃月",
	"齐鲁天下",
	"剑舞香江",
	"白云山",
	"瘦西湖",
	"逐鹿中原",
	"天府之国",
	"黄鹤楼",
	"墨倾天下",
	"武夷九曲",
	"上善若水",
	"飞龙在天",
	"烽火关东",
	"盛世长安",
	"荒火山神",
	"一诺山海",
	"梦回山海",
	"锦绣花朝"
]

export class Tx3Fetcher {
	proxyFetcher: ProxyFetcher;
	constructor() {
		this.proxyFetcher = new ProxyFetcher();
	}
	async initProxies() {
		await this.proxyFetcher.initProxies();
	}
	async fetch(): Promise<Map<string, User[]>> {
		const res = new Map<string, User[]>();
		const userLists = await Promise.all(servers.map(server => this.fetchUsersFromServer(server)));
		for (let i = 1; i < userLists.length; ++i){
			res.set(servers[i], userLists[i])
		}
		return res;
	}
	async fetchUsersFromServer(server: string): Promise<User[]> {
		const userList = await this.fetchListFromServer(server);
		return await Promise.all(userList.map(r => this.fetchUser(r)));
	}
	async fetchListFromServer(server: string): Promise<PlayerRow[]> {
		console.log(`Fetching user list from server ${server}.`);
		const resPromises: Promise<PlayerRow[]>[] = [];
		for (let school = 1; school < 12; ++school) {
			resPromises.push(this.fetchListFromSchoolAndServer(school, server));
		}
		const result = _.flatten(await Promise.all(resPromises));
		console.log(`Fetched user list with ${result.length} users from server ${server}.`);
		return result;
	}
	async fetchListFromSchoolAndServer(school: number, server: string): Promise<PlayerRow[]> {
		console.log(`Fetching user list from server ${server} with school ${school}.`);
		const res: PlayerRow[][] = [];
		for (let page = 1; page <= 25; ++page) {
			const list = await this.fetchUserList(school, server, page);
			if (!list.length) {
				console.log(`User list from server ${server} with school ${school} page ${page} is blank.`);
				break;
			}
			res.push(list);
		}
		return _.flatten(res);
	}
	async fetchUserList(school: number, server: string, page: number): Promise<PlayerRow[]> {
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
			return parsePlayerRows(content);
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

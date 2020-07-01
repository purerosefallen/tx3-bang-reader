import axios from "axios";
import _ from "underscore";
import parseHTML from "posthtml-parser";
import { User } from "./user";

class Tx3Fetcher {
	async fetchRole(id: string): Promise<User> {
		//try { 
			const content = (await axios.get(`http://bang.tx3.163.com/bang/role/${id}`, {
				responseType: "document"
			})).data;
			const parsedContent = parseHTML(content);
			return new User(id, content);
		/*} catch(e) {
			console.error(`Errored fetching role data from ${id}: ${e.toString()}`);
			return null;
		}*/
	}
}

async function main() {
	const fetcher = new Tx3Fetcher();
	console.log(JSON.stringify(await fetcher.fetchRole("28_20588"), null, 2));
}
main();

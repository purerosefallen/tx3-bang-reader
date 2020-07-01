import { ProxyFetcher } from "../src/proxy";
async function main() { 
	const fetcher = new ProxyFetcher();
	await fetcher.initProxies();
	console.log(await fetcher.getWithProxy("https://mycard.moe", {}));
}
main();

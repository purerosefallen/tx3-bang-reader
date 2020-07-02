import { ProxyFetcher } from "../src/proxy";
async function main() { 
	const fetcher = new ProxyFetcher({
		useProxy: true,
		proxySource: [
			"http://www.89ip.cn/tqdl.html?api=1&num=9999",
			"http://www.66ip.cn/mo.php?tqsl=9999"
		],
		timeout: 10000
	});
	await fetcher.initProxies();
	console.log(await fetcher.getWithProxy("https://mycard.moe", {}));
}
main();

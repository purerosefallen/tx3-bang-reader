import axios, { AxiosProxyConfig, AxiosRequestConfig } from "axios";

export class ProxyFetcher {
	proxies: AxiosProxyConfig[];
	counter: number;
	constructor() {
		this.proxies = [];
		this.counter = 0;
	}
	async initProxiesFrom(url: string) {
		if (process.env.NO_PROXY) {
			return;
		}
		while (true) {
			try {
				const proxyPage: string = (await axios.get(url, {
					responseType: "document"
				})).data;
				const proxyMatches: string[] = proxyPage.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/g);
				for (let proxyString of proxyMatches) {
					const [host, _port] = proxyString.split(":");
					const port = parseInt(_port);
					this.proxies.push({ host, port });
				}
				console.error(`Got ${proxyMatches.length} proxies from ${url}.`);
				return;
			} catch (e) {
				console.error(`Failed fetching proxy list from ${url}: ${e.toString()}`)
			}
		}
	}
	async initProxies() {
		await Promise.all(["http://www.89ip.cn/tqdl.html?api=1&num=9999", "http://www.66ip.cn/mo.php?tqsl=9999"].map((m) => {
			return this.initProxiesFrom(m);
		}));
	}
	async getWithProxy(url: string, options: AxiosRequestConfig) {
		while (true) {
			if (!process.env.NO_PROXY && !this.proxies.length) {
				await this.initProxies();
			}
			const proxyIndex = process.env.NO_PROXY ? null : (++this.counter) % this.proxies.length;
			const proxy = process.env.NO_PROXY ? null : this.proxies[proxyIndex];
			try {
				const data = (await axios.get(url, {
					proxy,
					headers: {
						"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0"
					},
					timeout: 10000,
					...options
				})).data;
				return data;
			} catch (e) {
				/*if (!process.env.NO_PROXY) {
					this.proxies.splice(proxyIndex, 1);
				}*/
				console.error(`Failed fetching data from ${url}: ${e.toString()}`)
			}
		}
	}
}

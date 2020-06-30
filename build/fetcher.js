"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const posthtml_parser_1 = __importDefault(require("posthtml-parser"));
const user_1 = require("./user");
class Tx3Fetcher {
    async fetchRole(id) {
        //try { 
        const content = (await axios_1.default.get(`http://bang.tx3.163.com/bang/role/${id}`, {
            responseType: "document"
        })).data;
        const parsedContent = posthtml_parser_1.default(content);
        return new user_1.User(content);
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
//# sourceMappingURL=fetcher.js.map
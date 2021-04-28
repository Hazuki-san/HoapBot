/*
 * แจกฟรี ห้ามนำไปขาย
 * สำหรับเซิร์ฟเวอร์ mc-zero.net (GUI22)
 * Hazuki-san (Hoap) 2021
 * r0neko | Code Quality CHECK!
 */

const async = require('async');
var math = require('mathjs');
var v = require('vec3');
const fs = require('fs')
const util = require('util')
const mineflayer = require('mineflayer')
const {
	pathfinder,
	Movements,
	goals: {
		GoalBlock
	}
} = require('mineflayer-pathfinder')
var navigatePlugin = require('mineflayer-navigate')(mineflayer);

const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8')
const wrap = module.exports.wrap = cb => new Promise(resolve => cb(resolve));

const config = {
	host: 'mc-zero.net', // ไอพีที่จะเชื่อม
	port: 25565, // พอร์ต
	file: './alts.txt', // โหลดบัญชีจากไฟล์
	interval: 0 // (แนะนำให้ใช้ 4000-5000 สำหรับเซิร์ฟอื่นๆ แต่ว่าเซิร์ฟ ZERO ไม่จำกัดไว้ เลยใช้ 0 ได้)
}

var botowner = 'Hoap' // ชื่อเจ้าของบอท
var authme = '@V3RYS3CUR3P@aSw0RD' // รหัสบอททุกตัว

function makeBot(_u, ix) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const bot = mineflayer.createBot({
				username: _u,
				host: config.host,
				port: config.port,
				version: "1.8.9"
			})
			navigatePlugin(bot);
			console.log("Loaded: " + _u)

			function goGUI22() {
				setTimeout(bot.activateItem, 500);
				bot.on('windowOpen', async (window) => {
					window.requiresConfirmation = false // fix
					await bot.clickWindow(22, 0, 0)
				})
			}

			bot.loadPlugin(pathfinder)
			bot.once('spawn', () => {
				const mcData = require('minecraft-data')(bot.version)
				const defaultMove = new Movements(bot, mcData)
				bot.chat('/login ' + authme)
				console.log(_u + ": /login " + authme)
				bot.pathfinder.setMovements(defaultMove)
				bot.pathfinder.setGoal(new GoalBlock(28, 68, 0))
				bot.on('goal_reached', (goal) => {
					// โดด เพราะเหมือนเซิร์ฟค้างหรือเปล่า? ไม่แน่ใจ
					bot.setControlState('jump', true)
					bot.setControlState('jump', false)
				})
			})

			bot.chatAddPattern(
				/(ตอนนี้กำลังเล่นเพลง)/,
				'nowplayingdetected',
				'we know that we logged in'
			)

			bot.chatAddPattern(
				/CHATGAME » ใครพิมพ์คำว่า (.*) เสร็จก่อนชนะ!/,
				'chatreactiondetected',
				'Yooo, isnt that some good shit right there'
			)

			bot.chatAddPattern(
				/ระบบได้ทำการลบเก็บขยะจำนวน (.*) ชิ้น/,
				'clearlagged',
				'ffs i hate myself',
			)

			const NowPlaying = () => {
				// รู้แล้วว่าอยู่ในล็อบบี้ งั้นไปกันเลย!
				setTimeout(goGUI22, 500);
			}

			bot.on('nowplayingdetected', NowPlaying)

			/*
			 * SNIPER
			*/
			var sniping = false;
			var snipe = function() {
				if (!sniping) return;
				bot.on('chatreactiondetected', matches => {
					bot.chat(`${matches}`) // ตรงๆแม่นๆ แน่นอนจริงๆ
				});
			};

			/*
			 * โค้ตตกปลา
			 */
			var fishing = false;
			var fish = function () {
				// ClearLag Fix
				if (!fishing) return;
				bot.on('clearlagged', matches => {
					bot.activateItem()
					bot.activateItem()
				});

				let running = true;
				(async () => {
					const mcData = require('minecraft-data')(bot.version)
					while (running) {
						await wrap(res => bot.equip(
							bot.inventory.findInventoryItem(mcData.itemsByName.fishing_rod.id),
							'hand',
							res
						));

						let bobber = await wrap(res => {
							/* @param {Entity} entity */
							let onSpawn = entity => {
								if (entity.objectType !== "Fishing Float") return
								bot.once('entitySpawn', onSpawn);
								res(entity);
							}
							bot.on('entitySpawn', onSpawn);
							bot.activateItem();
						});

						if (!running) {
							bot.activateItem();
							break;
						}

						// Soft <= 0.3
						// Medium <= 1.23
						// Rage <= 5
						// MAD < Infinity
						await wrap(res => {
							let onParticles = packet => {
								let pos = bobber.position
								if (packet.particleId === 4 && packet.particles === 6 && pos.distanceTo(new v(packet.x, pos.y, packet.z)) <= 1.23) res();
								bot._client.once('world_particles', onParticles);
							}
							bot._client.once('world_particles', onParticles)
						});
						bot.activateItem();
					}
				})();
				return () => {
					running = false;
				}
			};

			/*
			 * โค้ตแสดงข้อความในเซิรฺ์ฟ
			 */
			bot.on('message', (cm) => {
				console.log(bot.username + ": " + cm.toString())
				if (cm.toString().includes(bot.username)) return
			})

			/*
			 * โค้ตแชท
			 */
			bot.on('chat', function (username, message) {
				if (username == bot.username) return; //ถ้าตรงกับชื่อตัวเอง อย่าสนใจ
				if (username !== botowner) return; // ถ้าไม่ใช่เจ้าของบอท อย่าสนใจ

				try {
					var result = math.eval(message);
					if (result != null && result != undefined)
						bot.chat(result + '');
				} catch (e) {}

				if (message.indexOf("me] !bot") >= 0) // ข้อความอันนี้มาจาก /w
					message = message.substring(4); // ตัดข้อความออก (คำว่า "me] ")
				else if (message.split(" ")[0].toLowerCase() == "!all") // ถ้าไม่ใช่ก็แสดงว่าแชทโลก
					message = ["!bot", ...message.split(" ").slice(1)].join(" "); // ลบคำว่า !all แล้วเปลี่ยนเป็น !bot แทน

				var args = message.split(' ');
				if (args[0].toLowerCase() == "!bot") {
					var command = args[1].toLowerCase();
					switch (command) {
						case 'sudo':
							if (args.slice(2).join(" ") == "")
								bot.chat('/w ' + botowner + ' ' + 'จะให้พิมพ์ว่าอะไรหรอ 555');
							bot.chat(args.slice(2).join(" "))
							break;
						case 'disconnect':
							bot.quit();
							break;
						case 'drop':
							try {
								bot.toss(parseInt(args[2]), null, (args[3]) ? parseInt(args[3]) : 1, function (err) {
									if (!err)
										bot.chat('/w ' + botowner + ' ' + 'โยนของให้แล้วนะ');
									else
										bot.chat('/w ' + botowner + ' ' + err.message);
								});
							} catch (e) {
								bot.chat('/w ' + botowner + ' ' + 'ไม่รู้จักสิ่งนี้อ่ะ');
							}
							break;
						case 'dump':
							var inventory = bot.inventory.slots;
							var items = [];
							for (var item in inventory) {
								if (!inventory[item]) continue;
								items.push({
									type: inventory[item].type,
									count: inventory[item].count
								});
							}
							bot.chat('/w ' + botowner + ' ' + `กำลังโยน ${items.length} ออกจากตัวทั้งหมด`);
							async.forEachSeries(items, function (item, callback) {
								bot.toss(item.type, null, item.count, function (err) {
									if (err) console.log(err);
									callback();
								});
							});
							break;
						case 'equip':
							var slot = (['hand', 'head', 'torso', 'legs', 'feed'].indexOf(args[3]) < 0) ? 'hand' : args[3];
							bot.equip(bot.inventory.slots[parseInt(args[2])], slot, function (err) {
								if (!err) bot.chat('/w ' + botowner + ' ' + 'ใส่ให้แล้วนะ');
								else bot.chat('/w ' + botowner + ' ' + err.message);
							})
						case 'experience':
							bot.chat('/w ' + botowner + ' ' + 'เลเวลตอนนี้: ' + bot.experience.level);
							break;
						case 'fish':
							var startFishing = function () {
								fishing = true;
								fish();
								bot.chat('/w ' + botowner + ' ' + 'เริ่มตกปลาแล้ว จะได้ปลาเยอะมั้ยนะ?');
							};
							var stopFishing = function () {
								fishing = false;
								bot.activateItem();
								bot.chat('/w ' + botowner + ' ' + 'เลิกตกปลาแล้ว');
							};
							var toggleFishing = function () {
								if (!fishing) startFishing();
								else stopFishing();
							};

							if (args[2] == 'start') startFishing();
							else if (args[2] == 'stop') stopFishing();
							else toggleFishing();

							break;
						case 'snipe':
							var startSniping = function () {
								sniping = true;
								snipe();
								bot.chat('/w ' + botowner + ' ' + 'พวกมันพิมพ์ไม่ทันแน่ 5555');
							};
							var stopSniping = function () {
								sniping = false;
								bot.chat('/w ' + botowner + ' ' + 'อะไรอ่ะ กำลังสนุกอยู่เลย ปิดซะล่ะ :<');
							};
							var toggleSniping = function () {
								if (!sniping) startSniping();
								else stopSniping();
							};

							if (args[2] == 'start') startSniping();
							else if (args[2] == 'stop') stopSniping();
							else toggleSniping();

							break;
						case 'food':
							bot.chat('/w ' + botowner + ' ' + 'หลอดอาหาร: ' + bot.food + '/20');
							break;
						case 'health':
							bot.chat('/w ' + botowner + ' ' + 'หลอดเลือด: ' + bot.health + '/20');
							break;
						case 'help':
							bot.chat('/w ' + botowner + ' ' + 'คำสั่งทั้งหมด: [ sudo, disconnect, drop, dump, equip, experience, fish, snipe, food, health ]')
							bot.chat('/w ' + botowner + ' ' + 'คำสั่งทั้งหมด (ต่อ): [ help, inventory, item_activate, item_deactivate, locate, look, ping ]')
							bot.chat('/w ' + botowner + ' ' + 'คำสั่งทั้งหมด (ต่อ): [ route_to, route_stop ]')
							break;
						case 'inventory':
							bot.chat('/w ' + botowner + ' ' + JSON.stringify(bot.inventory));
							break;
						case 'item_activate':
							bot.activateItem();
							break;
						case 'item_deactivate':
							bot.deactivateItem();
							break;
						case 'locate':
							bot.chat('/w ' + botowner + ' ' + `ตอนนี้เราอยู่ที่: ${JSON.stringify(bot.entity.position)}`);
							break;
						case 'look':
							var dir = {
								yaw: parseFloat(args[2]),
								pitch: parseFloat(args[3])
							};
							if (dir.yaw == null || dir.pitch == null || isNaN(dir.yaw) || isNaN(dir.pitch))
								return bot.chat('/w ' + botowner + ' ' + 'ไม่รู้จักเลขนี้นะ');
							bot.look(dir.yaw, dir.pitch, true, function () {
								bot.chat('/w ' + botowner + ' ' + `ตอนนี้กำลังมองที่ ${JSON.stringify(dir)}`);
							});
							break;
						case 'ping':
							bot.chat('/w ' + botowner + ' ' + 'เรายังอยู่ดีจ้า!');
							break;
						case 'route_to':
							if (args[2] == 'me' || args[2] == 'here') {
								var target = bot.players[username].entity;
								bot.navigate.to(target.position);
								break;
							} else {
								var dest = {
									x: parseFloat(args[2]),
									y: parseFloat(args[3]),
									z: parseFloat(args[4])
								};
								if (dest.x == null || dest.y == null || dest.z == null || isNaN(dest.x) || isNaN(dest.y) || isNaN(dest.z))
									return bot.chat('/w ' + botowner + ' ' + 'ที่นี่ที่ไหนหรอ?');
								bot.navigate.to(v(dest.x, dest.y, dest.z));
								break;
							}
							case 'route_stop':
								bot.navigate.stop();
								break;
							default:
								console.log(args)
								bot.chat('/w ' + botowner + ' ' + 'ไม่รู้จักคำสั่งนี้');
					}
				}
			});

			bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn))
			bot.on('error', (err) => reject(err))
			setTimeout(() => reject(Error('Took too long to spawn.')), 5000) // 5 sec
		}, config.interval * ix)
	})
}


async function main() {
	const file = await readFile(config.file)
	const accounts = file.split(/\r?\n/)
	const botProms = accounts.map(makeBot)
	const bots = (await Promise.allSettled(botProms)).map(({
		value,
		reason
	}) => value || reason).filter(value => !(value instanceof Error))
	console.log(`All bots has successfully logged on!`)
}

main()

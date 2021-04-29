/*
 * แจกฟรี ห้ามนำไปขาย
 * สำหรับเซิร์ฟเวอร์ mc-zero.net (GUI22)
 * Hazuki-san (Hoap) 2021
 * r0neko | Code Quality CHECK!
 * Mxnuuel (Lemres) | Extra Help!
 */

// Packages
const util = require('util')
const async = require('async');
const math = require('mathjs');
const v = require('vec3');

// Config
const fs = require('fs')
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);

// Setting stuff up
const host = data["ip"];
const port = data["port"];
const version = data["version"];
const altsfiles = data["alt_txt"];
const authme = data["authme_pw"];
const botowner = data["botowner"]
const interval = data["interval"];

// Mineflayer
const mineflayer = require('mineflayer')
const autoeat = require('mineflayer-auto-eat')
const {
	pathfinder,
	Movements,
	goals: {
		GoalBlock,
		GoalNear
	}
} = require('mineflayer-pathfinder')

const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8')
const wrap = module.exports.wrap = cb => new Promise(resolve => cb(resolve));

function makeBot(_u, ix) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			// Initialize bot
			const bot = mineflayer.createBot({
				username: _u,
				host: host,
				port: port,
				version: version
			})
			const mcData = require('minecraft-data')(bot.version)
			const defaultMove = new Movements(bot, mcData)
			console.log("Loaded: " + _u)

			// Plugins Load
			bot.loadPlugin(pathfinder)
			bot.loadPlugin(autoeat)

			bot.once('spawn', () => {
				bot.chat('/login ' + authme)
				bot.pathfinder.setMovements(defaultMove)
				bot.pathfinder.setGoal(new GoalBlock(28, 68, 0))
				bot.on('goal_reached', (goal) => {
					// โดด เพราะเหมือนเซิร์ฟค้างหรือเปล่า? ไม่แน่ใจ
					bot.setControlState('jump', true)
					bot.setControlState('jump', false)
				})
			})

			// Chat Pattern
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

			// Initialize GUI to go to
			function goGUI22() {
				setTimeout(bot.activateItem, 500);
				bot.on('windowOpen', async (window) => {
					window.requiresConfirmation = false // fix
					await bot.clickWindow(22, 0, 0)
				})
			}

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
					while (running) {
						await wrap(res => bot.equip(
							//bot.inventory.findInventoryItem(mcData.itemsByName.fishing_rod.id),
							bot.inventory.findInventoryItem(346),
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
								//if (packet.particleId === 4 && packet.particles === 6 && pos.distanceTo(new v(packet.x, pos.y, packet.z)) <= 0.3) res();
								if (packet.particleId === 4 && packet.particles === 6) res();
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
			})

			/*
			 * โค้ตแชท
			 */
			bot.on('chat', function (username, message) {
				if (username == bot.username) return; //ถ้าตรงกับชื่อตัวเอง อย่าสนใจ
				if (!botowner.includes(username)) return; // ถ้าไม่ใช่เจ้าของบอท อย่าสนใจ

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
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'จะให้พิมพ์ว่าอะไรหรอ 555');});
							bot.chat(args.slice(2).join(" "))
							break;
						case 'disconnect':
							bot.quit();
							break;
						case 'drop':
							try {
								bot.toss(parseInt(args[2]), null, (args[3]) ? parseInt(args[3]) : 1, function (err) {
									if (!err)
										botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'โยนของให้แล้วนะ');});
									else
										botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + err.message);});
								});
							} catch (e) {
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่รู้จักสิ่งนี้อ่ะ');});
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
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + `กำลังโยนของทั้งหมด ${items.length} ออกจากตัว`);});
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
								if (!err) botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ใส่ให้แล้วนะ');});
								else botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + err.message);});
							})
						case 'experience':
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เลเวลตอนนี้: ' + bot.experience.level);});
							break;
						case 'fish':
							var startFishing = function () {
								fishing = true;
								fish();
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เริ่มตกปลาแล้ว จะได้ปลาเยอะมั้ยนะ?');});
							};
							var stopFishing = function () {
								fishing = false;
								bot.activateItem();
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เลิกตกปลาแล้ว');});
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
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'พวกมันพิมพ์ไม่ทันแน่ 5555');});
							};
							var stopSniping = function () {
								sniping = false;
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'อะไรอ่ะ กำลังสนุกอยู่เลย ปิดซะล่ะ :<');});
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
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'หลอดอาหาร: ' + bot.food + '/20');});
							break;
						case 'health':
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'หลอดเลือด: ' + bot.health + '/20');});
							break;
						case 'help':
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'คำสั่งทั้งหมด: [ sudo, disconnect, drop, dump, equip, experience, fish, snipe, food, health ]')});
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'คำสั่งทั้งหมด (ต่อ): [ help, inventory, item_activate, item_deactivate, locate, look, ping ]')});
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'คำสั่งทั้งหมด (ต่อ): [ route_to, route_stop ]')});
							break;
						case 'inventory':
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + JSON.stringify(bot.inventory));});
							break;
						case 'item_activate':
							bot.activateItem();
							break;
						case 'item_deactivate':
							bot.deactivateItem();
							break;
						case 'locate':
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + `ตอนนี้เราอยู่ที่: ${JSON.stringify(bot.entity.position)}`);});
							break;
						case 'look':
							var dir = {
								yaw: parseFloat(args[2]),
								pitch: parseFloat(args[3])
							};
							if (dir.yaw == null || dir.pitch == null || isNaN(dir.yaw) || isNaN(dir.pitch))
								return botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่รู้จักเลขนี้นะ');});
							bot.look(dir.yaw, dir.pitch, true, function () {
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + `ตอนนี้กำลังมองที่ ${JSON.stringify(dir)}`);});
							});
							break;
						case 'ping':
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เรายังอยู่ดีจ้า!');});
							break;
						case 'route_to':
							if (args[2] == 'me' || args[2] == 'here') {
								var target = bot.players[username].entity;
								bot.pathfinder.setMovements(defaultMove)
								bot.pathfinder.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 1))
								break;
							} else {
								var dest = {
									x: parseFloat(args[2]),
									y: parseFloat(args[3]),
									z: parseFloat(args[4])
								};
								if (dest.x == null || dest.y == null || dest.z == null || isNaN(dest.x) || isNaN(dest.y) || isNaN(dest.z))
									return botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ที่นี่ที่ไหนหรอ?');});
								bot.pathfinder.setMovements(defaultMove)
								bot.pathfinder.setGoal(new GoalBlock(dest.x, dest.y, dest.z))
								break;
							}
							case 'route_stop':
								bot.pathfinder.setGoal(null)
								break;
							default:
								console.log(args)
								botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่รู้จักคำสั่งนี้');});
					}
				}
			});

			bot.on('health', () => {
				if (bot.food === 20) bot.autoEat.disable()
				// Disable the plugin if the bot is at 20 food points
				else bot.autoEat.enable() // Else enable the plugin again
			})

			bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn))
			bot.on('error', (err) => reject(err))
			setTimeout(() => reject(Error('Took too long to spawn.')), 5000) // 5 sec
		}, interval * ix)
	})
}


async function main() {
	const file = await readFile(altsfiles)
	const accounts = file.split(/\r?\n/)
	const botProms = accounts.map(makeBot)
	const bots = (await Promise.allSettled(botProms)).map(({
		value,
		reason
	}) => value || reason).filter(value => !(value instanceof Error))
	console.log(`All bots has successfully logged on!`)
}

main()

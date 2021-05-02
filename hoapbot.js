/*
 * แจกฟรี ห้ามนำไปขาย
 * สำหรับเซิร์ฟเวอร์ mc-zero.net (GUI22)
 * Hazuki-san (Hoap) 2021
 * r0neko | Code Quality CHECK!
 * Mxnuuel (Lemres) | Extra Help!
 */

// Packages
const async = require('async');
const math = require('mathjs');
const v = require('vec3');
const fs = require('fs')

// Config
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8')

// Setting stuff up
const host = data["ip"];
const port = data["port"];
const version = data["version"];
const authme = data["authme_pw"];
const botowner = data["botowner"]
const events = require('events').EventEmitter.defaultMaxListeners = Infinity // Call me CRAZYCHAMP

// Mineflayer
const mineflayer = require('mineflayer')
const autoeat = require('mineflayer-auto-eat')
const pvp = require('mineflayer-pvp').plugin
const collectb = require('mineflayer-collectblock').plugin
const Item = require('prismarine-item')(version)
//const armorManager = require('mineflayer-armor-manager')
const {
	pathfinder,
	Movements,
	goals: {
		GoalBlock,
		GoalNear,
		GoalFollow
	}
} = require('mineflayer-pathfinder')

const wrap = module.exports.wrap = cb => new Promise(resolve => cb(resolve));

const botName = process.argv[2]
makeBot(botName)

function makeBot(username) {
	// Initialize bot
	const bot = mineflayer.createBot({
		username: username,
		host: host,
		port: port,
		version: version
	})
	const mcData = require('minecraft-data')(bot.version)
	const defaultMove = new Movements(bot, mcData)
	console.log("Loaded: " + username)

	// Plugins Load
	//bot.loadPlugin(armorManager);
	bot.loadPlugin(pathfinder)
	bot.loadPlugin(autoeat)
	bot.loadPlugin(pvp)
	bot.loadPlugin(collectb)
	bot.autoEat.enable()

	bot.once('spawn', () => {
		bot.chat('/login ' + authme)
		bot.pathfinder.setMovements(defaultMove)
		bot.pathfinder.setGoal(new GoalBlock(28, 68, 0))
		bot.once('goal_reached', (goal) => {
		// โดด เพราะเหมือนเซิร์ฟค้างหรือเปล่า? ไม่แน่ใจ
			bot.setControlState('jump', true)
			bot.setControlState('jump', false)
		})
	})

	// Chat Pattern
	bot.addChatPattern(
		'nowplayingdetected',
		/(ตอนนี้กำลังเล่นเพลง)/,
	)

	bot.addChatPattern(
		"chatreactiondetected",
		/CHATGAME » ใครพิมพ์คำว่า (.*) เสร็จก่อนชนะ!/,
		{ parse: true }
	)

	bot.addChatPattern(
		'clearlagged',
		/ระบบได้ทำการลบเก็บขยะจำนวน (.*) ชิ้น/,
		{ parse: true }
	)

	bot.addChatPattern(
		'server',
		/✭ (.*) ┇ (.*) ┇ \((.+)\) (.*) » (.*)/,
		{ parse: true }
	)

	bot.addChatPattern(
		'serverwhipser',
		/\[\((.*)\) (.+) -» me\] (.+)/,
		{ parse: true }
	)

	bot.addChatPattern(
		'autosell_complete',
		/ทั้งหมด ขายได้ราคา (.*) /,
		{ parse: true }
	)

	// Initialize GUI to go to
	function goGUI22() {
		setTimeout(bot.activateItem, 500);
		bot.once('windowOpen', async (window) => {
			window.requiresConfirmation = false // fix
			await bot.clickWindow(22, 0, 0)
		})
	}

	const NowPlaying = () => {
		// รู้แล้วว่าอยู่ในล็อบบี้ งั้นไปกันเลย!
		setTimeout(goGUI22, 500);
	}

	bot.on('chat:nowplayingdetected', NowPlaying)

	/*
	 * dumping
	*/
	var dumping = false;
	var dumpAll = function(number) {
		if (!dumping) return;
		const excludedItems = data["excluded_items"]
		const item = bot.inventory.items().find(item => !excludedItems.includes(item.name))
		if (item) {
			bot.tossStack(item).then(() => {
					setTimeout(dumpAll)
				}
			).catch(err => {
					console.log(err)
					setTimeout(dumpAll, 100)
				}
			)
		} else {
			dumping = false
			botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เลิกโยนของแล้ว');});
		}
	};

	/*
	* clickwindow
	*/
	var waitingwindow = false;
	var checkwindow = function(number) {
		if (!waitingwindow) return;
		bot.once('windowOpen', async (window) => {
			window.requiresConfirmation = false // fix
			await bot.clickWindow(parseInt(number), 0, 0)
			bot.closeWindow(window);
			botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'กดให้แล้วนะ แล้วก็ปิดหน้าต่างให้แล้ว');});
			waitingwindow = false
		})
	};

	/*
	 * Mob Spawn
	*/
	var farmingmob = false;
	var killingmob = function() {
		if (!farmingmob) return;
		var sword = bot.inventory.items().find(item => item.name.includes('sword'))
		if (sword) bot.equip(sword, 'hand')
		bot.pvp.movements = false
		setInterval(() => {
	        const mobFilter = e => e.type === 'mob' && (e.mobType === 'Spider' || e.mobType === 'Cave Spider')
	        const mob = bot.nearestEntity(mobFilter)

	        if (!mob) return;

	        const pos = mob.position;
	        bot.lookAt(pos, true, () => {
	            bot.pvp.attack(mob);
	        });
	    }, 750);
	}

	/*
	 * SNIPER
	*/
	var sniping = false;
	var snipe = function() {
		if (!sniping) return;
		bot.on("chat:chatreactiondetected", matches => {
			setTimeout(function () {
				bot.chat(`${matches}`) // ตรงๆแม่นๆ แน่นอนจริงๆ
			}, Math.floor(Math.random() * (Math.floor(data["rmax"]) - Math.ceil(data["rmin"])) + Math.ceil(data["rmin"])));
		});
	};

	var sniping = false;
	var snipe = function() {
		if (!sniping) return;
		bot.on('chatreactiondetected', matches => {
			setTimeout(function () {
				bot.chat(`${matches}`) // ตรงๆแม่นๆ แน่นอนจริงๆ
			}, Math.floor(Math.random() * (Math.floor(data["rmax"]) - Math.ceil(data["rmin"])) + Math.ceil(data["rmin"])));
		});
	};

	var farming = false;
	var farm = function() {
		if (!farming) return;
		function collectPumpkin() {
		  // Find a nearby pumpkin block
		  const pumpkin = bot.findBlock({
		    matching: mcData.blocksByName.pumpkin.id,
		    maxDistance: 64
		  })

		  if (pumpkin) {
		    // If we found one, collect it.
		    bot.collectBlock.collect(pumpkin, err => {
		      if (err) // Handle errors, if any
		        console.log(err)
		      else
		        collectGrass() // Collect another pumpkin block
		    })
		  }
		}

		function blockToHarvest () {
			return bot.findBlock({
		    	point: bot.entity.position,
		    	maxDistance: 3,
		    	matching: (block) => {
		    		return block && block.type === mcData.blocksByName.pumpkin.id
		    	}
			})
		}

		async function loop () {
		  try {
		    while (1) {
		      const toHarvest = blockToHarvest()
		      if (toHarvest) {
		        await bot.dig(toHarvest)
		      } else {
		        break
		      }
		    }
		  } catch (e) {
		    console.log(e)
		  }

		  // No block to harvest or sow. Postpone next loop a bit
		  setTimeout(function () {
		  	loop()
		  	collectPumpkin()
		  }, 1000)
		}
		loop()
	}

	/*
	 * โค้ตตกปลา
	 */
	var fishing = false;
	/*
	var fish = async function () {
		if (!fishing) return;
		try {
    		await bot.equip(mcData.itemsByName.fishing_rod.id, 'hand')
  		} catch (err) {
    		return console.log(err.message)
  		}

		nowFishing = true
		try {
		    await bot.fish()
		    fish()
		} catch (err) {
		    console.log(err.message)
		}
		nowFishing = false

		bot.on('chat:clearlagged', matches => {
			bot.activateItem();
			fish();
		});
	}
	*/
	var fish = function () {
		// ClearLag Fix
		if (!fishing) return;
		bot.on('chat:clearlagged', matches => {
				bot.activateItem();
				fish();
		});

		let bobberId = 90
		// 1.14+ Fix
		if (bot.supportFeature('fishingBobberCorrectlyNamed')) {
			bobberId = mcData.entitiesByName.fishing_bobber.id
		}

		let running = true;
		(async () => {
			while (running) {
				await wrap(res => bot.equip(
					bot.inventory.findInventoryItem(mcData.itemsByName.fishing_rod.id),
					'hand',
					res
				));

				let bobber = await wrap(res => {
					let onSpawn = entity => {
						if (entity.entityType !== bobberId) return;
						bot.once('entitySpawn', onSpawn);
						// bot = 256
						// bobber = 257.23
						// bobber > bot
						// bot < bobber
						if (entity.position.z < 0) {
							if ((entity.position.z-1.23) >= bot.entity.position.z && (entity.position.z-1.23) <= bot.entity.position.z) res(entity);
						} else {
							if ((entity.position.z+1.23) >= bot.entity.position.z && (entity.position.z+1.23) <= bot.entity.position.z) res(entity);
						}
						return;
					}

					bot.once('entitySpawn', onSpawn);
					bot.activateItem();
				});

				console.log(bot.username + ": I found a bobber!")
				console.log(bot.username + ": Here's some info about it!")
				if (bobber.position.z < 0) {
					console.log(bot.username + "'s Bob Z: " + (bobber.position.z-0.15625))
					console.log(bot.username + "'s Bot Z: " + bot.entity.position.z)
				} else {
					console.log(bot.username + "'s Bob Z: " + (bobber.position.z+0.15625))
					console.log(bot.username + "'s Bot Z: " + bot.entity.position.z)
				}

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
						if (packet.particleId === 4 && packet.particles === 6 && pos.distanceTo(new v(packet.x, pos.y, packet.z)) <= 0.3) res();
						bot._client.once('world_particles', onParticles);
					}
					bot._client.once('world_particles', onParticles)
				});
				await bot.activateItem();
				await sleep(500)
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
	bot.on('chat:serverwhipser', async matches => {
		let rank = matches[0][0] // Rank
		let username = matches[0][1] // Username
		let message = matches[0][2] // Message
		if (username == bot.username) return; //ถ้าตรงกับชื่อตัวเอง อย่าสนใจ
		if (!botowner.includes(username)) return; // ถ้าไม่ใช่เจ้าของบอท อย่าสนใจ

		try {
			var result = math.eval(message);
			if (result != null && result != undefined)
			bot.chat(result + '');
		} catch (e) {}

		var args = message.split(' ');
		if (args[0].toLowerCase() == "!bot") {
			var command = args[1].toLowerCase();
			switch (command) {
				case 'sudo':
					if (args.slice(2).join(" ") == "")
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'จะให้พิมพ์ว่าอะไรหรอ 555');});
					bot.chat(args.slice(2).join(" "))
					break;
				case 'clear_armor':
					//ugly but hey it works?
					await bot.unequip("head")
					await bot.unequip("torso")
					await bot.unequip("legs")
					await bot.unequip("feet")
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เอาออกหมดแล้ว');});
					break;
				case 'gear_up':
					var checkItemEquiped = function (itemArmor) {
							let swordEquiped, isSword, bowEquiped, isBow
							let slotID
							switch (itemArmor) {
								case 'helmet':
									slotID = 5
									break;
								case 'chestplate':
									slotID = 6
									break
								case 'leggings':
									slotID = 7
									break
								case 'boots':
									slotID = 8
									break
								case 'shield':
									slotID = 45
									break
								case 'sword':
									slotID = bot.getEquipmentDestSlot('hand')
									swordEquiped = bot.inventory.slots[slotID]
									if (swordEquiped === null) { return false }
									isSword = swordEquiped.name.includes('sword')
									return isSword
								case 'bow':
									slotID = bot.getEquipmentDestSlot('hand')
									bowEquiped = bot.inventory.slots[slotID]
									if (bowEquiped === null) { return false }
									isBow = bowEquiped.name.includes('bow')
									return isBow
								default:
									return false
							}
							return bot.inventory.slots[slotID] !== null
					}

					var equipItem = function (itemArmor) {
						return new Promise((resolve, reject) => {
							if (checkItemEquiped(itemArmor)) {
								//console.log("checking checked")
								resolve()
								return
							}

							const armor = bot.inventory.items().find(item => item.name.includes(itemArmor))

							if (!armor) {
								//console.log("no armor checked")
								resolve()
								return
							}

							let location
							switch (itemArmor) {
								case 'helmet':
									location = 'head'
									break;
								case 'chestplate':
									location = 'torso'
									break;
								case 'leggings':
									location = 'legs'
									break;
								case 'boots':
									location = 'feet'
									break;
								case 'sword':
									location = 'hand'
									break;
								case 'shield':
									location = 'off-hand'
									break;
							}
							bot.equip(armor, location, (error) => {
								if (error === undefined) {
									//console.log("equip checked")
									resolve()
								}
								reject(error)
							})
						})
					}
					await equipItem("helmet");
					await equipItem("chestplate");
					await equipItem("leggings");
					await equipItem("boots");
					await equipItem("shield");
					await equipItem("sword");
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'พร้อม!');});
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
					var startDumping = function () {
						dumping = true;
						dumpAll();
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'กำลังโยนของทั้งหมดที่มี...');});
							};
							var stopDumping = function () {
						dumping = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เลิกโยนของแล้ว');});
					};
					var toggleDumping = function () {
						if (!dumping) startDumping();
						else stopDumping();
					};

					if (args[2] == 'start') startDumping();
					else if (args[2] == 'stop') stopDumping();
					else toggleDumping();
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
				case 'farm':
					var startFarming = function () {
						farming = true;
						farm();
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เริ่มตกปลาแล้ว จะได้ปลาเยอะมั้ยนะ?');});
					};
					var stopFarming = function () {
						farming = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เลิกตกปลาแล้ว');});
					};
					var toggleFarming = function () {
						if (!fishing) startFarming();
						else stopFarming();
					};

					if (args[2] == 'start') startFarming();
					else if (args[2] == 'stop') stopFarming();
					else toggleFarming();
					break;
				case 'mob_test':
					var startMobFarm = function () {
						farmingmob = true;
						killingmob();
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'XXXXXXXX');});
					};
					var stopMobFarm = function () {
						farmingmob = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'DDDDDDDDD');});
					};
					var toggleFarm = function () {
						if (!farmingmob) startMobFarm();
						else stopMobFarm();
					};

					if (args[2] == 'start') startMobFarm();
					else if (args[2] == 'stop') stopMobFarm();
					else toggleFarm();
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
				case 'follow':
					if (args[2] == 'me') {
						try {
								var target = bot.players[username].entity;
								if (target != null && target != undefined)
								bot.pathfinder.setMovements(defaultMove)
								bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
								bot.lookAt(target.position.plus(v(0, 1.62, 0)));
							} catch (e) {botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เหมือนว่าจะไม่ได้อยู่ในระยะนี้นะ...');}); return}
					} else {
						try {
							var target = bot.players[args[2]].entity;
							if (target != null && target != undefined)
							bot.pathfinder.setMovements(defaultMove)
							bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
							bot.lookAt(target.position.plus(v(0, 1.62, 0)));
						} catch (e) {botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เหมือนว่าจะไม่ได้อยู่ในระยะนี้นะ...');}); return}
					}
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เรากำลังตามอยู่นะ นำทางเลย!');});
					break;
				case 'fight':
					if (args[2] == 'me') {
						var fighter = bot.players[username]
						if (!fighter) {
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่เจอนะ');});
							return
						}
						var sword = bot.inventory.items().find(item => item.name.includes('sword'))
						if (sword) bot.equip(sword, 'hand')
						bot.pvp.attack(fighter.entity)
					} else {
						var fighter = bot.players[args[2]]
						if (!fighter) {
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่เจอนะ');});
							return
						}
						var sword = bot.inventory.items().find(item => item.name.includes('sword'))
						if (sword) bot.equip(sword, 'hand')
						bot.pvp.attack(fighter.entity)
					};
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ได้! เดียวจัดการให้!');});
					break;
				case 'fight_stop':
					bot.pvp.stop()
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'พอละๆ');});
					break;
				case 'click_window':
					var startClicking = function () {
						waitingwindow = true;
						checkwindow(args[3]);
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'กำลังรอ... หากพร้อมจะคลิกหมายเลข '+args[3]+' ทันที');});
					};
					var stopClicking = function () {
						waitingwindow = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ยกเลิกการคลิกแล้ว');});
					};
					var toggleClicking = function () {
						if (!fishing) startFishing();
						else stopFishing();
					};

					if (args[2] == 'start') startClicking();
					else if (args[2] == 'stop') stopClicking();
					else toggleClicking();
					break;
				case 'follow_stop':
					bot.pathfinder.setGoal(null)
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
					console.log(bot.username + ': ' + JSON.stringify(bot.inventory));
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
					}
					break;
				case 'route_stop':
					bot.pathfinder.setGoal(null)
					break;
				default:
					console.log(args)
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่รู้จักคำสั่งนี้');});
			}
		}
	})

	bot.on('chat:server', async matches => {
		let level = matches[0][0] // Level (+Marry)
		let gang = matches[0][1] // Gang
		let rank = matches[0][2] // Rank
		let username = matches[0][3] // Username
		let message = matches[0][4] // Message
		if (username == bot.username) return; //ถ้าตรงกับชื่อตัวเอง อย่าสนใจ
		if (!botowner.includes(username)) return; // ถ้าไม่ใช่เจ้าของบอท อย่าสนใจ

		try {
			var result = math.eval(message);
			if (result != null && result != undefined)
			bot.chat(result + '');
		} catch (e) {}

		var args = message.split(' ');
		if (args[0].toLowerCase() == "!all") {
			var command = args[1].toLowerCase();
			switch (command) {
				case 'sudo':
					if (args.slice(2).join(" ") == "")
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'จะให้พิมพ์ว่าอะไรหรอ 555');});
					bot.chat(args.slice(2).join(" "))
					break;
				case 'clear_armor':
					//ugly but hey it works?
					await bot.unequip("head")
					await bot.unequip("torso")
					await bot.unequip("legs")
					await bot.unequip("feet")
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เอาออกหมดแล้ว');});
					break;
				case 'gear_up':
					var checkItemEquiped = function (itemArmor) {
							let swordEquiped, isSword, bowEquiped, isBow
							let slotID
							switch (itemArmor) {
								case 'helmet':
									slotID = 5
									break;
								case 'chestplate':
									slotID = 6
									break
								case 'leggings':
									slotID = 7
									break
								case 'boots':
									slotID = 8
									break
								case 'shield':
									slotID = 45
									break
								case 'sword':
									slotID = bot.getEquipmentDestSlot('hand')
									swordEquiped = bot.inventory.slots[slotID]
									if (swordEquiped === null) { return false }
									isSword = swordEquiped.name.includes('sword')
									return isSword
								case 'bow':
									slotID = bot.getEquipmentDestSlot('hand')
									bowEquiped = bot.inventory.slots[slotID]
									if (bowEquiped === null) { return false }
									isBow = bowEquiped.name.includes('bow')
									return isBow
								default:
									return false
							}
							return bot.inventory.slots[slotID] !== null
					}

					var equipItem = function (itemArmor) {
						return new Promise((resolve, reject) => {
							if (checkItemEquiped(itemArmor)) {
								//console.log("checking checked")
								resolve()
								return
							}

							const armor = bot.inventory.items().find(item => item.name.includes(itemArmor))

							if (!armor) {
								//console.log("no armor checked")
								resolve()
								return
							}

							let location
							switch (itemArmor) {
								case 'helmet':
									location = 'head'
									break;
								case 'chestplate':
									location = 'torso'
									break;
								case 'leggings':
									location = 'legs'
									break;
								case 'boots':
									location = 'feet'
									break;
								case 'sword':
									location = 'hand'
									break;
								case 'shield':
									location = 'off-hand'
									break;
							}
							bot.equip(armor, location, (error) => {
								if (error === undefined) {
									//console.log("equip checked")
									resolve()
								}
								reject(error)
							})
						})
					}
					await equipItem("helmet");
					await equipItem("chestplate");
					await equipItem("leggings");
					await equipItem("boots");
					await equipItem("shield");
					await equipItem("sword");
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'พร้อม!');});
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
					var startDumping = function () {
						dumping = true;
						dumpAll();
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'กำลังโยนของทั้งหมดที่มี...');});
							};
							var stopDumping = function () {
						dumping = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เลิกโยนของแล้ว');});
					};
					var toggleDumping = function () {
						if (!dumping) startDumping();
						else stopDumping();
					};

					if (args[2] == 'start') startDumping();
					else if (args[2] == 'stop') stopDumping();
					else toggleDumping();
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
				case 'farm':
					var startFarming = function () {
						farming = true;
						farm();
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เริ่มตกปลาแล้ว จะได้ปลาเยอะมั้ยนะ?');});
					};
					var stopFarming = function () {
						farming = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เลิกตกปลาแล้ว');});
					};
					var toggleFarming = function () {
						if (!fishing) startFarming();
						else stopFarming();
					};

					if (args[2] == 'start') startFarming();
					else if (args[2] == 'stop') stopFarming();
					else toggleFarming();
					break;
				case 'mob_test':
					var startMobFarm = function () {
						farmingmob = true;
						killingmob();
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'XXXXXXXX');});
					};
					var stopMobFarm = function () {
						farmingmob = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'DDDDDDDDD');});
					};
					var toggleFarm = function () {
						if (!farmingmob) startMobFarm();
						else stopMobFarm();
					};

					if (args[2] == 'start') startMobFarm();
					else if (args[2] == 'stop') stopMobFarm();
					else toggleFarm();
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
				case 'follow':
					if (args[2] == 'me') {
						try {
								var target = bot.players[username].entity;
								if (target != null && target != undefined)
								bot.pathfinder.setMovements(defaultMove)
								bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
								bot.lookAt(target.position.plus(v(0, 1.62, 0)));
							} catch (e) {botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เหมือนว่าจะไม่ได้อยู่ในระยะนี้นะ...');}); return}
					} else {
						try {
							var target = bot.players[args[2]].entity;
							if (target != null && target != undefined)
							bot.pathfinder.setMovements(defaultMove)
							bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
							bot.lookAt(target.position.plus(v(0, 1.62, 0)));
						} catch (e) {botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เหมือนว่าจะไม่ได้อยู่ในระยะนี้นะ...');}); return}
					}
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'เรากำลังตามอยู่นะ นำทางเลย!');});
					break;
				case 'fight':
					if (args[2] == 'me') {
						var fighter = bot.players[username]
						if (!fighter) {
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่เจอนะ');});
							return
						}
						var sword = bot.inventory.items().find(item => item.name.includes('sword'))
						if (sword) bot.equip(sword, 'hand')
						bot.pvp.attack(fighter.entity)
					} else {
						var fighter = bot.players[args[2]]
						if (!fighter) {
							botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่เจอนะ');});
							return
						}
						var sword = bot.inventory.items().find(item => item.name.includes('sword'))
						if (sword) bot.equip(sword, 'hand')
						bot.pvp.attack(fighter.entity)
					};
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ได้! เดียวจัดการให้!');});
					break;
				case 'fight_stop':
					bot.pvp.stop()
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'พอละๆ');});
					break;
				case 'click_window':
					var startClicking = function () {
						waitingwindow = true;
						checkwindow(args[3]);
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'กำลังรอ... หากพร้อมจะคลิกหมายเลข '+args[3]+' ทันที');});
					};
					var stopClicking = function () {
						waitingwindow = false;
						botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ยกเลิกการคลิกแล้ว');});
					};
					var toggleClicking = function () {
						if (!fishing) startFishing();
						else stopFishing();
					};

					if (args[2] == 'start') startClicking();
					else if (args[2] == 'stop') stopClicking();
					else toggleClicking();
					break;
				case 'follow_stop':
					bot.pathfinder.setGoal(null)
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
					console.log(bot.username + ': ' + JSON.stringify(bot.inventory));
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
					}
					break;
				case 'route_stop':
					bot.pathfinder.setGoal(null)
					break;
				default:
					console.log(args)
					botowner.forEach(function(ownerlist) { bot.chat('/w ' + ownerlist + ' ' + 'ไม่รู้จักคำสั่งนี้');});
			}
		}
	})
	bot.on('death', function() {bot.emit("respawn")});
	bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn))
	bot.on('error', (err) => reject(err))
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

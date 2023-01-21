//-------------------------
// First author: Gnuton
// Modified by: Hossein Abedi
// Why: Gnuton's source code only runs in browser. Now, we do not need any browser and it can run only with node.js.
//-------------------------

// Mixamo Animation downloadeer
// The following script make use of mixamo2 API to download all anims for a single character that you choose.
// The animations are saved with descriptive long names instead of the short ones used by default by mixamo UI.
//
//  This script has been written by gnuton@gnuton.org and the author is not responsible of its usage
//
//  How to use this script
//  1. Browse mixamo.com
//  2. Log in
//  3. Open JS console (F12 on chrome)
//  4. Download an animation and get the character ID from the Network tab
//  5. Then past the character id in the "character" variable at beginning of this script
//  6. Copy and paste the full script in the mixamo.com javascript console
//  7. The script will open a new blank page.. you  will start to see animations downloading
//  8. keep the blank page opened and keep on pressing "Allow multiple downlaods" 

// NOTE. This doesn't really work for me, but it was supposed too
// Chrome will ask you all the time to allow multiple downloads
// You can disable this as follow:
// chrome://settings/ > Advanced > Content > Automatic downloads > uncheck "Do not allow any site to download multiple file automatically"


const fetch = require('node-fetch');
const http = require('http'); // or 'https' for https:// URLs
const https = require('https');
const fs = require('fs');

// CHANGE THIS VAR TO DOWNLOAD ANIMATIONS FOR A DIFFERENT CHARACTER
// const character = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const character = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const folderName = character;
if (!fs.existsSync(folderName)){
    fs.mkdirSync(folderName);
}

//=================================================================================================

const use_browser_token = false;
var bearer_string =  "MIXAMO_ACCESS_TOKEN";
var bearer = use_browser_token ? localStorage.access_token : bearer_string;

var oldAnimId = ""
var onlyPrintDownloadLinkInConsole = false;


const generate_file_name = (characterId, product_name, animId) => {
    const clean_product_name = product_name.replace(/[.\W_]+/g," ");
    let fileName = characterId + '@' + clean_product_name + '-' + animId + '.fbx';
    const filePath = folderName + '/' + fileName;
    console.log('FileName: ', filePath);
    return filePath;
}

const getAnimationList = (page) => {
    console.log('getAnimationList page=', page);
    const init = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer}`,
            'X-Api-Key': 'mixamo2'
        }
    };

    const listUrl = `https://www.mixamo.com/api/v1/products?page=${page}&limit=96&order=&type=Motion%2CMotionPack&query=`;
    console.log(listUrl);
    return fetch(listUrl, init).then((res) => res.json()).then((json) => json).catch(() => Promise.reject('Failed to download animation list'))
}

// retrieves json.details.gms_hash 
const getProduct = (animId, character) => {
    console.log('getProduct animId=', animId, ' character=', character);
    const init = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer}`,
            'X-Api-Key': 'mixamo2'
        }
    };

    const productUrl = `https://www.mixamo.com/api/v1/products/${animId}?similar=0&character_id=${character}`;
    return fetch(productUrl, init).then((res) => res.json()).then((json) => json).catch(() => Promise.reject('Failed to download product details'))
}

const mydownload = (animId) => {
	var CharacterProm;
	CharacterProm = getProduct(animId, character).then((json) => json.name);
	CharacterProm.then(function(result) {
		downloadAnimation(animId, character, result)
	})
	
}

const downloadAnimation = (animId, character, product_name) => {

    // if file exists, we assume that the animation is already downloaded!
    const characterId = character;
    const filePathToWrite = generate_file_name(characterId, product_name, animId);
    if (fs.existsSync(filePathToWrite))
    {
        return Promise.resolve('This animation is already downloaded!');
    }

    console.log('downloadAnimation animId=', animId, ' character=', character, ' prod name=', product_name);
    // skip packs
    if (product_name.indexOf(',') > -1) {
        console.log('Skipping pack ', product_name);
        return Promise.resolve('Skip pack!');
    } else {
        return getProduct(animId, character)
                .then((json) => json.details.gms_hash)
                .then((gms_hash) => {
                    const pvals = gms_hash.params.map((param) => param[1]).join(',')
                    const _gms_hash = Object.assign({}, gms_hash, { params: pvals }) // Anim is baked with default param values
                    return exportAnimation(character, [_gms_hash], product_name)
                })
                .then((json) => monitorAnimation(character,animId, product_name))
                .catch(() => Promise.reject("Unable to download animation " + animId))
    }
}

const downloadAnimLoop = (o) => {
    console.log('-----------------------------------------------------------------------');
    console.log('-------------------------- downloadAnimLoop ---------------------------');
    console.log('-----------------------------------------------------------------------');
    if (!o.anims.length) {
        return downloadAnimsInPage(o.currentPage + 1, o.totPages, o.character); // no anims left, get a new page
    }
    
    const head = o.anims[0];
    const tail = o.anims.slice(1);
    const oldvalue = o.anims

    return downloadAnimation(head.id, o.character, head.name)
        .then(() => {
		o.anims = tail;
		downloadAnimLoop(o) //loop

		})
        .catch(() => {
		    if(getProduct(head.id, o.character).then((json) => json.type=="MotionPack")){
			    o.anims = tail;
				console.log("Skipping MotionPack");
			}else{
				o.anims = oldvalue
				console.log("Recovering from animation failed to download");
			}

            return downloadAnimLoop(o) // keep on looping 
        })
}


var downloadAnimsInPage = (page, totPages, character) => {
    console.log('downloadAnimsInPage page=', page, ' totPages', totPages, ' character=', character);
    if (page >= totPages) {
        console.log('All pages have been downloaded');
        return Promise.resolve('All pages have been downloaded');
    }

    return getAnimationList(page)
        .then((json) => (
            {
                anims: json.results,
                currentPage: json.pagination.page,
                totPages: json.pagination.num_pages,
                character
            }))
        .then((o) => downloadAnimLoop(o))
        .catch((e) => Promise.reject("Unable to download all animations error ", e))
}

const start = () => {
    console.log('start');
    if (!character) {
        console.error("Please add a valid character ID at the beginnig of the script");
        return
    }
    downloadAnimsInPage(1, 110, character);
}

const exportAnimation = (character_id, gmsHashArray, product_name) => {
    console.log('Exporting Anim´:' + character_id + " to file:" + product_name)
    gmsHashArray[0].inplace = true; 
    const exportUrl = 'https://www.mixamo.com/api/v1/animations/export'
    const exportBody = {
        character_id,
        gms_hash: gmsHashArray, //[{ "model-id": 103120902, "mirror": false, "trim": [0, 100], "overdrive": 0, "params": "0", "arm-space": 0, "inplace": false }],
        preferences: { format: "fbx7_2014", skin: "false", fps: "60", reducekf: "0" }, // To download collada use format: "dae_mixamo"
        product_name,
        type: "Motion"
    };
    const exportInit = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer}`,
            'X-Api-Key': 'mixamo2',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(exportBody)
    }
	return fetch(exportUrl, exportInit)
			.then((res) => {
				switch (res.status) {
					case 429:{
						//console.log('ERROR 429, Too many requests, looping');
						sleep(1250)
						return exportAnimation(character_id, gmsHashArray, product_name);
					} break;
					default:
						res.json().then((json) => json)
				}
			})
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

let CharacterName = "";
const monitorAnimation = (characterId,animId, product_name) => {
	if (true)
	{
		const monitorUrl = `https://www.mixamo.com/api/v1/characters/${characterId}/monitor`;
		const monitorInit = {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${bearer}`,
				'X-Api-Key': 'mixamo2'
			}
		};
		
		return fetch(monitorUrl, monitorInit)
			.then((res) => {
				switch (res.status) {
					case 404: {
						const errorMsg = ('ERROR: Monitor got 404 error: ' + res.error + ' message=' + res.message);
						console.error(errorMsg);
						throw new Error(errorMsg);
					} break
					case 429:{
						//console.log('ERROR 429, Too many requests, looping');
						sleep(1250)
						return monitorAnimation(characterId,animId, product_name);
					} break;
					case 202:
					case 200: {
						return res.json()
					} break
					default:
						throw new Error('Response not handled', res);
				}
			}).then(async (msg) => {
				switch (msg.status) {
					case 'completed':
					    //console.log(getNameFromURL(msg.job_result));
						//console.log(oldAnimId+".fbx");
						
						var CharacterProm;
						CharacterProm = getProduct(animId, characterId).then((json) => json.name);
						CharacterProm.then(function(result) {
							 CharacterName=result
						});
						// console.log(msg.job_result)
						console.log(getNameFromURL(msg.job_result))
						console.log(CharacterName)
						if (getNameFromURL(msg.job_result) == CharacterName+".fbx")
						{
                            //oldAnimId = msg.job_result
							
							if(onlyPrintDownloadLinkInConsole)
                            {
								console.log(msg.job_result);
                                return msg.job_result;
                            }
							else
							{
								console.log('Downloading ', product_name);
								//downloadingTab.location.href = msg.job_result;
								await download(msg.job_result, characterId, product_name, animId);
                                console.log("download process finished.");
                                return msg.job_result;
							}
							
						}
						return monitorAnimation(characterId,animId, product_name);
						break;
					case 'processing':
						console.log('Animation is processing... looping');
						return monitorAnimation(characterId,animId, product_name);
						break;// loop
					case 'failed':
					default:
						const errorMsg = ('ERROR: Monitor status:' + msg.status + ' message:' + msg.message + 'result:' + JSON.stringify(msg.job_result));
						console.error(errorMsg);
						throw new Error(errorMsg);
				}
			}).catch((e) => Promise.reject("Unable to monitor job for character " + characterId + e))
	}
}





function getNameFromURL(url){
  const regex = /\bresponse\-content\-disposition=.*\.fbx\b/gm;
  const found = url.match(regex);
  const text = decodeURIComponent(found)
  return text.substring(51, text.length)
}



const download = (path, characterId, product_name, animId) => {
    return new Promise((resolve, reject) => {
        
        const filePath = generate_file_name(characterId, product_name, animId);

        try
        {
            const file = fs.createWriteStream(filePath);
            const request = https.get(path, function(response) {
                response.pipe(file);

                // after download completed close filestream
                file.on("finish", () => {
                    console.log("Download Completed");
                    file.close();
                    resolve( filePath );
                });

                file.on('error', (err) => { // Handle errors
                    console.log("Erron during Downloading the file!");
                    fs.unlink(dest, () => console.log(err.message)); // delete the (partial) file and then return the error
                    resolve( err.message );
                });
            });
        }
        catch(error)
        {
            console.log('ERROR: ', error, path);
        }

    });

}


const download_by_browser = (path, CharacterName, product_name) => {
    // Create a new link
    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.download = getNameFromURL(path);

    // Append to the DOM
    document.body.appendChild(anchor);

    // Trigger `click` event
    anchor.click();

    // Remove element from DOM
    document.body.removeChild(anchor);
}; 

// Workaround for downloading files from a promise
// NOTE that chrome will detect you are downloading multiple files in a single TAB. Please allow it!
//const downloadingTab = window.open('', '_blank');

start()

/* sudo_restore | v2.0 Dynamic Entropy
   Now with Randomized Puzzle Solutions on every refresh
*/

// --- DOM ELEMENTS ---
const outputDiv = document.getElementById('terminal-output');
const inputField = document.getElementById('command-input');
const terminalContainer = document.getElementById('terminal-container');

// --- GAME STATE ---
let currentPath = []; 
let commandHistory = [];
let historyIndex = -1;

// --- ENTROPY ENGINE (The RNG) ---
// 1. Generate random hex string (for Session ID)
function generateEntropy(length = 8) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
}

// 2. Pick a random item from an array (for Keywords)
function pickRandom(array) {
    const uint32 = new Uint32Array(1);
    window.crypto.getRandomValues(uint32);
    // Use modulo to pick an index
    return array[uint32[0] % array.length];
}

// --- RANDOMIZED VARIABLES ---
// These change every time you refresh the page
const sessionID = generateEntropy(6).toUpperCase();

// Puzzle 1: The Year (1980 - 1999)
const years = ["1982", "1984", "1988", "1990", "1995", "1999", "2001"];
const targetYear = pickRandom(years);

// Puzzle 2: The Codename
const codenames = ["OMEGA", "HELIOS", "ZENITH", "VORTEX", "CHRONOS", "AETHER", "PHANTOM"];
const targetCodename = pickRandom(codenames);

// --- DYNAMIC FILE SYSTEM ---
// We build this AFTER variables are picked so the content matches the keys
const fileSystem = {
    "READ_ME_FIRST.txt": {
        type: "file",
        content: `WARNING: SECTOR ${sessionID} UNSTABLE.\n\nFiles are deteriorating. I've hidden the restoration keys in the readable files. \n\nFind the keys. \nUse command: restore [filename] [key]\n\nStart by checking the 'emails' directory.`
    },
    "emails": {
        type: "dir",
        children: {
            "draft.txt": { 
                type: "file", 
                content: `To: Dr. Vance\nFrom: sys_admin\n\nI reset the password for the damage report. It's just your birth year, causing you started the company then. \n\n(Note: You told me it was ${targetYear}).` 
            },
            "spam.txt": { 
                type: "file", 
                content: "CONGRATULATIONS! You've won a new toaster. Click here to claim." 
            }
        }
    },
    "logs": {
        type: "dir",
        children: {
            "sys_boot.log": { type: "file", content: "Boot Sequence... OK.\nMounting Drives... OK." },
            "damage_report.txt": { 
                type: "file", 
                corrupted: true,
                key: targetYear, // Dynamic Key
                content: `DAMAGE ASSESSMENT:\n\nThe master key for the secure sector is '${targetCodename}'.\nRepeat: The key is ${targetCodename}.\n\nUse this to unlock the Chimera Protocol.`
            }
        }
    },
    "secure": {
        type: "dir",
        children: {
            "chimera_protocol.enc": { 
                type: "file",
                corrupted: true,
                key: targetCodename, // Dynamic Key
                content: `PROJECT CHIMERA RESTORED.\n\nSession ID: ${sessionID}\nTarget: ${targetCodename}\n\nCongratulations, Specialist.\nYou have saved the system.`
            }
        }
    }
};

// --- CORE FUNCTIONS (Unchanged from v1) ---

function getCurrentDir() {
    let current = fileSystem;
    for (const folder of currentPath) {
        if (current[folder] && current[folder].type === 'dir') {
            current = current[folder].children;
        } else if (current.children && current.children[folder]) { 
             current = current.children[folder].children;
        }
    }
    return current;
}

function triggerGlitch() {
    terminalContainer.classList.add('glitch-active');
    setTimeout(() => terminalContainer.classList.remove('glitch-active'), 500);
}

function triggerSuccess() {
    terminalContainer.classList.add('restore-success');
    setTimeout(() => terminalContainer.classList.remove('restore-success'), 500);
}

function garbleText(text) {
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~';
    return text.split('').map(char => {
        if (char === '\n' || char === ' ') return char;
        return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
}

function print(text, className = '') {
    const div = document.createElement('div');
    div.className = 'line ' + className;
    div.innerHTML = text.replace(/\n/g, '<br>');
    outputDiv.appendChild(div);
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// --- COMMAND PARSER ---

function processCommand(input) {
    if (!input) return;
    
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    print(`<span class="prompt">visitor@remote: ${getPathString()}$</span> ${input}`);

    switch (command) {
        case 'help':
            print("COMMANDS:");
            print("  ls            List files");
            print("  cd [dir]      Change directory");
            print("  cat [file]    Read file");
            print("  restore [file] [key]  Decrypt corrupted data");
            print("  clear         Clear screen");
            break;

        case 'clear':
            outputDiv.innerHTML = '';
            break;

        case 'ls':
            const dir = getCurrentDir();
            const items = currentPath.length === 0 ? fileSystem : dir;
            let output = '';
            const targetObj = (items.children) ? items.children : items;

            for (const key in targetObj) {
                const type = targetObj[key].type;
                if (type === 'dir') {
                    output += `<span style="color: #008f11">${key}/</span>&nbsp;&nbsp;`;
                } else if (targetObj[key].corrupted) {
                     output += `<span class="corrupted">${key}*</span>&nbsp;&nbsp;`;
                } else {
                    output += `${key}&nbsp;&nbsp;`;
                }
            }
            print(output || "(empty)");
            break;

        case 'cd':
            const target = args[0];
            if (!target) { print("Usage: cd [directory]"); break; }
            if (target === '..') {
                if (currentPath.length > 0) currentPath.pop();
            } else {
                const current = (currentPath.length === 0) ? fileSystem : getCurrentDir();
                const actualDir = (current.children) ? current.children : current;
                
                if (actualDir[target] && actualDir[target].type === 'dir') {
                    currentPath.push(target);
                } else {
                    print(`cd: ${target}: No such directory`);
                }
            }
            break;

        case 'cat':
            const filename = args[0];
            if (!filename) { print("Usage: cat [filename]"); break; }
            
            const currentObj = (currentPath.length === 0) ? fileSystem : getCurrentDir();
            const actualFiles = (currentObj.children) ? currentObj.children : currentObj;
            const file = actualFiles[filename];

            if (file && file.type === 'file') {
                if (file.corrupted) {
                    triggerGlitch();
                    print(`<span aria-label="Encrypted Content">${garbleText(file.content)}</span>`, 'corrupted');
                    print(`<span style="color:var(--color-alert)">SYSTEM: File corrupted. Key required.</span>`);
                } else {
                    print(file.content);
                }
            } else {
                print(`cat: ${filename}: No such file`);
            }
            break;

        case 'restore':
            const fName = args[0];
            const key = args[1];
            
            if (!fName || !key) {
                print("Usage: restore [filename] [key]");
                break;
            }

            const cDir = (currentPath.length === 0) ? fileSystem : getCurrentDir();
            const cFiles = (cDir.children) ? cDir.children : cDir;
            const targetFile = cFiles[fName];

            if (targetFile && targetFile.type === 'file') {
                if (!targetFile.corrupted) {
                    print(`File ${fName} is already stable.`);
                } else if (targetFile.key === key) {
                    targetFile.corrupted = false;
                    triggerSuccess();
                    print(`Decrypting ${fName}... SUCCESS.`);
                    print(`Data restored.`);
                    setTimeout(() => print(targetFile.content), 600);
                } else {
                    triggerGlitch();
                    print(`Access Denied: Incorrect Key.`);
                }
            } else {
                print(`Target not found.`);
            }
            break;
            
        default:
            print(`Command not found: ${command}`);
    }
}

function getPathString() {
    return currentPath.length === 0 ? "~" : "~/" + currentPath.join("/");
}

// --- INIT ---

inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const input = inputField.value;
        commandHistory.push(input);
        historyIndex = commandHistory.length;
        processCommand(input);
        inputField.value = '';
    }
});

document.addEventListener('click', () => inputField.focus());

window.onload = () => {
    setTimeout(() => print(`Initializing Secure Connection...`), 500);
    setTimeout(() => print(`Entropy Seed: ${sessionID}`), 1200);
    setTimeout(() => print(`WARNING: Data Corruption Detected.`), 2000);
    setTimeout(() => print(`Type 'ls' to scan directory.`), 2800);
    inputField.focus();
};

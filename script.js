/* sudo_restore | Final Build
   Includes: Entropy Engine, File System, Parser, and Puzzle Logic
*/

// --- DOM ELEMENTS ---
const outputDiv = document.getElementById('terminal-output');
const inputField = document.getElementById('command-input');
const terminalContainer = document.getElementById('terminal-container');

// --- GAME STATE ---
let currentPath = []; 
let commandHistory = [];
let historyIndex = -1;

// --- ENTROPY ENGINE ---
function generateEntropy(length = 8) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
}

const sessionID = generateEntropy(6).toUpperCase();

// --- THE NARRATIVE (FILE SYSTEM) ---
/* PUZZLE FLOW:
   1. Read READ_ME_FIRST.txt -> Learn about corruption.
   2. Read emails/draft.txt -> Find key "1985".
   3. restore logs/damage_report.txt 1985 -> Reveals key "AETHER".
   4. restore secure/chimera_protocol.enc AETHER -> WIN.
*/

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
                content: "To: Dr. Vance\nFrom: sys_admin\n\nI reset the password for the damage report. It's just your birth year, causing you started the company then. \n\n(Note: You told me it was 1985)." 
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
                key: "1985",
                content: "DAMAGE ASSESSMENT:\n\nThe master key for the secure sector is 'AETHER'.\nRepeat: The key is AETHER.\n\nUse this to unlock the Chimera Protocol."
            }
        }
    },
    "secure": {
        type: "dir",
        children: {
            "chimera_protocol.enc": { 
                type: "file",
                corrupted: true,
                key: "AETHER",
                content: "PROJECT CHIMERA RESTORED.\n\nEntity Containment: ACTIVE\nSystem Stability: 100%\n\nCongratulations, Specialist.\nYou have saved the system."
            }
        }
    }
};

// --- CORE FUNCTIONS ---

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

// Visual FX Trigger
function triggerGlitch() {
    terminalContainer.classList.add('glitch-active');
    setTimeout(() => terminalContainer.classList.remove('glitch-active'), 500);
}

function triggerSuccess() {
    terminalContainer.classList.add('restore-success');
    setTimeout(() => terminalContainer.classList.remove('restore-success'), 500);
}

// Text Garbler (for corrupted files)
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
    
    // Split by spaces, but respect user input
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
            // Handle different structure at root vs children
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
                    // Auto-read the file upon success
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

// --- INIT & LISTENERS ---

inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const input = inputField.value;
        commandHistory.push(input);
        historyIndex = commandHistory.length;
        processCommand(input);
        inputField.value = '';
    }
});

// Auto-focus logic
document.addEventListener('click', () => inputField.focus());

window.onload = () => {
    setTimeout(() => print(`Initializing Secure Connection...`), 500);
    setTimeout(() => print(`Entropy Seed: ${sessionID}`), 1200);
    setTimeout(() => print(`WARNING: Data Corruption Detected.`), 2000);
    setTimeout(() => print(`Type 'ls' to scan directory.`), 2800);
    inputField.focus();
};

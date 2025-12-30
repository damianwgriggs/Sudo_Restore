/* sudo_restore | script.js
   Core Logic: File System, Parser, and Entropy Engine
*/

// --- DOM ELEMENTS ---
const outputDiv = document.getElementById('terminal-output');
const inputField = document.getElementById('command-input');

// --- GAME STATE ---
let currentPath = []; // Empty array represents root
let commandHistory = [];
let historyIndex = -1;

// --- ENTROPY ENGINE (The USP) ---
// Uses Hardware Randomness via Web Crypto API
function generateEntropy(length = 8) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
}

// Generate a unique session ID for this playthrough
const sessionID = generateEntropy(12).toUpperCase();

// --- FILE SYSTEM STRUCTURE ---
// A nested object representing the directory tree
const fileSystem = {
    "READ_ME_FIRST.txt": {
        type: "file",
        content: `
SUBJECT: DATA RECOVERY INCIDENT #${sessionID}
FROM: SYSADMIN (DECEASED?)
TO: UNAUTHORIZED USER

If you are reading this, the containment protocols have failed. 

This server isn't just corrupted; it's evolving. 
I have locked the critical data in the /secure folder.
You need to find the encryption keys to RESTORE them.

Do not trust the glitched files.
        `
    },
    "logs": {
        type: "dir",
        children: {
            "boot_log.txt": { type: "file", content: "System Boot: OK\nEntropy Engine: OK\nCorruption detected in sector 7G." },
            "error.log": { type: "file", content: "CRITICAL: Segfault in memory address 0x" + generateEntropy(4) }
        }
    },
    "secure": {
        type: "dir",
        children: {
            // This is where the gameplay loop will eventually lead
            "project_chimera.enc": { type: "file", content: "ENCRYPTED DATA. USE 'RESTORE' COMMAND." }
        }
    }
};

// --- CORE FUNCTIONS ---

// 1. Helper to get the current directory object based on currentPath array
function getCurrentDir() {
    let current = fileSystem;
    for (const folder of currentPath) {
        if (current[folder] && current[folder].type === 'dir') {
            current = current[folder].children;
        } else if (current.children && current.children[folder]) { 
             // Handle case where we are traversing children objects
             current = current.children[folder].children;
        }
    }
    return current;
}

// 2. Output to Terminal (HTML handling for styling)
function print(text, className = '') {
    const div = document.createElement('div');
    div.className = 'line ' + className;
    // Replace newlines with HTML breaks for formatting
    div.innerHTML = text.replace(/\n/g, '<br>');
    outputDiv.appendChild(div);
    
    // Auto-scroll to bottom
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// 3. Command Parser
function processCommand(input) {
    if (!input) return;
    
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Echo the command to the screen
    print(`<span class="prompt">visitor@remote: ${getPathString()}$</span> ${input}`);

    switch (command) {
        case 'help':
            print("Available commands:");
            print("&nbsp; ls&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - List directory content");
            print("&nbsp; cd [dir] - Change directory (use .. to go back)");
            print("&nbsp; cat [file]- Read file content (or 'open')");
            print("&nbsp; clear&nbsp;&nbsp;&nbsp; - Clear terminal screen");
            break;

        case 'clear':
            outputDiv.innerHTML = '';
            break;

        case 'ls':
            const dir = getCurrentDir();
            // If we are at root (and fileSystem structure differs slightly), handle it
            // Simple iteration over keys:
            const items = currentPath.length === 0 ? fileSystem : dir;
            
            let output = '';
            for (const key in items) {
                const type = items[key].type;
                if (type === 'dir') {
                    output += `<span style="color: #008f11">${key}/</span>&nbsp;&nbsp;`;
                } else {
                    output += `${key}&nbsp;&nbsp;`;
                }
            }
            print(output || "(empty)");
            break;

        case 'cd':
            const target = args[0];
            if (!target) {
                print("Usage: cd [directory name]");
                break;
            }
            if (target === '..') {
                if (currentPath.length > 0) currentPath.pop();
            } else {
                const current = currentPath.length === 0 ? fileSystem : getCurrentDir();
                if (current[target] && current[target].type === 'dir') {
                    currentPath.push(target);
                } else {
                    print(`cd: ${target}: No such directory`);
                }
            }
            break;

        case 'cat':
        case 'open':
            const filename = args[0];
            if (!filename) {
                print("Usage: cat [filename]");
                break;
            }
            const currentObj = currentPath.length === 0 ? fileSystem : getCurrentDir();
            
            if (currentObj[filename] && currentObj[filename].type === 'file') {
                print(currentObj[filename].content, 'file-content');
            } else {
                print(`cat: ${filename}: No such file`);
            }
            break;

        case 'sudo':
            print("User not in the sudoers file. This incident will be reported.");
            break;
            
        default:
            print(`Command not found: ${command}`);
    }
}

// Helper to format path string for the prompt
function getPathString() {
    return currentPath.length === 0 ? "~" : "~/" + currentPath.join("/");
}

// --- EVENT LISTENERS ---

// Handle Enter Key
inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const input = inputField.value;
        commandHistory.push(input);
        historyIndex = commandHistory.length;
        processCommand(input);
        inputField.value = '';
    }
});

// Update prompt dynamically
inputField.addEventListener('input', () => {
    // Optional: Typewriter sound logic could go here
});

// --- INITIALIZATION ---
window.onload = () => {
    // Initial Boot Sequence Text
    setTimeout(() => print(`Initializing Secure Connection...`), 500);
    setTimeout(() => print(`Entropy Seed: ${sessionID}`), 1200);
    setTimeout(() => print(`User Recognized. Welcome.`), 2000);
    setTimeout(() => print(`TYPE 'help' FOR COMMANDS.`), 2800);
    
    inputField.focus();
};

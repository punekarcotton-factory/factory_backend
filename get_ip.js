const os = require('os');
const fs = require('fs');
const interfaces = os.networkInterfaces();
let ip = 'localhost';
for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
            ip = iface.address;
            break;
        }
    }
}
fs.writeFileSync('ip.txt', ip);
console.log('IP written to ip.txt:', ip);

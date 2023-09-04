const debug = true;

class Debug {
    static getCallerInfo() {
        const stack = new Error().stack.split('\n');
        const caller = stack[4] || 'Unknown';

        const match = /\(([^)]+):(\d+):\d+\)/.exec(caller);
        if (match) {
            const fullPath = match[1];
            const lineNumber = match[2];
            let scriptName = fullPath.split('/').pop();
            scriptName = scriptName.replace('.js', '');
            return `${scriptName}:${lineNumber}`;
        }

        return 'Unknown';
    }

    static formatTime() {
        const date = new Date();
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    }

    static formatMessage(level, message) {
        if (message && typeof message === 'object') 
            message = JSON.stringify(message);
        const timestamp = Debug.formatTime();
        const callerInfo = Debug.getCallerInfo();
        return `[${timestamp}] [${level}] [${callerInfo}]: ${message}`;
    }

    static debug(message) {
        if (!debug) return;
        
        console.debug(Debug.formatMessage('DEBUG', message));
    }

    static log(message) {
        console.log(Debug.formatMessage('LOG', message));
    }

    static warning(message) {
        console.warn(Debug.formatMessage('WARNING', message));
    }

    static error(message) {
        console.error(Debug.formatMessage('ERROR', message));
    }
}


module.exports = Debug;
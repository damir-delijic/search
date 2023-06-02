module.exports = {
    startManager: function(appDirname){
        
        /* Read config file */
        let pathtoconfig = appDirname + '\\config.json';
        let fs = require('fs');
        const config = JSON.parse(fs.readFileSync(pathtoconfig, 'utf8'));

        /* Initialize structures */
        const Manager = require('./manager');
        var cManager = new Manager(config);

        return cManager;
    }
}
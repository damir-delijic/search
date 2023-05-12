
module.exports = class PostingList{

    // put do json fajla
    constructor(filepath){
        this.filepath = filepath;
        this.readIndex();
    }

    insert(){

    }

    delete(){

    }

    update(){
        
    }

    readIndex(){
        let fs = require('fs');
        this.dict = JSON.parse(fs.readFileSync(this.filepath, 'utf8'));
    }
}

